import csv
import io
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from bson import ObjectId

from app.core.database import get_database
from app.routes.auth import require_role, log_activity, get_approved_user
from app.models.user import UserRole
from app.models.medicine import MedicineCreate, MedicineResponse
from app.models.batch import BatchCreate, BatchResponse, BatchStatus
from app.services.qr_service import QRService

router = APIRouter()

# ----------------- Medicine Catalog -----------------

@router.post("/catalog", response_model=MedicineResponse, status_code=status.HTTP_201_CREATED)
async def create_medicine(
    med: MedicineCreate,
    user: dict = Depends(require_role([UserRole.MANUFACTURER]))
):
    db = get_database()
    
    # Check if SKU already exists
    existing = await db.medicines.find_one({"sku": med.sku})
    if existing:
        raise HTTPException(status_code=400, detail=f"Medicine SKU '{med.sku}' already exists.")
        
    med_dict = med.model_dump()
    med_dict["manufacturer_id"] = str(user["_id"])
    med_dict["created_at"] = datetime.now(timezone.utc)
    
    result = await db.medicines.insert_one(med_dict)
    med_dict["_id"] = str(result.inserted_id)
    
    await log_activity(
        username=user["username"],
        role=user["role"],
        action="MEDICINE_CATALOG_CREATE",
        details=f"Created medicine listing: {med.name} (SKU: {med.sku})",
        user_id=str(user["_id"])
    )
    return med_dict

@router.get("/catalog", response_model=List[MedicineResponse])
async def list_catalog():
    db = get_database()
    cursor = db.medicines.find()
    catalog = []
    async for item in cursor:
        item["_id"] = str(item["_id"])
        catalog.append(item)
    return catalog

# ----------------- Batches & QR Serialization -----------------

async def generate_batch_serials_and_qrs(batch_num: str, sku: str, quantity: int) -> List[str]:
    """
    Generates unique serial numbers for a batch.
    Format: MC-{SKU}-{BATCH_NUMBER}-{SERIAL_INDEX}
    Stores placeholder info in db.scans for each serial.
    """
    db = get_database()
    serials = []
    
    # Batch inserts of scans for better performance
    scans_to_insert = []
    
    for i in range(1, quantity + 1):
        serial = f"MC-{sku}-{batch_num}-{i:04d}"
        serials.append(serial)
        
        # Insert a scan ledger record for tracking scanning history
        scans_to_insert.append({
            "serial_number": serial,
            "batch_number": batch_num,
            "sku": sku,
            "scan_count": 0,
            "locations": [],
            "timestamps": [],
            "last_scanned": None,
            "status": "Authentic",
            "is_anomaly": False
        })
        
    if scans_to_insert:
        await db.scans.insert_many(scans_to_insert)
        
    return serials

@router.post("/batches", response_model=BatchResponse, status_code=status.HTTP_201_CREATED)
async def create_batch(
    batch: BatchCreate,
    user: dict = Depends(require_role([UserRole.MANUFACTURER]))
):
    db = get_database()
    
    # Check if batch exists
    existing = await db.batches.find_one({"batch_number": batch.batch_number})
    if existing:
        raise HTTPException(status_code=400, detail=f"Batch number '{batch.batch_number}' already registered.")
        
    # Check SKU exists
    med = await db.medicines.find_one({"sku": batch.medicine_sku})
    if not med:
        raise HTTPException(status_code=404, detail=f"Medicine SKU '{batch.medicine_sku}' does not exist in catalog.")
        
    batch_dict = batch.model_dump()
    batch_dict["manufacturer_id"] = str(user["_id"])
    batch_dict["status"] = BatchStatus.ACTIVE
    batch_dict["created_at"] = datetime.now(timezone.utc)
    
    # Generate Serials
    serials = await generate_batch_serials_and_qrs(batch.batch_number, batch.medicine_sku, batch.quantity)
    batch_dict["serial_numbers"] = serials
    
    result = await db.batches.insert_one(batch_dict)
    batch_dict["_id"] = str(result.inserted_id)
    
    await log_activity(
        username=user["username"],
        role=user["role"],
        action="BATCH_CREATE",
        details=f"Created batch {batch.batch_number} with {batch.quantity} serialized units for SKU {batch.medicine_sku}",
        user_id=str(user["_id"])
    )
    return batch_dict

