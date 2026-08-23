from fastapi import APIRouter, UploadFile, File, HTTPException
import cloudinary
import cloudinary.uploader
import os
import uuid

router = APIRouter(prefix="/api/admin", tags=["Upload"])

# Khởi tạo Cloudinary
cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME', 'do169bkba'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET')
)

@router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Chỉ cho phép định dạng ảnh")
        
    try:
        result = cloudinary.uploader.upload(
            file.file,
            folder="home/Sổ tay Sinh viên"
        )
        return {"url": result.get("secure_url")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi upload ảnh: {str(e)}")
