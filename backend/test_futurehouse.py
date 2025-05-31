import asyncio
from futurehouse_service import FutureHouseService
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_futurehouse():
    api_key = "47dZJjMSffSD+UV8M2Ob+g.platformv01.eyJqdGkiOiJlYWRlY2RmMy0wOWU4LTQyZDMtYWFlNC1kMGIwMWY1NzUwYmUiLCJzdWIiOiI3S1hqNjl5VlNoVjRobFZnbFRGbloxY255R2kxIiwiaWF0IjoxNzQ4NjIxNTUwLCJleHAiOjE3NTEyMTM1NTB9.BdXfLJZm40N5FDA5U3IlNTBJOiamf5eGMP+YhQ4LwcA"
    service = FutureHouseService(api_key)
    
    try:
        logger.info("Testing FutureHouse API connection...")
        result = await service.run_crow_search("What is the role of HTRA1 in age-related macular degeneration?")
        logger.info("Test successful!")
        logger.info(f"Result: {result}")
    except Exception as e:
        logger.error(f"Test failed: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_futurehouse()) 