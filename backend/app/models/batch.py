from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from enum import Enum

class BatchStatus(str, Enum):
    ACTIVE = "Active"
    RECALLED = "Recalled"
    SUSPENDED = "Suspended"

class BatchBase(BaseModel):
    batch_number: str = Field(..., min_length=3, max_length=50)
    medicine_sku: str
    quantity: int = Field(..., gt=0)
    manufacture_date: datetime
    expiry_date: datetime

class BatchCreate(BatchBase):
    pass

class BatchResponse(BatchBase):
    id: str = Field(..., alias="_id")
    manufacturer_id: str
    status: BatchStatus
    created_at: datetime
    serial_numbers: List[str] = []

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }
