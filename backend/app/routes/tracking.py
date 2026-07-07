from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from bson import ObjectId

from app.core.database import get_database
from app.routes.auth import get_approved_user, require_role, log_activity
from app.models.user import UserRole
from app.models.shipment import ShipmentCreate, ShipmentResponse, ShipmentStatus, TimelineEvent, GeoCoordinates

router = APIRouter()

class UpdateLocationRequest(BaseModel):
    location: str
    coordinates: Optional[GeoCoordinates] = None

class ReceiveShipmentRequest(BaseModel):
    location: str
    coordinates: Optional[GeoCoordinates] = None

# Create a new shipment
@router.post("/shipments", response_model=ShipmentResponse, status_code=status.HTTP_201_CREATED)
async def create_shipment(
    ship: ShipmentCreate,
    user: dict = Depends(get_approved_user)
):
    db = get_database()
    
    # Enforce role logic: Only Manufacturer and Distributor can create shipments
    if user["role"] not in [UserRole.MANUFACTURER, UserRole.DISTRIBUTOR]:
        raise HTTPException(
            status_code=403, 
            detail="Only Manufacturers and Distributors can initiate shipments."
        )
        
    # Check receiver exists
    receiver = await db.users.find_one({"_id": ObjectId(ship.receiver_id)}) if ObjectId.is_valid(ship.receiver_id) else None
    if not receiver:
        raise HTTPException(status_code=404, detail="Recipient user account not found.")
        
    # Validation: Enforce Manufacturer -> Distributor or Distributor -> Pharmacy flows
    if user["role"] == UserRole.MANUFACTURER and receiver["role"] != UserRole.DISTRIBUTOR:
        raise HTTPException(status_code=400, detail="Manufacturers can only ship to Distributors.")
    if user["role"] == UserRole.DISTRIBUTOR and receiver["role"] != UserRole.PHARMACY:
        raise HTTPException(status_code=400, detail="Distributors can only ship to Pharmacies.")

    # Check batch exists
    batch = await db.batches.find_one({"batch_number": ship.batch_number})
    if not batch:
        raise HTTPException(status_code=404, detail="Specified batch does not exist.")

    # Validate serial numbers belong to the batch
    for serial in ship.serial_numbers:
        if serial not in batch["serial_numbers"]:
            raise HTTPException(
                status_code=400, 
                detail=f"Serial '{serial}' does not belong to batch '{ship.batch_number}'."
            )
            
        # Verify ownership: check that the current owner of this serial in db.scans is indeed the sender
        scan_ledger = await db.scans.find_one({"serial_number": serial})
        if scan_ledger and scan_ledger.get("current_owner_id"):
            if scan_ledger["current_owner_id"] != str(user["_id"]):
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot ship serial '{serial}'. You do not currently hold custody of it."
                )

    shipment_id = f"SH-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{ObjectId()}"[:20].upper()
    
    timeline_event = TimelineEvent(
        action="Shipped",
        actor_id=str(user["_id"]),
        actor_name=user["full_name"],
        role=user["role"],
        location=ship.location,
        coordinates=ship.coordinates,
        timestamp=datetime.now(timezone.utc)
    )
    
    shipment_dict = {
        "shipment_id": shipment_id,
        "batch_number": ship.batch_number,
        "medicine_sku": batch["medicine_sku"],
        "sender_id": str(user["_id"]),
        "receiver_id": ship.receiver_id,
        "status": ShipmentStatus.IN_TRANSIT,
        "serial_numbers": ship.serial_numbers,
        "timeline": [timeline_event.model_dump()],
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    result = await db.shipments.insert_one(shipment_dict)
    shipment_dict["_id"] = str(result.inserted_id)

    # Update ledger records: Set status to 'In Transit' and log sender as historical custodian
    for serial in ship.serial_numbers:
        await db.scans.update_one(
            {"serial_number": serial},
            {"$set": {
                "status": "In Transit",
                "current_owner_id": str(user["_id"]),
                "current_owner_name": user["full_name"],
                "current_owner_role": user["role"]
            }}
        )

    await log_activity(
        username=user["username"],
        role=user["role"],
        action="SHIPMENT_CREATE",
        details=f"Initiated Shipment {shipment_id} to {receiver['full_name']} with {len(ship.serial_numbers)} items.",
        user_id=str(user["_id"])
    )
    
    return shipment_dict

# Get list of shipments (outgoing and incoming)
@router.get("/shipments", response_model=List[ShipmentResponse])
async def list_shipments(
    user: dict = Depends(get_approved_user)
):
    db = get_database()
    uid = str(user["_id"])
    
    query = {
        "$or": [
            {"sender_id": uid},
            {"receiver_id": uid}
        ]
    }
    
    # Regulator sees all shipments
    if user["role"] == UserRole.REGULATOR:
        query = {}
        
    cursor = db.shipments.find(query).sort("updated_at", -1)
    shipments = []
    async for s in cursor:
        s["_id"] = str(s["_id"])
        shipments.append(s)
    return shipments

# Update shipment current location in-transit
@router.put("/shipments/{shipment_id}/location", response_model=ShipmentResponse)
async def update_shipment_location(
    shipment_id: str,
    req: UpdateLocationRequest,
    user: dict = Depends(require_role([UserRole.MANUFACTURER, UserRole.DISTRIBUTOR]))
):
    db = get_database()
    shipment = await db.shipments.find_one({"shipment_id": shipment_id})
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found.")
        
    if shipment["sender_id"] != str(user["_id"]):
        raise HTTPException(status_code=403, detail="Only the sender of the shipment can update transit locations.")
        
    if shipment["status"] != ShipmentStatus.IN_TRANSIT:
        raise HTTPException(status_code=400, detail="Transit location updates are only valid for In Transit shipments.")

    event = TimelineEvent(
        action="Transit Update",
        actor_id=str(user["_id"]),
        actor_name=user["full_name"],
        role=user["role"],
        location=req.location,
        coordinates=req.coordinates,
        timestamp=datetime.now(timezone.utc)
    )

    await db.shipments.update_one(
        {"shipment_id": shipment_id},
        {
            "$push": {"timeline": event.model_dump()},
            "$set": {"updated_at": datetime.now(timezone.utc)}
        }
    )
    
    updated = await db.shipments.find_one({"shipment_id": shipment_id})
    updated["_id"] = str(updated["_id"])
    return updated

# Confirm custody delivery (Receive Shipment)
@router.put("/shipments/{shipment_id}/receive", response_model=ShipmentResponse)
async def receive_shipment(
    shipment_id: str,
    req: ReceiveShipmentRequest,
    user: dict = Depends(get_approved_user)
):
    db = get_database()
    shipment = await db.shipments.find_one({"shipment_id": shipment_id})
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found.")
        
    if shipment["receiver_id"] != str(user["_id"]):
        raise HTTPException(status_code=403, detail="You are not authorized to receive this shipment.")
        
    if shipment["status"] != ShipmentStatus.IN_TRANSIT:
        raise HTTPException(status_code=400, detail="Only shipments in transit can be received.")

    event = TimelineEvent(
        action="Received",
        actor_id=str(user["_id"]),
        actor_name=user["full_name"],
        role=user["role"],
        location=req.location,
        coordinates=req.coordinates,
        timestamp=datetime.now(timezone.utc)
    )

    await db.shipments.update_one(
        {"shipment_id": shipment_id},
        {
            "$push": {"timeline": event.model_dump()},
            "$set": {
                "status": ShipmentStatus.DELIVERED,
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )
    
    # Update current owner of serial numbers in scans ledger
    for serial in shipment["serial_numbers"]:
        await db.scans.update_one(
            {"serial_number": serial},
            {"$set": {
                "status": "Delivered",
                "current_owner_id": str(user["_id"]),
                "current_owner_name": user["full_name"],
                "current_owner_role": user["role"]
            }}
        )

    await log_activity(
        username=user["username"],
        role=user["role"],
        action="SHIPMENT_RECEIVE",
        details=f"Received Shipment {shipment_id} successfully, taking ownership.",
        user_id=str(user["_id"])
    )

    updated = await db.shipments.find_one({"shipment_id": shipment_id})
    updated["_id"] = str(updated["_id"])
    return updated

# Get verification timeline for a specific serial number
@router.get("/verify/{serial_number}/timeline")
async def get_serial_timeline(serial_number: str):
    db = get_database()
    
    # Verify scan ledger exists
    scan_ledger = await db.scans.find_one({"serial_number": serial_number})
    if not scan_ledger:
        raise HTTPException(status_code=404, detail="Serial number not found in ledger.")
        
    # Get all shipments containing this serial number, sorted by date
    cursor = db.shipments.find({"serial_numbers": serial_number}).sort("created_at", 1)
    
    full_timeline = []
    async for shipment in cursor:
        for event in shipment["timeline"]:
            event["shipment_id"] = shipment["shipment_id"]
            full_timeline.append(event)
            
    # Sort composite timeline by timestamp
    full_timeline = sorted(full_timeline, key=lambda x: x["timestamp"])
    
    # Get batch and medicine details
    batch = await db.batches.find_one({"batch_number": scan_ledger["batch_number"]})
    medicine = await db.medicines.find_one({"sku": scan_ledger["sku"]}) if batch else None
    
    manufacturer_name = "Unknown Manufacturer"
    if medicine:
        mfg_user = await db.users.find_one({"_id": ObjectId(medicine["manufacturer_id"])})
        if mfg_user:
            manufacturer_name = mfg_user["full_name"]
            
    return {
        "serial_number": serial_number,
        "batch_number": scan_ledger["batch_number"],
        "status": scan_ledger["status"],
        "scan_count": scan_ledger.get("scan_count", 0),
        "is_anomaly": scan_ledger.get("is_anomaly", False),
        "medicine": {
            "name": medicine["name"] if medicine else "Unknown",
            "formulation": medicine["formulation"] if medicine else "Unknown",
            "strength": medicine["strength"] if medicine else "Unknown",
            "manufacturer_name": manufacturer_name
        } if medicine else None,
        "timeline": full_timeline
    }
