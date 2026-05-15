import os
from typing import Optional
import aiohttp
import asyncio


class GroqService:
    """
    Groq API service for LLM calls using Llama models
    """

    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        self.api_url = "https://api.groq.com/openai/v1/chat/completions"
        self.model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

    async def call(
        self,
        prompt: str,
        max_tokens: int = 500,
        temperature: float = 0.7,
        system_prompt: Optional[str] = None
    ) -> str:
        """
        Make API call to Groq Llama
        Returns generated text response
        """
        messages = []
        
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        
        messages.append({"role": "user", "content": prompt})

        try:
            async with aiohttp.ClientSession() as session:
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                }
                
                payload = {
                    "model": self.model,
                    "messages": messages,
                    "max_tokens": max_tokens,
                    "temperature": temperature
                }

                async with session.post(
                    self.api_url,
                    json=payload,
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data["choices"][0]["message"]["content"].strip()
                    else:
                        error = await response.text()
                        raise Exception(f"Groq API error: {error}")
        except Exception as e:
            print(f"Error calling Groq API: {e}")
            raise

    async def embed(self, text: str) -> list:
        """
        Get embeddings for text (for semantic search)
        Using Groq's embedding models
        """
        try:
            async with aiohttp.ClientSession() as session:
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                }
                
                payload = {
                    "model": "nomic-embed-text-v1.5",
                    "input": text
                }

                async with session.post(
                    "https://api.groq.com/openai/v1/embeddings",
                    json=payload,
                    headers=headers
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data["data"][0]["embedding"]
                    else:
                        return self._get_dummy_embedding(text)
        except:
            return self._get_dummy_embedding(text)

    @staticmethod
    def _get_dummy_embedding(text: str) -> list:
        """
        Generate simple dummy embedding for demo
        In production, use proper embedding model
        """
        import hashlib
        text = text or ""
        hash_val = int(hashlib.md5(text.encode()).hexdigest(), 16)
        embedding = [(hash_val + i) % 1000 / 1000 for i in range(384)]
        return embedding
