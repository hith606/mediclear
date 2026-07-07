from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from typing import Optional

from app.core.database import get_database
from app.routes.auth import get_approved_user
from app.services.opencv_service import OpenCVService

router = APIRouter()

@router.post("/verify-package")
async def verify_package_image(
    file: UploadFile = File(...),
    medicine_sku: Optional[str] = Form(None),
    user: dict = Depends(get_approved_user)
):
    """
    Uploads a photo of the medicine box to verify packaging authenticity.
    Uses ORB keypoints, HSV color match, structural tear detectors, and EasyOCR.
    """
    db = get_database()
    
    # Check file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="File uploaded is not an image."
        )
        
    try:
        image_bytes = await file.read()
        
        reference_path = None
        medicine = None
        if medicine_sku:
            medicine = await db.medicines.find_one({"sku": medicine_sku})
            if medicine:
                if "_id" in medicine:
                    medicine["_id"] = str(medicine["_id"])
                if medicine.get("package_image_url"):
                    reference_path = medicine["package_image_url"]

        result = OpenCVService.process_and_compare(
            uploaded_image_bytes=image_bytes,
            reference_image_path=reference_path,
            medicine_profile=medicine
        )
        
        return result
        
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image verification failed: {str(e)}")
