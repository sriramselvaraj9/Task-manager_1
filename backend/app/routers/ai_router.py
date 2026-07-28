from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
# pyrefly: ignore [missing-import]
from groq import AsyncGroq, GroqError

from ..auth import get_current_user
from ..models import User
from ..config import settings
from ..limiter import limiter

router = APIRouter(prefix="/ai", tags=["AI"])


# ── Schemas ────────────────────────────────────────────────────────────────────

class ImproveTextRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000)
    field: str = Field(..., pattern="^(title|description)$")


class ImproveTextResponse(BaseModel):
    improved_text: str


# ── Prompts ────────────────────────────────────────────────────────────────────

SYSTEM_PROMPT = (
    "You are a professional English writing assistant for a task management application. "
    "Your job is to improve the text provided by the user by:\n"
    "- Correcting spelling mistakes\n"
    "- Correcting grammar\n"
    "- Improving punctuation\n"
    "- Making the text clear, professional, and concise\n"
    "- Keeping the original meaning intact\n"
    "- Not adding unnecessary information or padding\n"
    "Return ONLY the improved text. Do not include explanations, quotes, or any other content."
)

FIELD_HINTS = {
    "title": (
        "This is a task title — it should be short, imperative, and action-oriented. "
        "Capitalise the first word. Do not end with a period unless it is a sentence. "
        "Keep it under 15 words."
    ),
    "description": (
        "This is a task description — it should be a clear, professional sentence or short paragraph. "
        "Use proper punctuation and capitalisation."
    ),
}


# ── Endpoint ─-──────────────────────────────────────────────────────────────────
@router.post(
    "/improve-text",
    response_model=ImproveTextResponse,
    status_code=status.HTTP_200_OK,
    summary="Improve task text with AI",
)
@limiter.limit(settings.RATE_LIMIT_AI) 
async def improve_text(
    request: Request,
    body: ImproveTextRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Accepts a text string and a field type ('title' or 'description').
    Returns an AI-improved version using Groq (Llama 3).
    """
    if not settings.GROQ_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service is not configured. Please set GROQ_API_KEY.",
        )

    client = AsyncGroq(api_key=settings.GROQ_API_KEY)

    user_prompt = (
        f"{FIELD_HINTS[body.field]}\n\n"
        f"Improve this text:\n{body.text.strip()}"
    )

    try:
        completion = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=500,
            temperature=0.3,
        )

        improved = completion.choices[0].message.content.strip()

        if not improved:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="AI returned an empty response.",
            )

        return ImproveTextResponse(improved_text=improved)

    except GroqError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI service error: {str(exc)}",
        ) from exc


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)


class ChatResponse(BaseModel):
    ai_message: str
    intent: str | None = None
    function_name: str | None = None
    result: dict | None = None


@router.post(
    "/chat",
    response_model=ChatResponse,
    status_code=status.HTTP_200_OK,
    summary="Process AI chat and voice commands",
)
@limiter.limit(settings.RATE_LIMIT_AI)
async def ai_chat(
    request: Request,
    body: ChatRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Handles natural language chat and voice commands for task management.
    """
    raw_message = body.message.strip()

    return ChatResponse(
        ai_message=f"Received command: '{raw_message}'",
        intent="GENERAL",
        function_name=None,
        result=None
    )
