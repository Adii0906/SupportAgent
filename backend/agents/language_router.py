from typing import Tuple, Dict, Any
import json


class LanguageRouterAgent:
    """
    Detects language, extracts intent, and routes to appropriate handler
    """

    def __init__(self, groq_service):
        self.groq = groq_service
        self.supported_languages = {
            "es", "en", "fr", "de", "pt", "ja", "zh", "hi", "ko", "it", "ru", "ar"
        }

    async def detect_language(self, text: str) -> Tuple[str, float]:
        """
        Detect language using Groq Llama
        Returns language code and confidence score
        """
        prompt = f"""Detect the language of this text and return ONLY a JSON object.
Text: "{text}"

Return ONLY this JSON format, no other text:
{{"language_code": "xx", "language_name": "Language", "confidence": 0.95}}

Language codes: es=Spanish, en=English, fr=French, de=German, pt=Portuguese, ja=Japanese, zh=Mandarin, hi=Hindi, ko=Korean, it=Italian, ru=Russian, ar=Arabic
"""
        response = await self.groq.call(prompt, max_tokens=100)
        try:
            result = json.loads(response)
            return result["language_code"], result["confidence"]
        except:
            return "en", 0.5

    async def extract_intent(
        self, text: str, language: str
    ) -> Tuple[str, Dict[str, Any]]:
        """
        Extract intent and entities from customer query
        """
        prompt = f"""Analyze this {language} customer support query.
Query: "{text}"

Extract and return ONLY JSON:
{{"intent": "billing|technical|shipping|refund|account|other", "entities": {{"product": "...", "order_id": "...", "issue_type": "..."}}, "urgency": "low|medium|high"}}
"""
        response = await self.groq.call(prompt, max_tokens=150)
        try:
            result = json.loads(response)
            return result["intent"], result.get("entities", {})
        except:
            return "other", {}

    async def route(self, intent: str, language: str) -> str:
        """
        Route to appropriate knowledge base section
        """
        routing_map = {
            "billing": "billing_faq",
            "technical": "technical_support",
            "shipping": "shipping_tracking",
            "refund": "refund_policy",
            "account": "account_management",
            "other": "general_faq"
        }
        return routing_map.get(intent, "general_faq")