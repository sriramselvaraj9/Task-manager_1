from __future__ import annotations
import json
from typing import Any

from fastapi import HTTPException, status

from ..config import settings
from ..ai.prompt import SYSTEM_PROMPT, INTENT_GUIDANCE, TASK_FIELD_HELPER


class AIService:
    def __init__(self):
        if not settings.AI_API_KEY:
            raise RuntimeError("AI API key is not configured")

        self.api_key = settings.AI_API_KEY.strip()
        self.use_groq = self.api_key.startswith("gsk_")

        if self.use_groq:
            from groq import AsyncGroq
            self.client = AsyncGroq(api_key=self.api_key)
            self.model = "llama-3.3-70b-versatile"
        else:
            from openai import OpenAI
            self.client = OpenAI(api_key=self.api_key)
            self.model = "gpt-4o-mini"

    def _extract_json(self, text: str) -> str:
        start = text.find("{")
        end = text.rfind("}")
        if start == -1 or end == -1:
            return text
        return text[start:end + 1]

    async def prompt_for_intent(self, user_text: str) -> dict[str, Any]:
        prompt = (
            SYSTEM_PROMPT
            + "\n\n"
            + INTENT_GUIDANCE
            + "\n\n"
            + TASK_FIELD_HELPER
            + "\n\n"
            + "User input: "
            + user_text
            + "\n\n"
            + "Respond with a single JSON object with keys: intent, message, function_name, function_arguments. "
            + "Use function_name=null for general chat responses. "
        )

        try:
            if self.use_groq:
                response = await self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": prompt},
                        {"role": "user", "content": user_text},
                    ],
                    max_tokens=450,
                    temperature=0.2,
                )
            else:
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": prompt},
                        {"role": "user", "content": user_text},
                    ],
                    max_tokens=450,
                    temperature=0.2,
                )

            text = response.choices[0].message.content.strip()
            payload_text = self._extract_json(text)
            return json.loads(payload_text)
        except json.JSONDecodeError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"AI response was not valid JSON: {exc}"
            ) from exc
        except Exception as exc:
            if "invalid_api_key" in str(exc).lower() or "incorrect api key" in str(exc).lower():
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=(
                        "AI service error: invalid API key. "
                        "Set OPENAI_API_KEY for OpenAI or GROQ_API_KEY for Groq. "
                        "Do not reuse the wrong key format for the selected provider."
                    )
                ) from exc
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"AI service error: {exc}"
            ) from exc

    def format_response(self, payload: dict[str, Any]) -> dict[str, Any]:
        return {
            "ai_message": payload.get("message", "I could not understand that.") or "I could not understand that.",
            "intent": payload.get("intent"),
            "function_name": payload.get("function_name"),
            "function_arguments": payload.get("function_arguments", {}),
        }
