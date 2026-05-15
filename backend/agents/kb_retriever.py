from typing import List, Dict, Any
import json


class KBRetrieverAgent:
    """
    Retrieves relevant knowledge base documents using semantic search
    """

    def __init__(self, vector_db_service):
        self.vector_db = vector_db_service
        self.kb_data = self._load_kb()

    def _load_kb(self) -> List[Dict[str, Any]]:
        """Load knowledge base from JSON"""
        try:
            with open("knowledge_base.json", "r", encoding="utf-8") as f:
                return json.load(f)
        except:
            return self._default_kb()

    def _default_kb(self) -> List[Dict[str, Any]]:
        """Default knowledge base for demo"""
        return [
            {
                "id": "faq_001",
                "category": "billing",
                "question": "How do I check my billing details?",
                "answer": "You can view your billing details by going to Settings > Billing. Here you'll see your current plan, invoices, and payment methods.",
                "keywords": ["billing", "invoice", "payment", "account"]
            },
            {
                "id": "faq_002",
                "category": "shipping",
                "question": "How can I track my order?",
                "answer": "Once your order ships, you'll receive an email with a tracking link. You can also track it in your account under Orders > Active Orders.",
                "keywords": ["shipping", "tracking", "order", "delivery"]
            },
            {
                "id": "faq_003",
                "category": "account",
                "question": "How do I change my password?",
                "answer": "Go to Settings > Security > Change Password. Enter your current password and then your new password twice.",
                "keywords": ["password", "security", "account", "change"]
            },
            {
                "id": "faq_004",
                "category": "refund",
                "question": "What is your refund policy?",
                "answer": "We offer full refunds within 30 days of purchase if the product is unused. For used items, contact our support team for evaluation.",
                "keywords": ["refund", "return", "money back", "policy"]
            },
            {
                "id": "faq_005",
                "category": "technical",
                "question": "Why is my app crashing?",
                "answer": "Try clearing your app cache, restarting your device, or reinstalling the app. If issues persist, contact support with your device model and OS version.",
                "keywords": ["crash", "bug", "error", "app", "technical"]
            }
        ]

    async def retrieve(
        self, query: str, language: str, intent: str, top_k: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Retrieve relevant KB documents using semantic search
        """
        query_embedding = await self.vector_db.embed(query)
        
        results = []
        for doc in self.kb_data:
            doc_embedding = await self.vector_db.embed(doc["answer"])
            similarity = self._cosine_similarity(query_embedding, doc_embedding)
            
            if doc["category"] == intent or similarity > 0.5:
                results.append({
                    **doc,
                    "relevance_score": similarity
                })
        
        results.sort(key=lambda x: x["relevance_score"], reverse=True)
        return results[:top_k]

    def _cosine_similarity(self, a: List[float], b: List[float]) -> float:
        """Calculate cosine similarity between two vectors"""
        if not a or not b:
            return 0.0
        
        dot_product = sum(x * y for x, y in zip(a, b))
        magnitude_a = sum(x ** 2 for x in a) ** 0.5
        magnitude_b = sum(x ** 2 for x in b) ** 0.5
        
        if magnitude_a == 0 or magnitude_b == 0:
            return 0.0
        
        return dot_product / (magnitude_a * magnitude_b)