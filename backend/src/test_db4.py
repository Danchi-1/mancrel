import asyncio
from sqlalchemy import select
from db.session import AsyncSessionLocal
from db.models import User

async def main():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(User).limit(1))
        user = res.scalar_one_or_none()
        if user:
            print("SID:", repr(user.twilio_account_sid))
            print("TOKEN:", repr(user.twilio_auth_token))
        else:
            print("No user found")
asyncio.run(main())
