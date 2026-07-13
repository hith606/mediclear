from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, Field
from bson import ObjectId

from app.core.config import settings
from app.core.database import get_database
from app.core.security import get_password_hash, verify_password, create_access_token, decode_access_token
from app.models.user import UserCreate, UserResponse, UserStatus, UserRole, UserUpdate, Token

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login-form", auto_error=False)

class UserLogin(BaseModel):
    username: str
    password: str

class PasswordReset(BaseModel):
    username: str
    email: str
    new_password: str

class UserApprovalRequest(BaseModel):
    user_id: str
    approve: bool # True for Approved, False for Rejected

async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    username: str = payload.get("sub")
    db = get_database()
    user = await db.users.find_one({"username": username})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="User not found."
        )
    
    return user

async def get_approved_user(current_user: dict = Depends(get_current_user)) -> dict:
    # Consumers do not require approval
    if current_user["role"] != UserRole.CONSUMER and current_user["status"] != UserStatus.APPROVED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Your account status is currently: '{current_user['status']}'. Access is restricted until approved by a Regulatory Authority."
        )
    return current_user

def require_role(allowed_roles: List[UserRole]):
    async def role_checker(user: dict = Depends(get_approved_user)):
        if user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Access limited to roles: {[r.value for r in allowed_roles]}"
            )
        return user
    return role_checker

async def log_activity(username: str, role: str, action: str, details: str, user_id: str = None):
    db = get_database()
    await db.activity_logs.insert_one({
        "user_id": str(user_id) if user_id else None,
        "username": username,
        "role": role,
        "action": action,
        "details": details,
        "timestamp": datetime.now(timezone.utc)
    })

# Register
@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate):
    db = get_database()
    
    # Check if exists
    existing_username = await db.users.find_one({"username": user_in.username})
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already registered.")
        
    existing_email = await db.users.find_one({"email": user_in.email})
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered.")
    
    # Regulatory authorities and consumers are auto-approved to bootstrap the system.
    # Manufacturers, Distributors, and Pharmacies require approval.
    initial_status = UserStatus.APPROVED
    if user_in.role in [UserRole.MANUFACTURER, UserRole.DISTRIBUTOR, UserRole.PHARMACY]:
        initial_status = UserStatus.PENDING
        
    user_dict = user_in.model_dump()
    user_dict["hashed_password"] = get_password_hash(user_dict.pop("password"))
    user_dict["status"] = initial_status
    user_dict["is_active"] = True
    user_dict["created_at"] = datetime.now(timezone.utc)
    
    result = await db.users.insert_one(user_dict)
    user_dict["_id"] = str(result.inserted_id)
    
    await log_activity(
        username=user_in.username,
        role=user_in.role,
        action="USER_REGISTER",
        details=f"Registered user with status: {initial_status.value}",
        user_id=user_dict["_id"]
    )
    
    return user_dict

# Login (JSON)
@router.post("/login", response_model=Token)
async def login_json(user_in: UserLogin):
    db = get_database()
    user = await db.users.find_one({"username": user_in.username})
    
    if not user or not verify_password(user_in.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated."
        )

    # Note: Pending accounts CAN log in, but endpoints protected by get_approved_user will block them.
    # This allows showing them a "Waiting for approval" dashboard.
    
    access_token = create_access_token(
        subject=user["username"],
        role=user["role"]
    )
    
    await log_activity(
        username=user["username"],
        role=user["role"],
        action="USER_LOGIN",
        details="User logged in successfully",
        user_id=str(user["_id"])
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user["role"],
        "username": user["username"],
        "status": user["status"]
    }

# Login (Form URL-Encoded fallback for Swagger UI)
from fastapi.security import OAuth2PasswordRequestForm
@router.post("/login-form", response_model=Token)
async def login_form(form_data: OAuth2PasswordRequestForm = Depends()):
    db = get_database()
    user = await db.users.find_one({"username": form_data.username})
    
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
        
    access_token = create_access_token(
        subject=user["username"],
        role=user["role"]
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user["role"],
        "username": user["username"],
        "status": user["status"]
    }

