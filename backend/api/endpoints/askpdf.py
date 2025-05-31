from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional, Dict, Any
import os
import logging
import sys
import pathlib

# Add the backend directory to the Python path
backend_dir = str(pathlib.Path(__file__).parent.parent.parent)
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

from pdfquery import PDFQuery
from utils.helpers import extract_text_from_pdf, get_full_text_from_doi, get_full_text_from_pmcid

router = APIRouter()
logger = logging.getLogger(__name__)

pdf_query = PDFQuery()

@router.post("/askpdf")
async def ask_pdf(
    pdf: UploadFile = File(...),
    query: str = Form(...),
    analysis_type: Optional[str] = Form("research")
) -> Dict[str, Any]:
    """
    Endpoint to upload a PDF, query its contents, and return a response.
    """
    try:
        # Extract text from PDF
        text = await extract_text_from_pdf(pdf)
        
        # Create embeddings for the text
        pdf_query.create_embeddings(text)
        
        # Get response based on analysis type
        if analysis_type == "study_data":
            response = await pdf_query.analyze_study_data(text)
        else:
            response = await pdf_query.query(query)
            
        return response
    except Exception as e:
        logger.error(f"Error in ask_pdf endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/get-full-text")
async def get_full_text(article_data: Dict[str, Optional[str]]) -> Dict[str, Any]:
    """
    Attempt to get full text access from various sources
    """
    try:
        doi = article_data.get("doi")
        pmcid = article_data.get("pmcid")
        
        if doi:
            result = await get_full_text_from_doi(doi)
            if result.get("pdfUrl") or result.get("htmlUrl"):
                return result
                
        if pmcid:
            result = await get_full_text_from_pmcid(pmcid)
            if result.get("pdfUrl") or result.get("htmlUrl") or result.get("fullText"):
                return result
                
        return {
            "message": "Could not find full text access",
            "embedPdf": False
        }
        
    except Exception as e:
        logger.error(f"Error getting full text: {e}")
        raise HTTPException(status_code=500, detail=str(e))