# Bulk CSV Upload
@router.post("/batches/bulk-csv", status_code=status.HTTP_201_CREATED)
async def bulk_upload_batches(
    file: UploadFile = File(...),
    user: dict = Depends(require_role([UserRole.MANUFACTURER]))
):
    db = get_database()
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")
        
    contents = await file.read()
    decoded = contents.decode('utf-8')
    csv_reader = csv.DictReader(io.StringIO(decoded))
    
    created_batches = []
    errors = []
    
    # CSV format: batch_number, medicine_sku, quantity, manufacture_date, expiry_date
    for row_idx, row in enumerate(csv_reader):
        try:
            batch_num = row.get("batch_number")
            sku = row.get("medicine_sku")
            quantity_str = row.get("quantity")
            mfg_date_str = row.get("manufacture_date")
            exp_date_str = row.get("expiry_date")
            
            if not all([batch_num, sku, quantity_str, mfg_date_str, exp_date_str]):
                raise ValueError("Missing columns.")
                
            qty = int(quantity_str)
            # Parse dates e.g. YYYY-MM-DD
            mfg_dt = datetime.strptime(mfg_date_str.strip(), "%Y-%m-%d")
            exp_dt = datetime.strptime(exp_date_str.strip(), "%Y-%m-%d")
            
            # Check duplicate batch_number
            existing_batch = await db.batches.find_one({"batch_number": batch_num})
            if existing_batch:
                errors.append(f"Row {row_idx + 1}: Batch number '{batch_num}' already registered.")
                continue
                
            # Check SKU exists
            med = await db.medicines.find_one({"sku": sku})
            if not med:
                errors.append(f"Row {row_idx + 1}: SKU '{sku}' not found in catalog.")
                continue
                
            serials = await generate_batch_serials_and_qrs(batch_num, sku, qty)
            
            batch_dict = {
                "batch_number": batch_num,
                "medicine_sku": sku,
                "quantity": qty,
                "manufacture_date": mfg_dt,
                "expiry_date": exp_dt,
                "manufacturer_id": str(user["_id"]),
                "status": BatchStatus.ACTIVE,
                "created_at": datetime.now(timezone.utc),
                "serial_numbers": serials
            }
            
            result = await db.batches.insert_one(batch_dict)
            batch_dict["_id"] = str(result.inserted_id)
            created_batches.append(batch_dict["batch_number"])
            
        except Exception as e:
            errors.append(f"Row {row_idx + 1}: {str(e)}")
            
    if len(created_batches) == 0:
        raise HTTPException(status_code=400, detail={"message": "No batches created.", "errors": errors})
        
    await log_activity(
        username=user["username"],
        role=user["role"],
        action="BATCH_BULK_UPLOAD",
        details=f"Uploaded batches: {', '.join(created_batches)}",
        user_id=str(user["_id"])
    )
    
    return {
        "message": f"Successfully created {len(created_batches)} batches.",
        "created_batches": created_batches,
        "errors": errors
    }

# Get list of batches
@router.get("/batches", response_model=List[BatchResponse])
async def list_batches(
    user: dict = Depends(get_approved_user)
):
    db = get_database()
    query = {}
    
    # Manufacturers see only their batches
    if user["role"] == UserRole.MANUFACTURER:
        query = {"manufacturer_id": str(user["_id"])}
        
    cursor = db.batches.find(query)
    batches = []
    async for b in cursor:
        b["_id"] = str(b["_id"])
        batches.append(b)
    return batches

# Get single batch details & generate QR downloads
@router.get("/batches/{batch_num}")
async def get_batch_details(
    batch_num: str,
    user: dict = Depends(get_approved_user)
):
    db = get_database()
    batch = await db.batches.find_one({"batch_number": batch_num})
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found.")
        
    batch["_id"] = str(batch["_id"])
    
    # Retrieve QR codes (base64 string list) for visual listing
    qrs = []
    for s in batch["serial_numbers"][:50]:  # Limit base64s to first 50 to avoid bloated payloads
        qrs.append({
            "serial": s,
            "qr_base64": QRService.generate_qr_base64(s)
        })
        
    return {
        "batch": batch,
        "qrs": qrs,
        "total_qrs_count": len(batch["serial_numbers"])
    }

# Retrieve specific single QR code label as download link
@router.get("/batches/{batch_num}/serials/{serial}/qr-download")
async def get_qr_download(
    batch_num: str,
    serial: str,
    user: dict = Depends(get_approved_user)
):
    db = get_database()
    # verify serial matches batch
    batch = await db.batches.find_one({"batch_number": batch_num, "serial_numbers": serial})
    if not batch:
        raise HTTPException(status_code=404, detail="Serial not found in specified batch.")
        
    qr_base64 = QRService.generate_qr_base64(serial)
    return {"serial": serial, "qr_base64": qr_base64}
