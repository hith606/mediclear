from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from enum import Enum

class UserRole(str, Enum):
    MANUFACTURER = "Manufacturer"
    DISTRIBUTOR = "Distributor"
    PHARMACY = "Pharmacy"
    CONSUMER = "Consumer"
    REGULATOR = "Regulatory Authority"

class UserStatus(str, Enum):
    PENDING = "Pending Approval"
    APPROVED = "Approved"
    REJECTED = "Rejected"

class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    role: UserRole
    full_name: str
    organization: Optional[str] = None
    phone_number: Optional[str] = None
    profile_picture: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    organization: Optional[str] = None
    phone_number: Optional[str] = None
    password: Optional[str] = None
    profile_picture: Optional[str] = None

class UserResponse(UserBase):
    id: str = Field(..., alias="_id")
    status: UserStatus
    created_at: datetime
    is_active: bool

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str
    status: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None
