from typing import Dict, Any, List
import logging
from pydantic import BaseModel
from futurehouse_client import FutureHouseClient, JobNames
from futurehouse_client.models.app import TaskRequest

logger = logging.getLogger("futurehouse_service")
logging.basicConfig(level=logging.DEBUG)

class SearchResult(BaseModel):
    title: str
    abstract: str | None = None
    authors: List[str] | None = None
    year: str | None = None
    doi: str | None = None
    url: str | None = None
    score: float

class SearchResponse(BaseModel):
    results: List[SearchResult]
    total_count: int = 0
    current_page: int = 1
    total_pages: int = 1

class FutureHouseService:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.client = FutureHouseClient(api_key=api_key)
        logger.debug(f"✅ FutureHouseClient initialized with API key.")

    async def run_crow_search(self, query: str) -> Dict[str, Any]:
        try:
            logger.info(f"🔍 Running Crow search using SDK for query: {query}")

            task_request = TaskRequest(
                name=JobNames.CROW,
                query=query
            )
            responses = self.client.run_tasks_until_done(task_request)

            formatted_results = []
            for response in responses:
                formatted_results.append({
                    "title": response.title or "Untitled",
                    "abstract": response.abstract,
                    "authors": response.authors or [],
                    "year": response.year,
                    "doi": response.doi,
                    "url": response.url,
                    "score": float(response.score or 0)
                })

            return {
                "results": formatted_results,
                "total_count": len(formatted_results),
                "current_page": 1,
                "total_pages": 1
            }

        except Exception as e:
            logger.error(f"❌ Error in run_crow_search: {str(e)}")
            return {
                "results": [],
                "total_count": 0,
                "current_page": 1,
                "total_pages": 1
            }
