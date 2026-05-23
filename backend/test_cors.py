from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/test500")
async def test500():
    raise HTTPException(status_code=500, detail="Test")

@app.post("/test500-raw")
async def test500_raw():
    raise ValueError("Crash")
