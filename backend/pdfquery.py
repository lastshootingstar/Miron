from typing import List, Dict, Any
import fitz  # PyMuPDF
from langchain.text_splitter import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer
import numpy as np
import requests
import os
import logging
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

class PDFQuery:
    def __init__(self):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len
        )
        self.embeddings_model = SentenceTransformer('all-MiniLM-L6-v2')
        self.openrouter_api_key = "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"
        self.chunks = []
        self.embeddings = None

    def process_pdf(self, pdf_content: bytes) -> str:
        """Process PDF content and return extracted text"""
        try:
            doc = fitz.open(stream=pdf_content, filetype="pdf")
            text = ""
            for page in doc:
                text += page.get_text()
            return text
        except Exception as e:
            logger.error(f"Error processing PDF: {e}")
            raise

    def create_embeddings(self, text: str):
        """Create embeddings for text chunks"""
        self.chunks = self.text_splitter.split_text(text)
        self.embeddings = self.embeddings_model.encode(self.chunks)

    def get_relevant_chunks(self, query: str, top_k: int = 3) -> List[str]:
        """Get most relevant chunks for a query"""
        query_embedding = self.embeddings_model.encode([query])[0]
        similarities = np.dot(self.embeddings, query_embedding)
        most_relevant = np.argsort(similarities)[-top_k:][::-1]
        return [self.chunks[i] for i in most_relevant]

    async def query(self, query: str, context: str = None) -> dict:
        """Query the PDF content using OpenRouter's LLaMA model"""
        try:
            relevant_chunks = self.get_relevant_chunks(query)
            context_text = "\n\n".join(relevant_chunks)

            prompt = f"""Based on the following context, please answer the question.
            If the information is not available in the context, please say so.

            Context:
            {context_text}

            Question: {query}
            """

            headers = {
                "HTTP-Referer": "https://openrouter.ai/",
                "Authorization": f"Bearer {self.openrouter_api_key}",
                "Content-Type": "application/json"
            }

            payload = {
                "model": "meta-llama/llama-3-8b-instruct",
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a helpful research assistant. Analyze the text and provide clear, accurate answers."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "temperature": 0.3,
                "max_tokens": 1000
            }

            logger.debug("Making request to OpenRouter")
            response = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=30
            )

            if response.status_code != 200:
                logger.error(f"OpenRouter API Error: {response.status_code}")
                logger.error(f"Response content: {response.text}")
                return {
                    "success": False,
                    "analysis": "Failed to get response from language model"
                }

            result = response.json()
            if not result.get("choices"):
                return {
                    "success": False,
                    "analysis": "No response received from language model"
                }

            return {
                "success": True,
                "analysis": result["choices"][0]["message"]["content"].strip(),
                "sources": relevant_chunks
            }

        except Exception as e:
            logger.error(f"Error querying PDF: {e}")
            return {
                "success": False,
                "analysis": f"An error occurred: {str(e)}"
            }

    async def analyze_study_data(self, text: str) -> Dict[str, Any]:
        """Extract study data like sample size, outcomes, etc."""
        try:
            prompt = f"""From the following text, extract:
            - Sample size
            - Primary outcome
            - Effect size
            - Confidence interval
            - Study type
            - Population characteristics

            Text:
            {text[:4000]}  # Limit text length

            Respond in JSON format with these keys: sample_size, outcome, effect_size, confidence_interval, study_type, population
            """

            headers = {
                "Authorization": f"Bearer {self.openrouter_api_key}",
                "Content-Type": "application/json"
            }

            payload = {
                "model": "meta-llama/llama-3-8b-instruct",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.3
            }

            response = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            result = response.json()

            if not result.get("choices"):
                return {"error": "No response from model"}

            content = result["choices"][0]["message"]["content"]
            
            # Extract JSON from response
            import re
            import json
            json_match = re.search(r"\{.*\}", content, re.DOTALL)
            if not json_match:
                return {"error": "Could not parse model output"}
                
            data = json.loads(json_match.group(0))
            return data

        except Exception as e:
            logger.error(f"Error analyzing study data: {e}")
            return {"error": str(e)} 