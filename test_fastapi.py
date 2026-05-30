from fastapi import FastAPI, Form
from fastapi.testclient import TestClient

app = FastAPI()

@app.post("/test")
async def test_endpoint(
    From: str = Form(...),
    Body: str = Form(""),
    ProfileName: str = Form(None),
):
    return {"status": "ok"}

client = TestClient(app)
resp = client.post("/test", data={"From": "123", "Body": "test"})
print("Response status:", resp.status_code)
print("Response body:", resp.json())
