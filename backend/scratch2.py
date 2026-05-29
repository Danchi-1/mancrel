import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

async def check_db():
    engine = create_async_engine("sqlite+aiosqlite:///mancrel.db")
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        result = await session.execute(text("SELECT count(*) FROM catalogue_items"))
        print("Catalogue items:", result.scalar())
        result2 = await session.execute(text("SELECT name, user_id FROM catalogue_items LIMIT 5"))
        for row in result2.fetchall():
            print(row)
        result3 = await session.execute(text("SELECT id FROM users LIMIT 1"))
        print("User ID:", result3.scalar())

asyncio.run(check_db())
