import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv("backend/.env")

async def run():
    url = os.environ.get("DATABASE_URL")
    url = url.replace("postgres://", "postgresql+asyncpg://").replace("postgresql://", "postgresql+asyncpg://")
    url = url.split("?")[0] # strip query params like sslmode
    engine = create_async_engine(url)
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE users ADD COLUMN payment_details VARCHAR"))
            print("Added payment_details to users")
        except Exception as e:
            print(e)
            
    await engine.dispose()

asyncio.run(run())
