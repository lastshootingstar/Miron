# Core: manuscript generator

from typing import Dict, List, Any
import requests
import logging
from bs4 import BeautifulSoup
import re

logger = logging.getLogger(__name__)

class ManuscriptGenerator:
    def __init__(self, openrouter_api_key: str):
        self.openrouter_api_key = openrouter_api_key
        self.openrouter_url = "https://openrouter.ai/api/v1/chat/completions"
        self.model = "meta-llama/llama-3-8b-instruct"

    async def generate_abstract(self, study_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate research abstract"""
        try:
            prompt = f"""Generate a structured research abstract based on this study data:

            Study Information:
            {study_data}

            Please include:
            1. Background/Objective
            2. Methods
            3. Results
            4. Conclusions
            5. Keywords

            Follow standard academic writing style and formatting.
            """

            response = await self._get_llm_response(prompt, "You are an academic writing expert.")
            return {"abstract": response}
        except Exception as e:
            logger.error(f"Error generating abstract: {e}")
            return {"error": str(e)}

    async def generate_methods(self, methodology: Dict[str, Any]) -> Dict[str, Any]:
        """Generate methods section"""
        try:
            prompt = f"""Generate a detailed methods section based on this methodology:

            Methodology:
            {methodology}

            Include:
            1. Study design
            2. Participants and recruitment
            3. Data collection procedures
            4. Measures and instruments
            5. Data analysis approach
            6. Ethical considerations

            Follow standard academic writing style and formatting.
            """

            response = await self._get_llm_response(prompt, "You are a research methods writing expert.")
            return {"methods_section": response}
        except Exception as e:
            logger.error(f"Error generating methods section: {e}")
            return {"error": str(e)}

    async def generate_discussion(self, results: Dict[str, Any], literature: List[str]) -> Dict[str, Any]:
        """Generate discussion section"""
        try:
            prompt = f"""Generate a discussion section based on these results and literature:

            Results:
            {results}

            Literature Context:
            {literature}

            Include:
            1. Summary of key findings
            2. Interpretation of results
            3. Comparison with existing literature
            4. Implications
            5. Limitations
            6. Future directions

            Follow standard academic writing style and formatting.
            """

            response = await self._get_llm_response(prompt, "You are a research discussion writing expert.")
            return {"discussion_section": response}
        except Exception as e:
            logger.error(f"Error generating discussion section: {e}")
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
