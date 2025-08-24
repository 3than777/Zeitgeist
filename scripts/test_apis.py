#!/usr/bin/env python3
"""Test script to verify API connections"""

import asyncio
import os
from dotenv import load_dotenv
import httpx

load_dotenv()

async def test_polygon_api():
    """Test Polygon.io API connection"""
    api_key = os.getenv("POLYGON_API_KEY")
    if not api_key or api_key == "your_polygon_api_key_here":
        print("❌ Polygon API key not configured")
        return False
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"https://api.polygon.io/v2/aggs/ticker/AAPL/prev",
                headers={"Authorization": f"Bearer {api_key}"}
            )
            if response.status_code == 200:
                print("✅ Polygon API connection successful")
                return True
            else:
                print(f"❌ Polygon API error: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Polygon API connection failed: {e}")
            return False

async def test_openai_api():
    """Test OpenAI API connection"""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or api_key == "your_openai_api_key_here":
        print("❌ OpenAI API key not configured")
        return False
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {api_key}"},
                json={
                    "model": "gpt-3.5-turbo",
                    "messages": [{"role": "user", "content": "Say 'test'"}],
                    "max_tokens": 10
                }
            )
            if response.status_code == 200:
                print("✅ OpenAI API connection successful")
                return True
            else:
                print(f"❌ OpenAI API error: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ OpenAI API connection failed: {e}")
            return False

async def main():
    print("Testing API connections...\n")
    
    polygon_ok = await test_polygon_api()
    openai_ok = await test_openai_api()
    
    print("\n" + "="*50)
    if polygon_ok and openai_ok:
        print("✅ All API connections successful!")
    else:
        print("❌ Some API connections failed. Please check your API keys in .env file")

if __name__ == "__main__":
    asyncio.run(main())