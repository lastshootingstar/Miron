# Core: study design logic

from typing import Dict, List, Any
import requests
import logging
from bs4 import BeautifulSoup
import re

logger = logging.getLogger(__name__)

class DesignHelper:
    def __init__(self, openrouter_api_key: str):
        self.openrouter_api_key = openrouter_api_key
        self.openrouter_url = "https://openrouter.ai/api/v1/chat/completions"
        self.model = "meta-llama/llama-3-8b-instruct"

    async def suggest_study_design(self, research_question: str, context: str = "") -> Dict[str, Any]:
        """Suggest appropriate study design"""
        try:
            prompt = f"""Based on this research question and context, suggest an appropriate study design:
            
            Research Question:
            {research_question}

            Context (if provided):
            {context}

            Please provide:
            1. Recommended study design(s)
            2. Rationale for the recommendation
            3. Key methodological considerations
            4. Potential limitations and how to address them
            5. Sample size considerations
            6. Data collection methods
            7. Analysis approach
            """

            response = await self._get_llm_response(prompt, "You are a research design expert.")
            return {"design_suggestions": response}
        except Exception as e:
            logger.error(f"Error suggesting study design: {e}")
            return {"error": str(e)}

    async def validate_methodology(self, methodology: str) -> Dict[str, Any]:
        """Validate research methodology"""
        try:
            prompt = f"""Review this research methodology and provide feedback:

            Methodology:
            {methodology}

            Please assess:
            1. Internal validity
            2. External validity
            3. Construct validity
            4. Statistical conclusion validity
            5. Potential sources of bias
            6. Suggested improvements
            """

            response = await self._get_llm_response(prompt, "You are a methodology validation expert.")
            return {"validation_results": response}
        except Exception as e:
            logger.error(f"Error validating methodology: {e}")
            return {"error": str(e)}

    async def recommend_variables(self, study_context: str) -> Dict[str, Any]:
        """Recommend variables to measure"""
        try:
            prompt = f"""Based on this study context, recommend variables to measure:

            Context:
            {study_context}

            Please suggest:
            1. Key dependent variables
            2. Independent variables
            3. Control variables
            4. Potential confounding variables
            5. Measurement approaches for each
            6. Rationale for inclusion
            """

            response = await self._get_llm_response(prompt, "You are a research variables expert.")
            return {"variable_recommendations": response}
        except Exception as e:
            logger.error(f"Error recommending variables: {e}")
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
