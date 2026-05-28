import os
import asyncio
from openai import OpenAI

from dotenv import load_dotenv
load_dotenv()

api_key = os.environ.get("OPENROUTER_API_KEY")

def test_openrouter():
    if not api_key:
        print("OPENROUTER_API_KEY is missing from .env")
        return
        
    client = OpenAI(
        api_key=api_key,
        base_url="https://openrouter.ai/api/v1",
    )
    try:
        response = client.chat.completions.create(
            model="google/gemma-2-9b-it:free",
            messages=[{"role": "user", "content": "say hello"}],
            max_tokens=10
        )
        print("SUCCESS:", response.choices[0].message.content)
    except Exception as e:
        print("ERROR:", e)

test_openrouter()
