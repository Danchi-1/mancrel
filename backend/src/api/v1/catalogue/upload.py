import os
import uuid
import boto3
from fastapi import APIRouter, UploadFile, File, HTTPException

router = APIRouter()

s3_client = boto3.client(
    's3',
    aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY'),
    region_name=os.environ.get('AWS_REGION', 'us-east-1')
)

@router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    bucket_name = os.environ.get('AWS_BUCKET_NAME')
    if not bucket_name:
        raise HTTPException(status_code=500, detail="S3 bucket not configured")
        
    ext = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
    file_key = f"catalogue/{uuid.uuid4()}.{ext}"
    
    try:
        s3_client.upload_fileobj(
            file.file,
            bucket_name,
            file_key,
            ExtraArgs={"ContentType": file.content_type, "ACL": "public-read"}
        )
        url = f"https://{bucket_name}.s3.{os.environ.get('AWS_REGION', 'us-east-1')}.amazonaws.com/{file_key}"
        return {"url": url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
