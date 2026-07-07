from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from bson import ObjectId

from app.core.database import get_database
from app.models.counterfeit_report import CounterfeitReportCreate
from app.services.notification_service import NotificationService

router = APIRouter()

class FeedbackSubmit(BaseModel):
    serial_number: str
    rating: int  # 1 to 5
    comments: str

# Instant medicine verification for consumers (Unauthenticated)
@router.get("/verify/{serial_number}")
async def public_verify_medicine(serial_number: str):
    db = get_database()
    
    # Look up serial number in ledger
    scan_ledger = await db.scans.find_one({"serial_number": serial_number})
    if not scan_ledger:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="QR Serial number not found in system. This product is highly likely counterfeit."
        )
        
    # Get batch details
    batch = await db.batches.find_one({"batch_number": scan_ledger["batch_number"]})
    if not batch:
         raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Manufacturing batch record not found."
         )
         
    # Get medicine details
    medicine = await db.medicines.find_one({"sku": scan_ledger["sku"]})
    if not medicine:
         raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Medicine catalog profile not found."
         )
         
    # Get manufacturer details
    manufacturer_name = "Unknown Manufacturer"
    mfg_user = await db.users.find_one({"_id": ObjectId(medicine["manufacturer_id"])})
    if mfg_user:
        manufacturer_name = mfg_user["full_name"]
        
    # Check if the batch has been recalled
    is_recalled = (batch["status"] == "Recalled")
    
    # Calculate safety evaluation
    safety_status = "Authentic"
    safety_message = "This medicine is verified as authentic and safe for consumption."
    
    if is_recalled:
        safety_status = "RECALLED"
        safety_message = "WARNING: This batch has been officially RECALLED by the Regulatory Authority. Do not consume."
    elif scan_ledger.get("is_anomaly", False):
        safety_status = "Suspicious"
        safety_message = "CAUTION: This unit has been flagged as suspicious by our AI verification systems due to anomaly scans."
        
    # Verify expiration
    expiry_dt = batch["expiry_date"]
    if expiry_dt.tzinfo is None:
        expiry_dt = expiry_dt.replace(tzinfo=timezone.utc)
    is_expired = datetime.now(timezone.utc) > expiry_dt
    
    if is_expired:
        safety_status = "EXPIRED"
        safety_message = f"WARNING: This medicine expired on {batch['expiry_date'].strftime('%Y-%m-%d')}. Do not consume."

    # Return full profile
    return {
        "serial_number": serial_number,
        "batch_number": scan_ledger["batch_number"],
        "safety_status": safety_status,
        "safety_message": safety_message,
        "is_recalled": is_recalled,
        "is_expired": is_expired,
        "medicine": {
            "name": medicine["name"],
            "generic_name": medicine["generic_name"],
            "sku": medicine["sku"],
            "formulation": medicine["formulation"],
            "strength": medicine["strength"],
            "description": medicine.get("description", ""),
            "manufacturer_name": manufacturer_name,
            "manufacture_date": batch["manufacture_date"].isoformat(),
            "expiry_date": batch["expiry_date"].isoformat()
        }
    }

# Counterfeit Reporting (Unauthenticated)
@router.post("/report", status_code=status.HTTP_201_CREATED)
async def submit_counterfeit_report(report: CounterfeitReportCreate):
    db = get_database()
    
    report_dict = report.model_dump()
    report_id = f"REP-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{ObjectId()}"[:20].upper()
    
    report_dict["report_id"] = report_id
    report_dict["status"] = "Pending Investigation"
    report_dict["created_at"] = datetime.now(timezone.utc)
    
    await db.counterfeit_reports.insert_one(report_dict)
    
    # Notify Regulatory authorities immediately
    NotificationService.send_email(
        to_email="recalls-alerts@mediclear.gov",
        subject=f"ALERT: Counterfeit Medicine Reported - {report.serial_number}",
        body=(
            f"A suspicious product scan was reported by a consumer at {report.location_name}.\n\n"
            f"Details:\n"
            f"- Serial Number: {report.serial_number}\n"
            f"- Declared Batch: {report.batch_number or 'Unknown'}\n"
            f"- Description: {report.description}\n\n"
            f"Please review the Incident Management Board."
        )
    )
    
    return {
        "message": "Report submitted successfully. Regulatory agents have been notified.",
        "report_id": report_id
    }

# Submit feedback on verified medicines
@router.post("/feedback", status_code=status.HTTP_201_CREATED)
async def submit_feedback(fb: FeedbackSubmit):
    db = get_database()
    
    # Insert feedback
    await db.feedbacks.insert_one({
        "serial_number": fb.serial_number,
        "rating": fb.rating,
        "comments": fb.comments,
        "created_at": datetime.now(timezone.utc)
    })
    
    return {"message": "Feedback submitted successfully."}
