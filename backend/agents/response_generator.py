from typing import List, Dict, Any


class ResponseGeneratorAgent:
    """
    Generates natural, multilingual responses using Groq Llama
    """

    def __init__(self, groq_service):
        self.groq = groq_service

    async def generate(
        self,
        query: str,
        language: str,
        intent: str,
        kb_context: List[Dict[str, Any]],
        entities: Dict[str, Any]
    ) -> str:
        """
        Generate response in customer's language using KB context
        """
        context_text = "\n".join([
            f"- {doc['answer']}" for doc in kb_context
        ])

        language_names = {
            "es": "Spanish",
            "en": "English",
            "fr": "French",
            "de": "German",
            "pt": "Portuguese",
            "ja": "Japanese",
            "zh": "Mandarin Chinese",
            "hi": "Hindi",
            "ko": "Korean",
            "it": "Italian",
            "ru": "Russian",
            "ar": "Arabic"
        }

        lang_name = language_names.get(language, "English")

        prompt = f"""You are a professional customer support agent. 
Generate a helpful response in {lang_name} to this customer query.
Use the provided knowledge base information to answer accurately.
Be empathetic, clear, and concise (2-3 sentences max).

Customer Query: "{query}"
Support Category: {intent}
Customer Language: {lang_name}

Knowledge Base Information:
{context_text}

Important: 
- Respond ONLY in {lang_name}
- Be natural and conversational
- Do not mention KB sources
- If customer asks about order/account specific info, reference it appropriately
- Keep response under 200 characters for good video generation

Generate only the response text, nothing else:"""

        response = await self.groq.call(prompt, max_tokens=200)
        return response.strip()

    async def regenerate(
        self,
        query: str,
        language: str,
        feedback: str,
        kb_context: List[Dict[str, Any]]
    ) -> str:
        """
        Regenerate response based on quality feedback
        """
        context_text = "\n".join([
            f"- {doc['answer']}" for doc in kb_context
        ])

        prompt = f"""Regenerate this customer support response.
The previous version had this issue: {feedback}

Original Query: "{query}"
Language: {language}

Knowledge Base:
{context_text}

Generate ONLY the improved response text, nothing else:"""

        response = await self.groq.call(prompt, max_tokens=200)
        return response.strip()