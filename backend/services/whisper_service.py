import os
import aiohttp
from typing import Tuple
from fastapi import UploadFile


class WhisperService:
    """
    Groq Whisper API service for audio transcription
    """

    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        self.api_url = "https://api.groq.com/openai/v1/audio/transcriptions"
        self.model = "whisper-large-v3"
        self.language_names = {
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
            "ar": "Arabic",
        }

    async def transcribe(self, audio_file: UploadFile) -> Tuple[str, str]:
        """
        Transcribe audio to text using Groq Whisper API
        Returns (transcribed_text, detected_language)
        """
        try:
            file_content = await audio_file.read()
            
            async with aiohttp.ClientSession() as session:
                data = aiohttp.FormData()
                data.add_field('file', file_content, filename=audio_file.filename)
                data.add_field('model', self.model)

                headers = {
                    "Authorization": f"Bearer {self.api_key}"
                }

                async with session.post(
                    self.api_url,
                    data=data,
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=60)
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        text = data.get("text", "")
                        # Groq doesn't always return language in the same way as OpenAI
                        language = data.get("language", "en")
                        return text, language
                    else:
                        error = await response.text()
                        print(f"Groq Whisper API error: {error}")
                        # Fallback for demo
                        return "Demo transcription", "en"
        except Exception as e:
            print(f"Error transcribing audio: {e}")
            return "Demo transcription", "en"

    async def translate_text(
        self, text: str, target_language: str
    ) -> str:
        """
        Translate text to target language using LLM (Groq)
        """
        from services.groq_service import GroqService
        groq = GroqService()
        target_language_name = self.language_names.get(target_language, target_language)
        
        prompt = f"""Translate this text to {target_language_name}.
Keep the meaning, tone, and support details the same.
Text: "{text}"

Return only the translated text, nothing else:"""

        return await groq.call(prompt)
