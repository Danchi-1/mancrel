import os
from fastapi import APIRouter, UploadFile, File, HTTPException
import cloudinary
import cloudinary.uploader

router = APIRouter()

# Cloudinary configuration will automatically pick up the CLOUDINARY_URL environment variable.
# Format: cloudinary://<api_key>:<api_secret>@<cloud_name>

@router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    if not os.environ.get('CLOUDINARY_URL'):
        raise HTTPException(status_code=500, detail="CLOUDINARY_URL environment variable is not configured.")
        
    try:
        # Read file bytes for reliability
        contents = await file.read()
        
        # Upload directly to Cloudinary
        result = cloudinary.uploader.upload(
            contents,
            folder="mancrel_catalogue", # Organizes images in a folder
            resource_type="image"
        )
        
        # Cloudinary returns a secure URL for the uploaded image
        url = result.get("secure_url")
        if not url:
            raise Exception("Failed to retrieve secure URL from Cloudinary")
            
        return {"url": url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
