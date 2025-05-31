import asyncio
import httpx
import logging
import json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_endpoint():
    logger.info("Starting test...")
    async with httpx.AsyncClient() as client:
        try:
            logger.info("Sending request to endpoint...")
            response = await client.post(
                "http://localhost:8000/api/crow-search",
                json={"query": "What is the role of HTRA1 in age-related macular degeneration?"}
            )
            
            logger.info(f"Status code: {response.status_code}")
            
            try:
                json_response = response.json()
                logger.info(f"Response JSON: {json.dumps(json_response, indent=2)}")
            except json.JSONDecodeError:
                logger.info(f"Raw response text: {response.text}")
            
        except Exception as e:
            logger.error(f"Error: {str(e)}")
            logger.error(f"Error type: {type(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")

if __name__ == "__main__":
    asyncio.run(test_endpoint()) 