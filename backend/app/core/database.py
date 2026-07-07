import logging
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

logger = logging.getLogger("mediclear")

class Database:
    client: AsyncIOMotorClient = None
    db = None

db_instance = Database()

async def connect_to_mongo():
    logger.info("Connecting to MongoDB...")
    try:
        # Set a short server selection timeout so it doesn't hang for 30 seconds
        db_instance.client = AsyncIOMotorClient(settings.MONGODB_URL, serverSelectionTimeoutMS=3000)
        db_instance.db = db_instance.client[settings.DATABASE_NAME]
        
        # Create indexes
        await db_instance.db.users.create_index("username", unique=True)
        await db_instance.db.users.create_index("email", unique=True)
        await db_instance.db.medicines.create_index("sku", unique=True)
        await db_instance.db.batches.create_index("batch_number", unique=True)
        await db_instance.db.shipments.create_index("shipment_id", unique=True)
        await db_instance.db.scans.create_index("serial_number")
        logger.info("Connected to MongoDB and created indexes successfully.")
    except Exception as e:
        logger.warning(f"Could not connect to MongoDB or create indexes: {e}")
        logger.warning("The application is starting up in offline mode. Database calls will fail until MongoDB is connected/started.")

async def close_mongo_connection():
    if db_instance.client:
        logger.info("Closing MongoDB connection...")
        db_instance.client.close()
        logger.info("MongoDB connection closed.")

def get_database():
    return db_instance.db