# Get profile
@router.get("/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    user["_id"] = str(user["_id"])
    return user

# Update profile
@router.put("/me", response_model=UserResponse)
async def update_me(user_update: UserUpdate, user: dict = Depends(get_current_user)):
    db = get_database()
    update_data = user_update.model_dump(exclude_unset=True)
    
    if "password" in update_data:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
        
    if update_data:
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$set": update_data}
        )
        # Fetch updated
        user = await db.users.find_one({"_id": user["_id"]})
        
    user["_id"] = str(user["_id"])
    await log_activity(
        username=user["username"],
        role=user["role"],
        action="USER_UPDATE_PROFILE",
        details="Updated user profile details",
        user_id=user["_id"]
    )
    return user

# Password reset (simplified secure workflow)
@router.post("/reset-password")
async def reset_password(reset_in: PasswordReset):
    db = get_database()
    user = await db.users.find_one({"username": reset_in.username, "email": reset_in.email})
    if not user:
        raise HTTPException(status_code=404, detail="User matching username and email was not found.")
        
    hashed = get_password_hash(reset_in.new_password)
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"hashed_password": hashed}}
    )
    
    await log_activity(
        username=user["username"],
        role=user["role"],
        action="USER_PASSWORD_RESET",
        details="Password reset requested and updated",
        user_id=str(user["_id"])
    )
    return {"message": "Password updated successfully."}

# List pending users (Regulatory Authority only)
@router.get("/pending-approvals", response_model=List[UserResponse])
async def get_pending_users(
    user: dict = Depends(require_role([UserRole.REGULATOR]))
):
    db = get_database()
    cursor = db.users.find({"status": UserStatus.PENDING})
    pending_users = []
    async for u in cursor:
        u["_id"] = str(u["_id"])
        pending_users.append(u)
    return pending_users

# Approve/reject users (Regulatory Authority only)
@router.post("/approve")
async def approve_user(
    req: UserApprovalRequest,
    user: dict = Depends(require_role([UserRole.REGULATOR]))
):
    db = get_database()
    if not ObjectId.is_valid(req.user_id):
        raise HTTPException(status_code=400, detail="Invalid User ID structure.")
        
    target_user = await db.users.find_one({"_id": ObjectId(req.user_id)})
    if not target_user:
        raise HTTPException(status_code=404, detail="User target not found.")
        
    new_status = UserStatus.APPROVED if req.approve else UserStatus.REJECTED
    await db.users.update_one(
        {"_id": ObjectId(req.user_id)},
        {"$set": {"status": new_status}}
    )
    
    await log_activity(
        username=user["username"],
        role=user["role"],
        action="USER_APPROVAL_DECISION",
        details=f"Set status of '{target_user['username']}' to '{new_status.value}'",
        user_id=str(user["_id"])
    )
    return {"message": f"User status set to {new_status.value}"}

# Get activity logs
@router.get("/activity-logs")
async def get_activity_logs(
    user: dict = Depends(get_approved_user),
    limit: int = 50
):
    db = get_database()
    # Regulators see all logs; others see only their own
    query = {}
    if user["role"] != UserRole.REGULATOR:
        query = {"username": user["username"]}
        
    cursor = db.activity_logs.find(query).sort("timestamp", -1).limit(limit)
    logs = []
    async for l in cursor:
        l["_id"] = str(l["_id"])
        l["timestamp"] = l["timestamp"].isoformat()
        logs.append(l)
    return logs

# Get logistics partners directory
@router.get("/partners", response_model=List[UserResponse])
async def get_approved_partners(
    role: Optional[str] = None,
    user: dict = Depends(get_approved_user)
):
    db = get_database()
    query = {"status": UserStatus.APPROVED.value}
    if role:
        query["role"] = role
    cursor = db.users.find(query)
    partners = []
    async for u in cursor:
        u["_id"] = str(u["_id"])
        partners.append(u)
    return partners

