import io
from pdfminer.converter import TextConverter
from pdfminer.pdfdocument import PDFDocument
from pdfminer.pdfinterp import PDFResourceManager, PDFPageInterpreter
from pdfminer.pdfpage import PDFPage
from pdfminer.pdfparser import PDFParser
import requests
import logging
from bs4 import BeautifulSoup
import re

logger = logging.getLogger(__name__)

async def extract_text_from_pdf(pdf_file):
    """
    Extracts text from a PDF file.
    """
    resource_manager = PDFResourceManager()
    output_string = io.StringIO()
    codec = 'utf-8'
    laparams = None
    text_converter = TextConverter(resource_manager, output_string, codec=codec, laparams=laparams)
    page_interpreter = PDFPageInterpreter(resource_manager, text_converter)

    pdf_content = await pdf_file.read()
    file_stream = io.BytesIO(pdf_content)
    parser = PDFParser(file_stream)
    document = PDFDocument(parser)

    for page in PDFPage.create_pages(document):
        page_interpreter.process_page(page)

    text = output_string.getvalue()

    text_converter.close()
    output_string.close()
    return text

async def get_full_text_from_doi(doi: str) -> dict:
    """
    Attempts to get full text access information from a DOI
    """
    try:
        # First try Unpaywall API
        unpaywall_email = "your-email@domain.com"  # Replace with your email
        unpaywall_url = f"https://api.unpaywall.org/v2/{doi}?email={unpaywall_email}"
        response = requests.get(unpaywall_url)
        
        if response.status_code == 200:
            data = response.json()
            best_oa_location = None
            
            # Find best open access location
            if data.get("is_oa"):
                locations = data.get("oa_locations", [])
                for location in locations:
                    if location.get("url_for_pdf"):
                        return {
                            "pdfUrl": location["url_for_pdf"],
                            "source": "Unpaywall",
                            "embedPdf": True
                        }
                    elif location.get("url"):
                        best_oa_location = location["url"]
                
                if best_oa_location:
                    return {
                        "htmlUrl": best_oa_location,
                        "source": "Unpaywall",
                        "embedPdf": False
                    }
        
        # Try SciHub as fallback
        scihub_url = f"https://sci-hub.se/{doi}"
        response = requests.get(scihub_url)
        
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            pdf_link = soup.find('iframe', {'id': 'pdf'})
            
            if pdf_link and pdf_link.get('src'):
                pdf_url = pdf_link['src']
                if not pdf_url.startswith('http'):
                    pdf_url = 'https:' + pdf_url
                
                return {
                    "pdfUrl": pdf_url,
                    "source": "Sci-Hub",
                    "embedPdf": True
                }
        
        return {
            "message": "No free full text source found",
            "embedPdf": False
        }
        
    except Exception as e:
        logger.error(f"Error getting full text for DOI {doi}: {e}")
        return {
            "message": f"Error: {str(e)}",
            "embedPdf": False
        }

async def get_full_text_from_pmcid(pmcid: str) -> dict:
    """
    Gets full text from PubMed Central using PMCID
    """
    try:
        base_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
        
        # First get the IDs
        efetch_url = f"{base_url}/efetch.fcgi"
        params = {
            "db": "pmc",
            "id": pmcid,
            "retmode": "xml"
        }
        
        response = requests.get(efetch_url, params=params)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'xml')
        
        # Try to get PDF link
        pdf_link = soup.find('self-uri', {'content-type': 'application/pdf'})
        if pdf_link and pdf_link.get('xlink:href'):
            return {
                "pdfUrl": pdf_link['xlink:href'],
                "source": "PMC",
                "embedPdf": True
            }
        
        # Get HTML link as fallback
        html_link = soup.find('self-uri', {'content-type': 'text/html'})
        if html_link and html_link.get('xlink:href'):
            return {
                "htmlUrl": html_link['xlink:href'],
                "source": "PMC",
                "embedPdf": False
            }
            
        # Extract full text from XML as last resort
        article_text = []
        for section in soup.find_all(['title', 'p']):
            text = section.get_text().strip()
            if text:
                article_text.append(text)
                
        if article_text:
            return {
                "fullText": "\n\n".join(article_text),
                "source": "PMC",
                "embedPdf": False
            }
            
        return {
            "message": "No full text content found in PMC",
            "embedPdf": False
        }
        
    except Exception as e:
        logger.error(f"Error getting full text from PMC {pmcid}: {e}")
        return {
            "message": f"Error: {str(e)}",
            "embedPdf": False
        }
