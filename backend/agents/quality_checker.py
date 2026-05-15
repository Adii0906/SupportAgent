from typing import Tuple
import json


class QualityCheckerAgent:
    """
    Validates response quality before sending to customer
    Checks for hallucinations, clarity, and accuracy
    """

    def __init__(self, groq_service):
        self.groq = groq_service

    async def validate(self, response_text: str) -> Tuple[bool, str]:
        """
        Validate response quality
        Returns (is_valid, feedback)
        """
        prompt = f"""Validate this customer support response for quality.
Check for: clarity, helpfulness, professionalism, hallucinations.

Response: "{response_text}"

Return ONLY JSON:
{{"is_valid": true/false, "feedback": "...", "issues": []}}

If valid, set is_valid to true. If not, provide specific feedback to fix it.
"""
        response = await self.groq.call(prompt, max_tokens=150)
        
        try:
            result = json.loads(response)
            return result["is_valid"], result.get("feedback", "")
        except:
            return True, ""

    async def check_hallucination(
        self, response: str, kb_sources: list
    ) -> Tuple[bool, str]:
        """
        Check if response contains hallucinations
        (claims not supported by KB)
        """
        sources_text = "\n".join([f"- {s['answer']}" for s in kb_sources])

        prompt = f"""Check if this response contains claims NOT supported by the knowledge base.

Response: "{response}"

Knowledge Base Sources:
{sources_text}

Return ONLY JSON:
{{"has_hallucination": true/false, "unsupported_claims": []}}
"""
        response = await self.groq.call(prompt, max_tokens=150)
        
        try:
            result = json.loads(response)
            return not result["has_hallucination"], result.get("unsupported_claims", [])
        except:
            return True, []