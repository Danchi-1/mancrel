import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent / "src"))

import asyncio
from src.api.v1.auth.routes import google_login
from src.api.v1.auth.schemas import GoogleLoginRequest
import os

os.environ["GOOGLE_CLIENT_ID"] = "test-client"

async def test():
    req = GoogleLoginRequest(credential="fake-token")
    try:
        await google_login(req, None)
    except Exception as e:
        import traceback
        traceback.print_exc()

asyncio.run(test())
