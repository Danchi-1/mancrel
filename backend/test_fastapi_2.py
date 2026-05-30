import asyncio
from fastapi import FastAPI, Request
from fastapi.testclient import TestClient

app = FastAPI()

@app.post("/test/{user_id}")
async def test_endpoint(
    user_id: str,
    request: Request
):
    try:
        form_data = await request.form()
        return {"status": "ok"}
    except Exception as e:
        return {"status": "error"}

client = TestClient(app)
resp = client.post("/test/123", data={"From": "123", "Body": "test"})
print("Response status:", resp.status_code)

resp2 = client.post("/test/123", data="invalid body")
print("Response status 2:", resp2.status_code)
