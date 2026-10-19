import json
import logging
from typing import Optional, Dict, Any
import httpx
from app.config import settings

logger = logging.getLogger("ai_service")


class AIService:
    @classmethod
    async def auto_triage(cls, title: str, description: str) -> Dict[str, Any]:
        """
        Uses Gemini to analyze an operational request, recommending priority,
        category, and triage explanation. Falls back cleanly to heuristics if needed.
        """
        if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY.startswith("your_"):
            return cls._heuristic_triage(title, description)

        prompt = f"""
        You are an operational triage assistant for an enterprise operations system.
        Analyze the following operational request:
        Title: {title}
        Description: {description}

        Respond ONLY with a JSON object in this format:
        {{
            "suggested_priority": "P0_CRITICAL" | "P1_HIGH" | "P2_MEDIUM" | "P3_LOW",
            "suggested_category": "INCIDENT" | "PAYMENT_REVIEW" | "COMPLIANCE" | "CUSTOMER_ISSUE" | "OPERATIONAL_TASK",
            "reasoning": "A 1-2 sentence explanation of why this was chosen",
            "risk_factors": ["risk 1", "risk 2"]
        }}
        """

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}"

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    url,
                    json={
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": {"temperature": 0.2, "response_mime_type": "application/json"}
                    }
                )
                if response.status_code == 200:
                    data = response.json()
                    raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
                    return json.loads(raw_text)
                else:
                    logger.warning(f"Gemini API returned status {response.status_code}, falling back to heuristics.")
                    return cls._heuristic_triage(title, description)
        except Exception as e:
            logger.error(f"Error calling Gemini API: {e}. Using heuristic triage fallback.")
            return cls._heuristic_triage(title, description)

    @staticmethod
    def _heuristic_triage(title: str, description: str) -> Dict[str, Any]:
        """
        Deterministic, offline rule-based triage fallback.
        """
        combined = f"{title} {description}".lower()
        if any(w in combined for w in ["outage", "down", "emergency", "breach", "p0", "data loss", "production"]):
            return {
                "suggested_priority": "P0_CRITICAL",
                "suggested_category": "INCIDENT",
                "reasoning": "Detected critical outage or production stability keywords.",
                "risk_factors": ["High customer impact", "Service interruption"]
            }
        elif any(w in combined for w in ["payment", "refund", "fraud", "chargeback", "transaction"]):
            return {
                "suggested_priority": "P1_HIGH",
                "suggested_category": "PAYMENT_REVIEW",
                "reasoning": "Detected financial or payment-related investigation keywords.",
                "risk_factors": ["Financial risk", "Customer dispute"]
            }
        elif any(w in combined for w in ["compliance", "gdpr", "audit", "legal", "regulatory"]):
            return {
                "suggested_priority": "P1_HIGH",
                "suggested_category": "COMPLIANCE",
                "reasoning": "Detected legal or compliance audit keywords.",
                "risk_factors": ["Regulatory adherence", "Audit tracking"]
            }
        elif any(w in combined for w in ["customer", "client", "ticket", "user complaint"]):
            return {
                "suggested_priority": "P2_MEDIUM",
                "suggested_category": "CUSTOMER_ISSUE",
                "reasoning": "Identified customer escalation request.",
                "risk_factors": ["User experience"]
            }
        return {
            "suggested_priority": "P2_MEDIUM",
            "suggested_category": "OPERATIONAL_TASK",
            "reasoning": "Standard operational request classified by default heuristic.",
            "risk_factors": ["Standard operational workflow"]
        }
