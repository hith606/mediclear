from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class MedicineBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    generic_name: str
    sku: str = Field(..., description="Unique Stock Keeping Unit / Drug Code")
    formulation: str = Field(..., description="e.g. Tablet, Liquid, Capsule")
    strength: str = Field(..., description="e.g. 500mg, 10ml")
    active_ingredients: List[str]
    description: Optional[str] = None
    package_image_url: Optional[str] = None  # Reference image for OpenCV template matching

class MedicineCreate(MedicineBase):
    pass

class MedicineResponse(MedicineBase):
    id: str = Field(..., alias="_id")
    manufacturer_id: str
    created_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }
