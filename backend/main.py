from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials, OAuth2PasswordBearer, OAuth2PasswordRequestForm
import requests
import xml.etree.ElementTree as ET
import os
from dotenv import load_dotenv
import jwt
from datetime import datetime, timedelta
from pydantic import BaseModel
from fuzzywuzzy import fuzz
import logging
from typing import Optional, Dict, List, Any
import json
from bs4 import BeautifulSoup
from urllib.parse import quote
from futurehouse_service import FutureHouseService, SearchResponse, SearchResult
from models import CrowSearchRequest, CrowSearchResponse, CrowSearchResult

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Create downloads directory if it doesn't exist
downloads_dir = os.path.join(os.path.dirname(__file__), "downloads")
os.makedirs(downloads_dir, exist_ok=True)

# Mount the downloads directory
app.mount("/downloads", StaticFiles(directory=downloads_dir), name="downloads")

# Secret key for JWT encoding and decoding
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key")

# API Key for OpenRouter
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "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")

# LLaMA 3.8 via OpenRouter API URL
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_MODEL = "meta-llama/llama-3-8b-instruct"

# Initialize FutureHouse service with the working API key
FUTUREHOUSE_API_KEY = "47dZJjMSffSD+UV8M2Ob+g.platformv01.eyJqdGkiOiJlYWRlY2RmMy0wOWU4LTQyZDMtYWFlNC1kMGIwMWY1NzUwYmUiLCJzdWIiOiI3S1hqNjl5VlNoVjRobFZnbFRGbloxY255R2kxIiwiaWF0IjoxNzQ4NjIxNTUwLCJleHAiOjE3NTEyMTM1NTB9.BdXfLJZm40N5FDA5U3IlNTBJOiamf5eGMP+YhQ4LwcA"
futurehouse_service = FutureHouseService(api_key=FUTUREHOUSE_API_KEY)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:5174"],  # Allow Vite and Next.js
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security scheme for JWT
security = HTTPBearer()

# JWT Configuration
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")

# Function to verify JWT token
async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Model classes
class User(BaseModel):
    username: str
    password: str

# Mock user for demo (replace with database in production)
DEMO_USER = {
    "email": "demo@example.com",
    "password": "demo123"
}

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        if email != DEMO_USER["email"]:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    return email

# Login API to authenticate the user and return JWT token
@app.post("/api/login")
async def login(user: User):
    if user.username != DEMO_USER["email"] or user.password != DEMO_USER["password"]:
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# PubMed search API
@app.get("/search")
def search_pubmed(query: str, page: int = 1):
    try:
        logger.info(f"Searching PubMed for query: {query}, page: {page}")
        
        # Calculate start position
        retstart = (page - 1) * 10
        
        # First get IDs - ask for more than we need to ensure we have enough after filtering
        esearch_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
        params = {
            "db": "pubmed",
            "term": query,
            "retstart": str(retstart),
            "retmax": "100",  # Ask for more to ensure we get enough valid ones
            "retmode": "json"
        }
        
        response = requests.get(esearch_url, params=params)
        data = response.json()
        
        # Get total count and IDs
        total_count = int(data['esearchresult'].get('count', '0'))
        pmids = data['esearchresult'].get('idlist', [])

        # If no results, return empty
        if not pmids:
            return {
                "results": [],
                "total_count": 0,
                "current_page": page,
                "total_pages": 0
            }
            
        # Get article details
        efetch_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"
        params = {
            "db": "pubmed",
            "id": ",".join(pmids),
            "retmode": "xml"
        }

        response = requests.get(efetch_url, params=params)
        root = ET.fromstring(response.text)

        # Process articles
        results = []
        start_number = ((page - 1) * 10) + 1
        
        # Process all articles first
        for article in root.findall(".//PubmedArticle"):
            title_elem = article.find(".//ArticleTitle")
            abstract_elem = article.find(".//Abstract/AbstractText")
                
            if title_elem is not None and abstract_elem is not None:
                # Get authors
                authors = []
                for author in article.findall(".//Author"):
                    lastname = author.find("LastName")
                    forename = author.find("ForeName")
                    if lastname is not None and forename is not None:
                        authors.append(f"{forename.text} {lastname.text}")
                
                # Get year
                year_elem = article.find(".//PubDate/Year")
                year = year_elem.text if year_elem is not None else "N/A"
                
                # Get article type
                types = article.findall(".//PublicationType")
                article_type = types[0].text if types else "Article"
                
                # Get IDs
                pmid = article.find(".//PMID").text if article.find(".//PMID") is not None else None
                doi = None
                pmcid = None
                for id_elem in article.findall(".//ArticleId"):
                    if id_elem.get("IdType") == "doi":
                        doi = id_elem.text
                    elif id_elem.get("IdType") == "pmc":
                        pmcid = id_elem.text

                results.append({
                    "number": start_number + len(results),
                    "title": title_elem.text,
                    "abstract": abstract_elem.text,
                    "authors": authors[:3] if authors else ["No authors listed"],
                    "year": year,
                    "article_type": article_type,
                    "pmid": pmid,
                    "doi": doi,
                    "pmcid": pmcid,
                    "full_text_available": bool(doi or pmcid)
                })
                
                # Stop once we have 10 articles
                if len(results) == 10:
                    break
        
        # Return exactly 10 results
        return {
            "results": results[:10],
            "total_count": total_count,
            "current_page": page,
            "total_pages": (total_count + 9) // 10  # Ceiling division
        }
        
    except Exception as e:
        logger.error(f"Error in search_pubmed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Summarize an article based on its abstract
@app.post("/summarize")
async def summarize_article(request: Request):
    try:
        body = await request.json()
        abstract = body.get("abstract", "")
        if not abstract:
            raise HTTPException(status_code=400, detail="No abstract provided")

        prompt = f"""
        Summarize this research abstract in 3-4 sentences, highlighting:
        - Main objective
        - Methods used
        - Key findings
        - Main conclusion

        Abstract:
        {abstract}
        """

        headers = {
            "HTTP-Referer": "https://openrouter.ai/",
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": OPENROUTER_MODEL,
            "messages": [
                {
                    "role": "system",
                    "content": "You are a helpful scientific research assistant. Provide clear, concise summaries."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.3
        }

        response = requests.post(OPENROUTER_API_URL, json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()

        if not data.get("choices"):
            raise HTTPException(status_code=500, detail="No response from language model")

        return {"summary": data["choices"][0]["message"]["content"].strip()}
    except Exception as e:
        logger.error(f"Error in summarize_article: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Analyze abstracts and identify research gaps
@app.post("/analyze")
async def analyze_abstracts(request: Request):
    try:
        body = await request.json()
        abstracts = body.get("abstracts", [])
        if not abstracts:
            raise HTTPException(status_code=400, detail="No abstracts provided")

        joined_text = "\n\n".join([f"Abstract {i+1}:\n{abstract}" for i, abstract in enumerate(abstracts)])
        prompt = f"""
        Analyze these research abstracts collectively to:
        1. Identify common themes and findings
        2. Highlight any contradictions or inconsistencies
        3. Point out research gaps and unexplored areas
        4. Suggest potential future research directions
        5. Assess the overall state of evidence

        Abstracts:
        {joined_text}
        """

        headers = {
            "HTTP-Referer": "https://openrouter.ai/",
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": OPENROUTER_MODEL,
            "messages": [
                {
                    "role": "system",
                    "content": "You are a research synthesis expert. Analyze multiple studies to identify patterns, gaps, and future directions."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.3
        }

        response = requests.post(OPENROUTER_API_URL, json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()

        if not data.get("choices"):
            raise HTTPException(status_code=500, detail="No response from language model")

        return {"output": data["choices"][0]["message"]["content"].strip()}
    except Exception as e:
        logger.error(f"Error in analyze_abstracts: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Extract study data based on the abstract
@app.post("/extract-study-data")
async def extract_study_data(request: Request):
    try:
        body = await request.json()
        abstract = body.get("abstract", "")
        if not abstract:
            raise HTTPException(status_code=400, detail="No abstract provided")

        prompt = f"""
        Extract the following information from this research abstract:
        - Sample size (number of participants)
        - Primary outcome measures
        - Effect sizes (e.g., relative risk, odds ratio, mean difference)
        - Statistical significance (p-values)
        - Confidence intervals
        - Study design type
        - Key limitations

        Format your answer in JSON.

        Abstract:
        {abstract}
        """

        headers = {
            "HTTP-Referer": "https://openrouter.ai/",
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": OPENROUTER_MODEL,
            "messages": [
                {
                    "role": "system",
                    "content": "You are a statistical analysis expert. Extract and explain statistical information clearly."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.3
        }

        response = requests.post(OPENROUTER_API_URL, json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()

        if not data.get("choices"):
            raise HTTPException(status_code=500, detail="No response from language model")

        content = data["choices"][0]["message"]["content"].strip()
        
        # Try to parse JSON from the response
        try:
            import re
            match = re.search(r"\{.*\}", content, re.DOTALL)
            if match:
                extracted_data = json.loads(match.group(0))
            else:
                extracted_data = {
                    "error": "Could not extract JSON from response",
                    "raw_response": content
                }
        except json.JSONDecodeError:
            extracted_data = {
                "error": "Invalid JSON in response",
                "raw_response": content
            }

        return extracted_data
    except Exception as e:
        logger.error(f"Error in extract_study_data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Updated endpoint for search suggestions with dynamic behavior
@app.get("/suggestions")
def get_suggestions(query: str):
    try:
        # Example list of topics (in practice, this could come from a database)
        all_suggestions = [
            "hypertension", "hyperglycemia", "hypoglycemia", "hysterectomy",
            "hypotension", "hypersensitivity", "anxiety", "depression", "diabetes",
            "cardiovascular disease", "cancer", "obesity", "stroke", "mental health",
            "diabetic neuropathy", "insulin resistance", "endocrinology"
        ]

        # Use fuzzy matching to find the closest matches
        filtered_suggestions = [
            suggestion for suggestion in all_suggestions 
            if fuzz.partial_ratio(query.lower(), suggestion.lower()) > 70
        ]

        # Return the top 5 suggestions
        return {"suggestions": filtered_suggestions[:5]}
    except Exception as e:
        logger.error(f"Error in get_suggestions: {e}")
        return {"suggestions": []}

# Endpoint to ask about an article's content and get a chatbot response
@app.post("/ask-about-article")
async def ask_about_article(request: Request):
    try:
        body = await request.json()
        article_content = body.get("article_content", "")
        user_query = body.get("query", "")
        context = body.get("context", "")
        history = body.get("history", [])
        
        if not article_content or not user_query:
            raise HTTPException(status_code=400, detail="Please provide both article content and a query")

        # Build conversation history
        messages = [
            {
                "role": "system",
                "content": "You are a helpful scientific research assistant. Analyze the article content and provide clear, accurate answers."
            }
        ]

        # Add context if provided
        if context:
            messages.append({
                "role": "system",
                "content": f"Context: {context}"
            })

        # Add conversation history
        for entry in history:
            messages.extend([
                {"role": "user", "content": entry["q"]},
                {"role": "assistant", "content": entry["a"]}
            ])

        # Add current query
        messages.append({
            "role": "user",
            "content": f"""
            Based on this article content:
            {article_content}

            Answer this question:
            {user_query}
        """
        })

        headers = {
            "HTTP-Referer": "https://openrouter.ai/",
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": OPENROUTER_MODEL,
            "messages": messages,
            "temperature": 0.3
        }

        response = requests.post(OPENROUTER_API_URL, json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()

        if not data.get("choices"):
            raise HTTPException(status_code=500, detail="No response from language model")

        return {
            "response": data["choices"][0]["message"]["content"].strip(),
            "confidence": "high"  # You could implement actual confidence scoring
        }
    except Exception as e:
        logger.error(f"Error in ask_about_article: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def search_article(title):
    """Search for article using multiple sources."""
    logger.info(f"Searching for article: {title}")
    
    # Try PubMed first
    encoded_title = quote(title)
    pubmed_url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term={encoded_title}&retmode=json"
    try:
        response = requests.get(pubmed_url)
        if response.ok:
            data = response.json()
            if 'esearchresult' in data and data['esearchresult'].get('idlist'):
                pmid = data['esearchresult']['idlist'][0]
                article_url = f"https://pubmed.ncbi.nlm.nih.gov/{pmid}"
                return {"url": article_url, "source": "pubmed"}
    except Exception as e:
        logger.error(f"PubMed search error: {str(e)}")

    # Try Google Scholar as fallback
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        search_url = f"https://scholar.google.com/scholar?q={encoded_title}"
        response = requests.get(search_url, headers=headers)
        if response.ok:
            soup = BeautifulSoup(response.text, 'html.parser')
            results = soup.find_all('div', class_='gs_r')
            if results:
                for result in results:
                    link = result.find('a')
                    if link and link.get('href'):
                        return {"url": link['href'], "source": "google_scholar"}
    except Exception as e:
        logger.error(f"Google Scholar search error: {str(e)}")

    return None

@app.post("/get-full-text")
async def get_full_text(request: Request):
    try:
        data = await request.json()
        title = data.get("title")
        doi = data.get("doi")
        pmcid = data.get("pmcid")
        
        logger.info(f"Getting full text for article: {title}")
        logger.info(f"DOI: {doi}, PMCID: {pmcid}")

        # Try PMC first if available
        if pmcid:
            pmcid = pmcid.replace("PMC", "")  # Remove PMC prefix if present
            pmc_url = f"https://www.ncbi.nlm.nih.gov/pmc/articles/PMC{pmcid}"
            return {
                "htmlUrl": pmc_url,
                "source": "PMC",
                "message": "Full text available on PMC",
                "embedPdf": False
            }

        # Try DOI next
        if doi:
            try:
                # First try to resolve the DOI
                doi_url = f"https://doi.org/{doi}"
                headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                }
                
                response = requests.head(doi_url, headers=headers, allow_redirects=True, timeout=10)
                if response.ok:
                    publisher_url = response.url
                    return {
                        "htmlUrl": publisher_url,
                        "source": "Publisher",
                        "message": "Full text available on publisher's website",
                        "embedPdf": False
                    }
            except Exception as e:
                logger.error(f"Error resolving DOI: {e}")

        # If no DOI or PMC ID, try searching by title
        if title:
            encoded_title = quote(title)
            pubmed_url = f"https://pubmed.ncbi.nlm.nih.gov/?term={encoded_title}"
        return {
                "htmlUrl": pubmed_url,
                "source": "PubMed",
                "message": "View on PubMed",
                "embedPdf": False
            }

        return {
            "htmlUrl": None,
            "source": None,
            "message": "No full text link available",
            "embedPdf": False
        }

    except Exception as e:
        logger.error(f"Error getting full text: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/crow-search")
async def crow_search(request: CrowSearchRequest, current_user: str = Depends(get_current_user)) -> CrowSearchResponse:
    try:
        results = await futurehouse_service.run_crow_search(request.query)
        return CrowSearchResponse(**results)
    except Exception as e:
        logger.error(f"Error in crow search: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000) 