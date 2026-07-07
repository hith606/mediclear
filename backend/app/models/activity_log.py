from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class ActivityLogBase(BaseModel):
    user_id: Optional[str] = None
    username: str
    role: str
    action: str  # e.g., "USER_LOGIN", "BATCH_CREATED", "SHIPMENT_TRANSFERRED", "RECALL_ISSUED"
    details: str
    ip_address: Optional[str] = None

class ActivityLogCreate(ActivityLogBase):
    pass

class ActivityLogResponse(ActivityLogBase):
    id: str = Field(..., alias="_id")
    timestamp: datetime

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }
