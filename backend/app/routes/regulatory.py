from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Response, status
from bson import ObjectId

from app.core.database import get_database
from app.routes.auth import require_role, log_activity
from app.models.user import UserRole, UserStatus
from app.services.pdf_service import PDFService
from app.services.notification_service import NotificationService

router = APIRouter()

# 1. System stats dashboard
@router.get("/dashboard-stats")
async def get_dashboard_stats(
    user: dict = Depends(require_role([UserRole.REGULATOR]))
):
    db = get_database()
    
    total_users = await db.users.count_documents({})
    total_batches = await db.batches.count_documents({})
    active_recalls = await db.batches.count_documents({"status": "Recalled"})
    total_reports = await db.counterfeit_reports.count_documents({})
    
    # Calculate anomaly rate
    total_scans = await db.scans.count_documents({})
    anomalous_scans = await db.scans.count_documents({"is_anomaly": True})
    anomaly_rate = (anomalous_scans / total_scans * 100.0) if total_scans > 0 else 0.0
    
    return {
        "total_users": total_users,
        "total_batches": total_batches,
        "active_recalls": active_recalls,
        "total_reports": total_reports,
        "anomaly_rate": round(anomaly_rate, 2)
    }

# 2. Identify High Risk Suppliers (Manufacturers with multiple recalls or anomalies)
@router.get("/high-risk-suppliers")
async def get_high_risk_suppliers(
    user: dict = Depends(require_role([UserRole.REGULATOR]))
):
    db = get_database()
    
    # Simple aggregation: count number of recalls by manufacturer
    pipeline = [
        {"$match": {"status": "Recalled"}},
        {"$group": {"_id": "$manufacturer_id", "recall_count": {"$sum": 1}}},
        {"$sort": {"recall_count": -1}}
    ]
    
    cursor = db.batches.aggregate(pipeline)
    high_risk = []
    
    async for item in cursor:
        mfg_id = item["_id"]
        # Fetch manufacturer name
        mfg = await db.users.find_one({"_id": ObjectId(mfg_id)}) if ObjectId.is_valid(mfg_id) else None
        
        # Count total batches
        total_mfg_batches = await db.batches.count_documents({"manufacturer_id": mfg_id})
        recall_rate = (item["recall_count"] / total_mfg_batches * 100.0) if total_mfg_batches > 0 else 0.0
        
        high_risk.append({
            "manufacturer_id": mfg_id,
            "manufacturer_name": mfg["full_name"] if mfg else "Unknown Manufacturer",
            "organization": mfg["organization"] if mfg else "N/A",
            "email": mfg["email"] if mfg else "N/A",
            "recall_count": item["recall_count"],
            "total_batches": total_mfg_batches,
            "recall_rate": round(recall_rate, 1),
            "risk_status": "High Risk" if recall_rate > 20 or item["recall_count"] >= 3 else "Medium Risk"
        })
        
    return high_risk

# 3. Automated recall system trigger
@router.post("/recall/{batch_number}")
async def issue_batch_recall(
    batch_number: str,
    user: dict = Depends(require_role([UserRole.REGULATOR]))
):
    db = get_database()
    
    batch = await db.batches.find_one({"batch_number": batch_number})
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found.")
        
    if batch["status"] == "Recalled":
        return {"message": f"Batch {batch_number} has already been recalled."}
        
    # Update batch status
    await db.batches.update_one(
        {"batch_number": batch_number},
        {"$set": {"status": "Recalled"}}
    )
    
    # Update all shipments matching this batch to Recalled
    await db.shipments.update_many(
        {"batch_number": batch_number},
        {"$set": {"status": "Recalled"}}
    )
    
    # Update serials status in scans ledger to Recalled
    await db.scans.update_many(
        {"batch_number": batch_number},
        {"$set": {"status": "Recalled"}}
    )

    # Get manufacturer info
    medicine = await db.medicines.find_one({"sku": batch["medicine_sku"]})
    medicine_name = medicine["name"] if medicine else "Unknown Medicine"
    
    # Trace supply chain nodes holding custody of this batch
    # Gather sender and receiver IDs from shipments of this batch
    stakeholder_ids = set()
    cursor = db.shipments.find({"batch_number": batch_number})
    async for s in cursor:
        stakeholder_ids.add(s["sender_id"])
        stakeholder_ids.add(s["receiver_id"])
        
    # Get emails & phones of stakeholders
    stakeholders = []
    for s_id in stakeholder_ids:
        if ObjectId.is_valid(s_id):
            stakeholder = await db.users.find_one({"_id": ObjectId(s_id)})
            if stakeholder:
                stakeholders.append({
                    "email": stakeholder["email"],
                    "phone_number": stakeholder.get("phone_number")
                })
                
    # Broadcast recall notifications
    NotificationService.notify_recall(
        batch_number=batch_number,
        stakeholders=stakeholders,
        medicine_name=medicine_name
    )
    
    await log_activity(
        username=user["username"],
        role=user["role"],
        action="BATCH_RECALL",
        details=f"Issued automated recall for batch {batch_number} of {medicine_name}. Alerts dispatched.",
        user_id=str(user["_id"])
    )
    
    return {
        "message": f"Recalled issued successfully. Alerts dispatched to {len(stakeholders)} supply chain nodes.",
        "notified_nodes_count": len(stakeholders)
    }

