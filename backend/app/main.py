import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import connect_to_mongo, close_mongo_connection
from app.core.logging_config import setup_logging
from app.routes import auth, medicine, tracking, ai_engine, opencv_verification, consumer, regulatory

# Configure logging
setup_logging()
logger = logging.getLogger("mediclear.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    await connect_to_mongo()
    logger.info("Application starting up...")
    yield
    # Shutdown actions
    await close_mongo_connection()
    logger.info("Application shutting down...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Enterprise API system for pharmaceutical tracking, batch QR serialization, AI-powered counterfeit detection, and image analysis.",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan
)

# CORS Policy configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, lock this down to frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router layers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["User Authentication & Role Management"])
app.include_router(medicine.router, prefix=f"{settings.API_V1_STR}/medicine", tags=["Batch Registration & QR Generation"])
app.include_router(tracking.router, prefix=f"{settings.API_V1_STR}/tracking", tags=["Supply Chain Tracking"])
app.include_router(ai_engine.router, prefix=f"{settings.API_V1_STR}/ai", tags=["AI Counterfeit Detection Engine"])
app.include_router(opencv_verification.router, prefix=f"{settings.API_V1_STR}/opencv", tags=["OpenCV Packaging Verification"])
app.include_router(consumer.router, prefix=f"{settings.API_V1_STR}/consumer", tags=["Consumer Portal"])
app.include_router(regulatory.router, prefix=f"{settings.API_V1_STR}/regulatory", tags=["Regulatory recall & monitoring Dashboard"])

@app.get("/")
async def root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "docs_url": f"{settings.API_V1_STR}/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
