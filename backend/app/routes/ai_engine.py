from datetime import datetime, timezone
import math
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.database import get_database
from app.routes.auth import get_approved_user, require_role, log_activity
from app.models.user import UserRole
from app.services.ai_service import AIService
from app.services.notification_service import NotificationService

router = APIRouter()

class ScanVerificationRequest(BaseModel):
    serial_number: str
    location_name: str
    latitude: float
    longitude: float

class PredictRiskRequest(BaseModel):
    supplier_rating: float
    price_discrepancy_percent: float
    transit_temp_anomaly: bool
    failed_scans: int

def calculate_haversine_distance(lat1, lon1, lat2, lon2):
    # Radius of the Earth in km
    R = 6371.0
    
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    distance = R * c
    return distance

@router.post("/scan-verify")
async def verify_serial_ai(req: ScanVerificationRequest):
    db = get_database()
    
    # 1. Fetch serial ledger record
    scan_ledger = await db.scans.find_one({"serial_number": req.serial_number})
    if not scan_ledger:
        # If QR serial number is not in system, it is an immediate critical anomaly!
        report_id = f"REP-{ObjectId()}"[:15].upper()
        # Log to counterfeit reports
        await db.counterfeit_reports.insert_one({
            "report_id": report_id,
            "serial_number": req.serial_number,
            "reporter_role": "Consumer",
            "location_name": req.location_name,
            "latitude": req.latitude,
            "longitude": req.longitude,
            "description": "Invalid/Unregistered QR Serial scanned.",
            "risk_level": "Critical",
            "status": "Confirmed Counterfeit",
            "created_at": datetime.now(timezone.utc)
        })
        
        # Trigger regulatory notification
        regulator_cursor = db.users.find({"role": UserRole.REGULATOR})
        regulators = []
        async for r in regulator_cursor:
            regulators.append({"email": r["email"], "phone_number": r.get("phone_number")})
        
        NotificationService.send_email(
            to_email="regulator-alerts@mediclear.gov",
            subject="CRITICAL ALERT: Unregistered QR Code Scanned",
            body=f"An unregistered QR serial number ({req.serial_number}) was scanned at {req.location_name}. Verification failed."
        )
        
        return {
            "status": "Counterfeit / Invalid",
            "is_anomaly": True,
            "confidence_score": 100.0,
            "reason": "QR Code was not issued by any registered manufacturer in this supply chain network.",
            "timeline": []
        }

    # 2. Extract batch & expiry
    batch = await db.batches.find_one({"batch_number": scan_ledger["batch_number"]})
    medicine = await db.medicines.find_one({"sku": scan_ledger["sku"]}) if batch else None
    
    is_expired = False
    if batch:
        # Handle datetime comparison (ensuring tz aware comparison)
        expiry_dt = batch["expiry_date"]
        if expiry_dt.tzinfo is None:
            expiry_dt = expiry_dt.replace(tzinfo=timezone.utc)
        is_expired = datetime.now(timezone.utc) > expiry_dt

    # 3. Calculate features
    scan_count = scan_ledger.get("scan_count", 0) + 1
    
    # Hours since last scan
    hours_since_last_scan = 0.0
    last_scanned = scan_ledger.get("last_scanned")
    if last_scanned:
        if last_scanned.tzinfo is None:
            last_scanned = last_scanned.replace(tzinfo=timezone.utc)
        time_diff = datetime.now(timezone.utc) - last_scanned
        hours_since_last_scan = time_diff.total_seconds() / 3600.0
        
    # Distance from last scan
    distance_km = 0.0
    locations = scan_ledger.get("locations", [])
    if locations:
        last_loc = locations[-1]
        distance_km = calculate_haversine_distance(
            last_loc.get("lat", 0.0), last_loc.get("lng", 0.0),
            req.latitude, req.longitude
        )
        
    # Location count
    location_names = [loc.get("name") for loc in locations]
    if req.location_name not in location_names:
        location_names.append(req.location_name)
    location_count = len(set(location_names))

    # 4. Invoke AI detector
    anomaly_result = AIService.detect_scan_anomaly(
        scan_count=scan_count,
        hours_since_last_scan=hours_since_last_scan,
        distance_km=distance_km,
        is_expired=is_expired,
        location_count=location_count
    )

    # 5. Log updates in DB
    loc_entry = {
        "name": req.location_name,
        "lat": req.latitude,
        "lng": req.longitude,
        "timestamp": datetime.now(timezone.utc)
    }
    
    await db.scans.update_one(
        {"serial_number": req.serial_number},
        {
            "$set": {
                "scan_count": scan_count,
                "last_scanned": datetime.now(timezone.utc),
                "is_anomaly": anomaly_result["is_anomaly"],
                "status": "Flagged Anomalous" if anomaly_result["is_anomaly"] else "Authentic"
            },
            "$push": {
                "locations": loc_entry,
                "timestamps": datetime.now(timezone.utc)
            }
        }
    )

    # 6. Create report if anomaly detected
    if anomaly_result["is_anomaly"]:
        report_id = f"REP-{ObjectId()}"[:15].upper()
        await db.counterfeit_reports.insert_one({
            "report_id": report_id,
            "serial_number": req.serial_number,
            "medicine_name": medicine["name"] if medicine else "Unknown",
            "batch_number": scan_ledger["batch_number"],
            "reporter_role": "Consumer",
            "location_name": req.location_name,
            "latitude": req.latitude,
            "longitude": req.longitude,
            "description": f"AI flagged anomaly: {anomaly_result['reason']}",
            "risk_level": "High" if scan_count < 10 else "Critical",
            "status": "Pending Investigation",
            "created_at": datetime.now(timezone.utc)
        })
        
        # Trigger regulatory notification
        NotificationService.send_email(
            to_email="alerts@mediclear-regulatory.gov",
            subject=f"AI SECURITY EXCEPTION: Suspicious QR Verification Activity",
            body=(
                f"Batch {scan_ledger['batch_number']} of drug {medicine['name'] if medicine else 'N/A'} "
                f"triggered an anomaly exception alert. Scan Location: {req.location_name}. "
                f"Confidence Score: {anomaly_result['confidence']*100:.1f}%. Details: {anomaly_result['reason']}."
            )
        )

    # Get manufacturer info for return
    mfg_name = "Unknown Manufacturer"
    if medicine:
        mfg = await db.users.find_one({"_id": ObjectId(medicine["manufacturer_id"])})
        if mfg:
            mfg_name = mfg["full_name"]

    return {
        "serial_number": req.serial_number,
        "batch_number": scan_ledger["batch_number"],
        "is_anomaly": anomaly_result["is_anomaly"],
        "confidence_score": round((1.0 - anomaly_result["confidence"]) * 100.0, 1) if anomaly_result["is_anomaly"] else round(anomaly_result["confidence"] * 100.0, 1),
        "reason": anomaly_result["reason"],
        "medicine": {
            "name": medicine["name"] if medicine else "Unknown",
            "formulation": medicine["formulation"] if medicine else "Unknown",
            "strength": medicine["strength"] if medicine else "Unknown",
            "manufacturer_name": mfg_name,
            "expiry_date": batch["expiry_date"].isoformat() if batch else "Unknown"
        } if medicine else None
    }

@router.post("/predict-risk")
async def predict_risk(
    req: PredictRiskRequest,
    user: dict = Depends(require_role([UserRole.REGULATOR, UserRole.MANUFACTURER]))
):
    # Runs random forest classification
    risk_assessment = AIService.calculate_risk_score(
        supplier_rating=req.supplier_rating,
        price_discrepancy_percent=req.price_discrepancy_percent,
        transit_temp_anomaly=req.transit_temp_anomaly,
        failed_scans=req.failed_scans
    )
    return risk_assessment

@router.get("/anomalies")
async def list_ai_anomalies(
    user: dict = Depends(require_role([UserRole.REGULATOR]))
):
    db = get_database()
    cursor = db.scans.find({"is_anomaly": True})
    anomalies = []
    async for a in cursor:
        a["_id"] = str(a["_id"])
        if a.get("last_scanned"):
            a["last_scanned"] = a["last_scanned"].isoformat()
        anomalies.append(a)
    return anomalies
from bson import ObjectId