# 4. Generate & Download PDF summary audit report
@router.get("/export-pdf")
async def export_regulatory_pdf(
    user: dict = Depends(require_role([UserRole.REGULATOR]))
):
    db = get_database()
    
    # 1. Fetch Stats
    total_users = await db.users.count_documents({})
    total_batches = await db.batches.count_documents({})
    active_recalls = await db.batches.count_documents({"status": "Recalled"})
    total_reports = await db.counterfeit_reports.count_documents({})
    total_scans = await db.scans.count_documents({})
    anomalous_scans = await db.scans.count_documents({"is_anomaly": True})
    anomaly_rate = (anomalous_scans / total_scans * 100.0) if total_scans > 0 else 0.0
    
    stats = {
        "total_users": total_users,
        "total_batches": total_batches,
        "active_recalls": active_recalls,
        "total_reports": total_reports,
        "anomaly_rate": anomaly_rate
    }
    
    # 2. Fetch recent reports
    reports_cursor = db.counterfeit_reports.find().sort("created_at", -1).limit(10)
    reports = []
    async for r in reports_cursor:
        r["created_at"] = r["created_at"].isoformat()
        reports.append(r)
        
    # 3. Fetch recalls
    recalls_cursor = db.batches.find({"status": "Recalled"}).sort("created_at", -1).limit(10)
    recalls = []
    async for rc in recalls_cursor:
        rc["created_at"] = rc["created_at"].isoformat()
        rc["manufacture_date"] = rc["manufacture_date"].isoformat()
        rc["expiry_date"] = rc["expiry_date"].isoformat()
        recalls.append(rc)
        
    # Generate PDF
    pdf_bytes = PDFService.generate_regulatory_report(stats, reports, recalls)
    
    await log_activity(
        username=user["username"],
        role=user["role"],
        action="REGULATORY_PDF_EXPORT",
        details="Exported audit reports as PDF document.",
        user_id=str(user["_id"])
    )
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": "attachment; filename=pharmaceutical_supply_chain_report.pdf"
        }
    )

# 5. Geolocation data for counterfeit report map
@router.get("/counterfeit-map")
async def get_counterfeit_map(
    user: dict = Depends(require_role([UserRole.REGULATOR]))
):
    db = get_database()
    cursor = db.counterfeit_reports.find()
    map_points = []
    async for report in cursor:
        map_points.append({
            "report_id": report["report_id"],
            "serial_number": report["serial_number"],
            "medicine_name": report.get("medicine_name", "Unknown"),
            "risk_level": report["risk_level"],
            "location_name": report["location_name"],
            "latitude": report.get("latitude"),
            "longitude": report.get("longitude"),
            "status": report["status"],
            "created_at": report["created_at"].isoformat()
        })
    return map_points

# 6. Counterfeit Monthly Statistics
@router.get("/monthly-statistics")
async def get_monthly_statistics(
    user: dict = Depends(require_role([UserRole.REGULATOR]))
):
    db = get_database()
    
    # We will generate monthly charts mock data combined with database aggregates
    # Let's count scans by anomaly state
    total_scans = await db.scans.count_documents({})
    anomalous_scans = await db.scans.count_documents({"is_anomaly": True})
    authentic_scans = total_scans - anomalous_scans
    
    # Generate beautiful breakdown for Recharts
    scan_statistics = [
        {"name": "Authentic Scans", "value": authentic_scans},
        {"name": "Anomalous Scans", "value": anomalous_scans}
    ]
    
    # Mock data for monthly scan line counts (representing typical activity)
    monthly_trend = [
        {"month": "Jan", "authentic": 450, "suspicious": 12},
        {"month": "Feb", "authentic": 520, "suspicious": 18},
        {"month": "Mar", "authentic": 610, "suspicious": 8},
        {"month": "Apr", "authentic": 580, "suspicious": 24},
        {"month": "May", "authentic": 670, "suspicious": 15},
        {"month": "Jun", "authentic": 720, "suspicious": 35}
    ]
    
    # Fetch top reported medicines
    pipeline = [
        {"$group": {"_id": "$medicine_name", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ]
    cursor = db.counterfeit_reports.aggregate(pipeline)
    top_reported_drugs = []
    async for item in cursor:
        if item["_id"]:
            top_reported_drugs.append({
                "drug_name": item["_id"],
                "incidents": item["count"]
            })
            
    # Default list if empty
    if not top_reported_drugs:
        top_reported_drugs = [
            {"drug_name": "Aspirin 500mg", "incidents": 5},
            {"drug_name": "Lipitor 10mg", "incidents": 3},
            {"drug_name": "Amoxicillin 250mg", "incidents": 2}
        ]
        
    return {
        "scan_ratio": scan_statistics,
        "monthly_trend": monthly_trend,
        "top_reported_drugs": top_reported_drugs
    }
