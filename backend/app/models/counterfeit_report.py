from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class CounterfeitReportBase(BaseModel):
    serial_number: str
    medicine_name: Optional[str] = None
    batch_number: Optional[str] = None
    reporter_role: str = "Consumer"  # Consumer, Pharmacy, Regulator, etc.
    reporter_email: Optional[str] = None
    reporter_phone: Optional[str] = None
    location_name: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    description: str
    risk_level: str = "Medium"  # Low, Medium, High, Critical

class CounterfeitReportCreate(CounterfeitReportBase):
    pass

class CounterfeitReportResponse(CounterfeitReportBase):
    id: str = Field(..., alias="_id")
    status: str = "Pending Investigation"  # Pending, Under Review, Confirmed Counterfeit, False Alarm
    created_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }
