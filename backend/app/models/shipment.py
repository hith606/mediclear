from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum

class ShipmentStatus(str, Enum):
    CREATED = "Created"
    IN_TRANSIT = "In Transit"
    DELIVERED = "Delivered"
    RECALLED = "Recalled"

class GeoCoordinates(BaseModel):
    lat: float
    lng: float

class TimelineEvent(BaseModel):
    action: str  # e.g., "Shipped", "Received", "Transit Update", "Recalled"
    actor_id: str
    actor_name: str
    role: str
    location: str
    coordinates: Optional[GeoCoordinates] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ShipmentBase(BaseModel):
    batch_number: str
    medicine_sku: str
    sender_id: str
    receiver_id: str
    status: ShipmentStatus = ShipmentStatus.CREATED
    serial_numbers: List[str] = []

class ShipmentCreate(BaseModel):
    batch_number: str
    receiver_id: str
    serial_numbers: List[str]
    location: str
    coordinates: Optional[GeoCoordinates] = None

class ShipmentResponse(ShipmentBase):
    id: str = Field(..., alias="_id")
    shipment_id: str
    timeline: List[TimelineEvent] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }
