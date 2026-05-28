import asyncio
import httpx

async def main():
    async with httpx.AsyncClient() as client:
        # User ID doesn't exist, but it should return 'unknown_user' if the route hits
        resp = await client.post(
            "https://mancrel.onrender.com/api/v1/messaging/twilio-webhook/00000000-0000-0000-0000-000000000000",
            data={
                "From": "whatsapp:+1234567890",
                "Body": "hello"
            }
        )
        print(resp.status_code)
        print(resp.text)

asyncio.run(main())
