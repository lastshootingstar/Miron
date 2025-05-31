# Core: gap finder logic

from typing import Dict, List, Any
import requests
import logging
from bs4 import BeautifulSoup
import re
from collections import Counter
from itertools import combinations

logger = logging.getLogger(__name__)

class GapFinder:
    def __init__(self, openrouter_api_key: str):
        self.openrouter_api_key = openrouter_api_key
        self.openrouter_url = "https://openrouter.ai/api/v1/chat/completions"
        self.model = "meta-llama/llama-3-8b-instruct"

    async def find_research_gaps(self, abstracts: List[str]) -> Dict[str, Any]:
        """Find research gaps across multiple abstracts"""
        try:
            combined_text = "\n\n".join([f"Abstract {i+1}:\n{abstract}" for i, abstract in enumerate(abstracts)])
            
            prompt = f"""Analyze these research abstracts to identify gaps in the literature:
            1. What important questions remain unanswered?
            2. What methodological approaches are underutilized?
            3. What populations or contexts are understudied?
            4. What theoretical frameworks could be explored?
            5. What potential interventions haven't been tested?

            Abstracts:
            {combined_text}
            """

            response = await self._get_llm_response(prompt, "You are a research gap analysis expert.")
            return {"gaps": response}
        except Exception as e:
            logger.error(f"Error finding research gaps: {e}")
            return {"error": str(e)}

    async def suggest_future_directions(self, abstracts: List[str]) -> Dict[str, Any]:
        """Suggest future research directions"""
        try:
            combined_text = "\n\n".join([f"Abstract {i+1}:\n{abstract}" for i, abstract in enumerate(abstracts)])
            
            prompt = f"""Based on these abstracts, suggest future research directions:
            1. What follow-up studies would be most valuable?
            2. What new methodologies could be applied?
            3. What populations should be studied next?
            4. What additional variables should be considered?
            5. What practical applications could be explored?

            Abstracts:
            {combined_text}
            """

            response = await self._get_llm_response(prompt, "You are a research direction expert.")
            return {"future_directions": response}
        except Exception as e:
            logger.error(f"Error suggesting future directions: {e}")
            return {"error": str(e)}

    async def analyze_methodology_gaps(self, abstracts: List[str]) -> Dict[str, Any]:
        """Analyze gaps in research methodology"""
        try:
            combined_text = "\n\n".join([f"Abstract {i+1}:\n{abstract}" for i, abstract in enumerate(abstracts)])
            
            prompt = f"""Analyze methodological gaps in these studies:
            1. What study designs are underrepresented?
            2. What measurement approaches could be improved?
            3. What statistical analyses could be more robust?
            4. What controls or comparisons are missing?
            5. What validity concerns need addressing?

            Abstracts:
            {combined_text}
            """

            response = await self._get_llm_response(prompt, "You are a research methodology expert.")
            return {"methodology_gaps": response}
        except Exception as e:
            logger.error(f"Error analyzing methodology gaps: {e}")
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
