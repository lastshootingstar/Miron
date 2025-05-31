from pydantic import BaseModel
from typing import List, Optional

class CrowSearchRequest(BaseModel):
    query: str
    
class CrowSearchResult(BaseModel):
    title: str
    abstract: Optional[str] = None
    authors: List[str] = []
    year: Optional[str] = None
    doi: Optional[str] = None
    url: Optional[str] = None
    score: float = 0.0

class CrowSearchResponse(BaseModel):
    results: List[CrowSearchResult] = []
    total_count: int = 0
    current_page: int = 1
    total_pages: int = 1 