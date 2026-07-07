import sys
from pymongo import MongoClient
from datetime import datetime, timezone, timedelta
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.user import UserRole, UserStatus
from app.models.batch import BatchStatus
from app.models.shipment import ShipmentStatus

def seed_database():
    print(f"Connecting to MongoDB at {settings.MONGODB_URL}...")
    client = MongoClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    
    # Clean database collections
    print("Clearing collections...")
    db.users.drop()
    db.medicines.drop()
    db.batches.drop()
    db.shipments.drop()
    db.scans.drop()
    db.counterfeit_reports.drop()
    db.activity_logs.drop()
    db.feedbacks.drop()

    # 1. Create Default Users (Approved status)
    print("Seeding Users...")
    hashed_password = get_password_hash("password123")
    
    users = [
        {
            "username": "regulator",
            "email": "regulator@mediclear.gov",
            "role": UserRole.REGULATOR.value,
            "full_name": "National Regulatory Officer",
            "organization": "FDA Regulatory Authority",
            "phone_number": "+19998887771",
            "hashed_password": hashed_password,
            "status": UserStatus.APPROVED.value,
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "username": "manufacturer",
            "email": "mfg@pharma-corp.com",
            "role": UserRole.MANUFACTURER.value,
            "full_name": "PharmaCorp Manufacturing Ltd",
            "organization": "PharmaCorp Factories Inc.",
            "phone_number": "+19998887772",
            "hashed_password": hashed_password,
            "status": UserStatus.APPROVED.value,
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "username": "distributor",
            "email": "distributor@logistic-link.com",
            "role": UserRole.DISTRIBUTOR.value,
            "full_name": "LogisticsLink Distributors",
            "organization": "LogisticsLink Solutions",
            "phone_number": "+19998887773",
            "hashed_password": hashed_password,
            "status": UserStatus.APPROVED.value,
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "username": "pharmacy",
            "email": "pharmacy@wellness-meds.com",
            "role": UserRole.PHARMACY.value,
            "full_name": "WellnessMeds Retail Pharmacy",
            "organization": "WellnessMeds Outlets",
            "phone_number": "+19998887774",
            "hashed_password": hashed_password,
            "status": UserStatus.APPROVED.value,
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "username": "consumer",
            "email": "consumer@gmail.com",
            "role": UserRole.CONSUMER.value,
            "full_name": "John Doe",
            "organization": None,
            "phone_number": "+19998887775",
            "hashed_password": hashed_password,
            "status": UserStatus.APPROVED.value,
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "username": "pending_mfg",
            "email": "pending@mfg.com",
            "role": UserRole.MANUFACTURER.value,
            "full_name": "Standard Labs Ltd",
            "organization": "Standard Labs",
            "phone_number": "+19998887776",
            "hashed_password": hashed_password,
            "status": UserStatus.PENDING.value,
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        }
    ]
    
    db.users.insert_many(users)
    mfg_user = db.users.find_one({"username": "manufacturer"})
    mfg_id = str(mfg_user["_id"])
    dist_user = db.users.find_one({"username": "distributor"})
    dist_id = str(dist_user["_id"])
    pharm_user = db.users.find_one({"username": "pharmacy"})
    pharm_id = str(pharm_user["_id"])

    # 2. Seed Medicine Catalog
    print("Seeding Medicines...")
    medicines = [
        {
            "name": "Aspirin 500mg",
            "generic_name": "Acetylsalicylic Acid",
            "sku": "SKU-ASP-500",
            "formulation": "Tablet",
            "strength": "500mg",
            "active_ingredients": ["Acetylsalicylic Acid 500mg"],
            "description": "Used to reduce pain, fever, or inflammation.",
            "package_image_url": None,
            "manufacturer_id": mfg_id,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "name": "Lipitor 10mg",
            "generic_name": "Atorvastatin Calcium",
            "sku": "SKU-LIP-10",
            "formulation": "Tablet",
            "strength": "10mg",
            "active_ingredients": ["Atorvastatin 10mg"],
            "description": "Statin medication used to prevent cardiovascular disease and lower lipids.",
            "package_image_url": None,
            "manufacturer_id": mfg_id,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "name": "Amoxicillin 250mg",
            "generic_name": "Amoxicillin Trihydrate",
            "sku": "SKU-AMX-250",
            "formulation": "Capsule",
            "strength": "250mg",
            "active_ingredients": ["Amoxicillin 250mg"],
            "description": "Antibiotic used to treat a number of bacterial infections.",
            "package_image_url": None,
            "manufacturer_id": mfg_id,
            "created_at": datetime.now(timezone.utc)
        }
    ]
    db.medicines.insert_many(medicines)

    # 3. Seed Batches & Serials
    print("Seeding Batches & Unit Serials...")
    batches = [
        {
            "batch_number": "B-ASP-001",
            "medicine_sku": "SKU-ASP-500",
            "quantity": 10,
            "manufacture_date": datetime.now(timezone.utc) - timedelta(days=60),
            "expiry_date": datetime.now(timezone.utc) + timedelta(days=700),
            "manufacturer_id": mfg_id,
            "status": BatchStatus.ACTIVE.value,
            "created_at": datetime.now(timezone.utc) - timedelta(days=60),
            "serial_numbers": [f"MC-SKU-ASP-500-B-ASP-001-{i:04d}" for i in range(1, 11)]
        },
        {
            "batch_number": "B-LIP-002",
            "medicine_sku": "SKU-LIP-10",
            "quantity": 5,
            "manufacture_date": datetime.now(timezone.utc) - timedelta(days=30),
            "expiry_date": datetime.now(timezone.utc) + timedelta(days=365),
            "manufacturer_id": mfg_id,
            "status": BatchStatus.ACTIVE.value,
            "created_at": datetime.now(timezone.utc) - timedelta(days=30),
            "serial_numbers": [f"MC-SKU-LIP-10-B-LIP-002-{i:04d}" for i in range(1, 6)]
        },
        {
            "batch_number": "B-AMX-003",
            "medicine_sku": "SKU-AMX-250",
            "quantity": 5,
            "manufacture_date": datetime.now(timezone.utc) - timedelta(days=400),
            "expiry_date": datetime.now(timezone.utc) - timedelta(days=30),  # Expired
            "manufacturer_id": mfg_id,
            "status": BatchStatus.RECALLED.value,  # Recalled
            "created_at": datetime.now(timezone.utc) - timedelta(days=400),
            "serial_numbers": [f"MC-SKU-AMX-250-B-AMX-003-{i:04d}" for i in range(1, 6)]
        }
    ]
    db.batches.insert_many(batches)

    # Insert Unit Scans Ledger for all batches
    all_scans = []
    # Batch 1 (Aspirin)
    for s in batches[0]["serial_numbers"]:
        # some units are in Distributor warehouse (Delivered), some in Pharmacy, some new
        all_scans.append({
            "serial_number": s,
            "batch_number": "B-ASP-001",
            "sku": "SKU-ASP-500",
            "scan_count": 2,
            "locations": [
                {"name": "PharmaCorp Factory, Mumbai", "lat": 19.0760, "lng": 72.8777, "timestamp": datetime.now(timezone.utc) - timedelta(days=60)},
                {"name": "LogisticsLink Warehouse, Delhi", "lat": 28.7041, "lng": 77.1025, "timestamp": datetime.now(timezone.utc) - timedelta(days=55)}
            ],
            "timestamps": [
                datetime.now(timezone.utc) - timedelta(days=60),
                datetime.now(timezone.utc) - timedelta(days=55)
            ],
            "last_scanned": datetime.now(timezone.utc) - timedelta(days=55),
            "status": "Delivered",
            "is_anomaly": False,
            "current_owner_id": dist_id,
            "current_owner_name": "LogisticsLink Distributors",
            "current_owner_role": UserRole.DISTRIBUTOR.value
        })
        
    # Batch 2 (Lipitor) - In Manufacturer custody
    for s in batches[1]["serial_numbers"]:
        all_scans.append({
            "serial_number": s,
            "batch_number": "B-LIP-002",
            "sku": "SKU-LIP-10",
            "scan_count": 1,
            "locations": [
                {"name": "PharmaCorp Factory, Mumbai", "lat": 19.0760, "lng": 72.8777, "timestamp": datetime.now(timezone.utc) - timedelta(days=30)}
            ],
            "timestamps": [datetime.now(timezone.utc) - timedelta(days=30)],
            "last_scanned": datetime.now(timezone.utc) - timedelta(days=30),
            "status": "Authentic",
            "is_anomaly": False,
            "current_owner_id": mfg_id,
            "current_owner_name": "PharmaCorp Manufacturing Ltd",
            "current_owner_role": UserRole.MANUFACTURER.value
        })

    # Batch 3 (Amoxicillin) - Recalled
    for s in batches[2]["serial_numbers"]:
        all_scans.append({
            "serial_number": s,
            "batch_number": "B-AMX-003",
            "sku": "SKU-AMX-250",
            "scan_count": 1,
            "locations": [
                {"name": "PharmaCorp Factory, Mumbai", "lat": 19.0760, "lng": 72.8777, "timestamp": datetime.now(timezone.utc) - timedelta(days=400)}
            ],
            "timestamps": [datetime.now(timezone.utc) - timedelta(days=400)],
            "last_scanned": datetime.now(timezone.utc) - timedelta(days=400),
            "status": "Recalled",
            "is_anomaly": False,
            "current_owner_id": mfg_id,
            "current_owner_name": "PharmaCorp Manufacturing Ltd",
            "current_owner_role": UserRole.MANUFACTURER.value
        })

    # Insert scans
    db.scans.insert_many(all_scans)

    # 4. Seed Shipments (Chain of custody)
    print("Seeding Shipments...")
    # Shipment 1: Manufacturer -> Distributor (Delivered)
    ship1_id = "SH-20260601-ASP001"
    shipment_1 = {
        "shipment_id": ship1_id,
        "batch_number": "B-ASP-001",
        "medicine_sku": "SKU-ASP-500",
        "sender_id": mfg_id,
        "receiver_id": dist_id,
        "status": ShipmentStatus.DELIVERED.value,
        "serial_numbers": batches[0]["serial_numbers"],
        "timeline": [
            {
                "action": "Shipped",
                "actor_id": mfg_id,
                "actor_name": "PharmaCorp Manufacturing Ltd",
                "role": UserRole.MANUFACTURER.value,
                "location": "PharmaCorp Factory, Mumbai",
                "coordinates": {"lat": 19.0760, "lng": 72.8777},
                "timestamp": datetime.now(timezone.utc) - timedelta(days=60)
            },
            {
                "action": "Received",
                "actor_id": dist_id,
                "actor_name": "LogisticsLink Distributors",
                "role": UserRole.DISTRIBUTOR.value,
                "location": "LogisticsLink Warehouse, Delhi",
                "coordinates": {"lat": 28.7041, "lng": 77.1025},
                "timestamp": datetime.now(timezone.utc) - timedelta(days=55)
            }
        ],
        "created_at": datetime.now(timezone.utc) - timedelta(days=60),
        "updated_at": datetime.now(timezone.utc) - timedelta(days=55)
    }

    # Shipment 2: Distributor -> Pharmacy (In Transit)
    ship2_id = "SH-20260615-ASP002"
    shipment_2 = {
        "shipment_id": ship2_id,
        "batch_number": "B-ASP-001",
        "medicine_sku": "SKU-ASP-500",
        "sender_id": dist_id,
        "receiver_id": pharm_id,
        "status": ShipmentStatus.IN_TRANSIT.value,
        "serial_numbers": batches[0]["serial_numbers"][:5],  # Only shipped half the batch
        "timeline": [
            {
                "action": "Shipped",
                "actor_id": dist_id,
                "actor_name": "LogisticsLink Distributors",
                "role": UserRole.DISTRIBUTOR.value,
                "location": "LogisticsLink Warehouse, Delhi",
                "coordinates": {"lat": 28.7041, "lng": 77.1025},
                "timestamp": datetime.now(timezone.utc) - timedelta(days=5)
            },
            {
                "action": "Transit Update",
                "actor_id": dist_id,
                "actor_name": "LogisticsLink Distributors",
                "role": UserRole.DISTRIBUTOR.value,
                "location": "Central Logistics Hub, Nagpur",
                "coordinates": {"lat": 21.1458, "lng": 79.0882},
                "timestamp": datetime.now(timezone.utc) - timedelta(days=3)
            }
        ],
        "created_at": datetime.now(timezone.utc) - timedelta(days=5),
        "updated_at": datetime.now(timezone.utc) - timedelta(days=3)
    }
    
    db.shipments.insert_many([shipment_1, shipment_2])

    # 5. Seed Counterfeit Anomaly Reports (for regulator analytics)
    print("Seeding Counterfeit and Anomaly Reports...")
    reports = [
        {
            "report_id": "REP-20260601-X01",
            "serial_number": batches[0]["serial_numbers"][0],  # Duplicate QR scan alert
            "medicine_name": "Aspirin 500mg",
            "batch_number": "B-ASP-001",
            "reporter_role": "Consumer",
            "location_name": "Chennai Health Center",
            "latitude": 13.0827,
            "longitude": 80.2707,
            "description": "Scan count anomaly: QR scanned in Chennai while physical batch is registered in Nagpur transit.",
            "risk_level": "High",
            "status": "Pending Investigation",
            "created_at": datetime.now(timezone.utc) - timedelta(days=4)
        },
        {
            "report_id": "REP-20260610-Y02",
            "serial_number": "MC-UNREG-SKU-999-B001",  # Unregistered scan
            "medicine_name": "Suspect Lipitor Box",
            "batch_number": "UNKNOWN",
            "reporter_role": "Pharmacy",
            "location_name": "Vikas Medicals, Bangalore",
            "latitude": 12.9716,
            "longitude": 77.5946,
            "description": "Verification failed: QR Code did not resolve to a valid system batch index.",
            "risk_level": "Critical",
            "status": "Confirmed Counterfeit",
            "created_at": datetime.now(timezone.utc) - timedelta(days=12)
        },
        {
            "report_id": "REP-20260615-Z03",
            "serial_number": batches[2]["serial_numbers"][2],  # Recalled batch scan
            "medicine_name": "Amoxicillin 250mg",
            "batch_number": "B-AMX-003",
            "reporter_role": "Consumer",
            "location_name": "Sunrise Clinics, Hyderabad",
            "latitude": 17.3850,
            "longitude": 78.4867,
            "description": "Verification scan attempted on a recalled drug unit.",
            "risk_level": "Medium",
            "status": "Confirmed Counterfeit",
            "created_at": datetime.now(timezone.utc) - timedelta(days=1)
        }
    ]
    db.counterfeit_reports.insert_many(reports)

    # 6. Seed activity logs
    print("Seeding Activity Logs...")
    logs = [
        {
            "username": "manufacturer",
            "role": UserRole.MANUFACTURER.value,
            "action": "BATCH_CREATE",
            "details": "Created batch B-ASP-001 of Aspirin 500mg.",
            "timestamp": datetime.now(timezone.utc) - timedelta(days=60)
        },
        {
            "username": "manufacturer",
            "role": UserRole.MANUFACTURER.value,
            "action": "SHIPMENT_CREATE",
            "details": "Initiated shipment SH-20260601-ASP001 to LogisticsLink.",
            "timestamp": datetime.now(timezone.utc) - timedelta(days=60)
        },
        {
            "username": "distributor",
            "role": UserRole.DISTRIBUTOR.value,
            "action": "SHIPMENT_RECEIVE",
            "details": "Received shipment SH-20260601-ASP001, confirming cargo verification.",
            "timestamp": datetime.now(timezone.utc) - timedelta(days=55)
        },
        {
            "username": "regulator",
            "role": UserRole.REGULATOR.value,
            "action": "BATCH_RECALL",
            "details": "Issued recall order on Batch B-AMX-003 of Amoxicillin due to sub-standard chemical potency reports.",
            "timestamp": datetime.now(timezone.utc) - timedelta(days=1)
        }
    ]
    db.activity_logs.insert_many(logs)
    
    print("Database seeding completed successfully.")

if __name__ == "__main__":
    seed_database()
