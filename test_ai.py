import asyncio
import os
import sys

# Setup paths
sys.path.append(os.path.abspath("backend/src"))

from api.v1.messaging.pipeline import generate_reply

async def main():
    # Provide a dummy session and args
    print("Testing generate_reply...")
    try:
        res = await generate_reply(
            message="Hello, I need help studying.",
            classification="polite_greeting",
            db=None,
            user_id="test_user",
            catalogue_items=[]
        )
        print("Success!")
        print(res)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
