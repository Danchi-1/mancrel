import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv("backend/.env")

async def run():
    url = os.environ.get("DATABASE_URL")
    url = url.replace("postgres://", "postgresql+asyncpg://").replace("postgresql://", "postgresql+asyncpg://")
    url = url.split("?")[0]
    engine = create_async_engine(url)
    async with engine.begin() as conn:
        res = await conn.execute(text("SELECT id, email, twilio_phone_number, payment_details FROM users"))
        rows = res.fetchall()
        for r in rows:
            print(r)
    await engine.dispose()

asyncio.run(run())
