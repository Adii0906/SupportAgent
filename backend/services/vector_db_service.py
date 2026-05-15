import os
from typing import List


class VectorDBService:
    """
    Vector database service for semantic search
    Uses embeddings for KB retrieval
    """

    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        self.embedding_cache = {}

    async def embed(self, text: str) -> List[float]:
        """
        Get embeddings for text
        Uses Groq's embedding model or simple hash-based fallback
        """
        if text in self.embedding_cache:
            return self.embedding_cache[text]

        try:
            import aiohttp
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
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        embedding = data["data"][0]["embedding"]
                        self.embedding_cache[text] = embedding
                        return embedding
        except:
            pass

        embedding = self._get_simple_embedding(text)
        self.embedding_cache[text] = embedding
        return embedding

    @staticmethod
    def _get_simple_embedding(text: str) -> List[float]:
        """
        Simple embedding fallback using character hashing
        For production, use proper embedding model
        """
        import hashlib
        text = text or ""
        hash_val = int(hashlib.md5(text.encode()).hexdigest(), 16)
        seed = hash_val % 1000
        embedding = [(seed + i * 17) % 1000 / 1000.0 for i in range(384)]
        return embedding

    async def search(
        self,
        query: str,
        documents: List[str],
        top_k: int = 3
    ) -> List[int]:
        """
        Search for top-k most similar documents to query
        Returns indices of most similar documents
        """
        query_embedding = await self.embed(query)
        
        results = []
        for idx, doc in enumerate(documents):
            doc_embedding = await self.embed(doc)
            similarity = self._cosine_similarity(query_embedding, doc_embedding)
            results.append((idx, similarity))

        results.sort(key=lambda x: x[1], reverse=True)
        return [idx for idx, _ in results[:top_k]]

    @staticmethod
    def _cosine_similarity(a: List[float], b: List[float]) -> float:
        """
        Calculate cosine similarity between two vectors
        """
        if not a or not b or len(a) != len(b):
            return 0.0

        dot_product = sum(x * y for x, y in zip(a, b))
        magnitude_a = sum(x ** 2 for x in a) ** 0.5
        magnitude_b = sum(x ** 2 for x in b) ** 0.5

        if magnitude_a == 0 or magnitude_b == 0:
            return 0.0

        return dot_product / (magnitude_a * magnitude_b)
