# Core: data analyzer

from typing import Dict, List, Any
import requests
import logging
from bs4 import BeautifulSoup
import re

logger = logging.getLogger(__name__)

class ResearchAnalyzer:
    def __init__(self, openrouter_api_key: str):
        self.openrouter_api_key = openrouter_api_key
        self.openrouter_url = "https://openrouter.ai/api/v1/chat/completions"
        self.model = "meta-llama/llama-3-8b-instruct"

    async def analyze_methodology(self, text: str) -> Dict[str, Any]:
        """Analyze research methodology"""
        try:
            prompt = f"""Analyze the research methodology in this text. Consider:
            - Study design
            - Data collection methods
            - Analysis techniques
            - Potential limitations
            - Methodological strengths

            Text:
            {text}
            """

            response = await self._get_llm_response(prompt, "You are a research methodology expert.")
            return {"methodology_analysis": response}
        except Exception as e:
            logger.error(f"Error analyzing methodology: {e}")
            return {"error": str(e)}

    async def extract_metrics(self, text: str) -> Dict[str, Any]:
        """Extract research metrics and statistics"""
        try:
            prompt = f"""Extract key metrics and statistics from this text:
            - Sample sizes
            - Effect sizes
            - P-values
            - Confidence intervals
            - Other statistical measures

            Text:
            {text}
            """

            response = await self._get_llm_response(prompt, "You are a statistical analysis expert.")
            return {"metrics": response}
        except Exception as e:
            logger.error(f"Error extracting metrics: {e}")
            return {"error": str(e)}

    async def identify_gaps(self, text: str) -> Dict[str, Any]:
        """Identify research gaps and future directions"""
        try:
            prompt = f"""Identify research gaps and future directions based on this text:
            - Unexplored areas
            - Methodological limitations
            - Potential research questions
            - Suggested improvements
            - Future applications

            Text:
            {text}
            """

            response = await self._get_llm_response(prompt, "You are a research gap analysis expert.")
            return {"gaps": response}
        except Exception as e:
            logger.error(f"Error identifying gaps: {e}")
            return {"error": str(e)}

    async def _get_llm_response(self, prompt: str, system_message: str) -> str:
        """Get response from language model"""
        headers = {
            "HTTP-Referer": "https://openrouter.ai/",
            "Authorization": f"Bearer {self.openrouter_api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "system",
                    "content": system_message
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.3
        }

        response = requests.post(
            self.openrouter_url,
            headers=headers,
            json=payload
        )
        response.raise_for_status()
        result = response.json()

        if not result.get("choices"):
            raise Exception("No response from language model")

        return result["choices"][0]["message"]["content"].strip()
