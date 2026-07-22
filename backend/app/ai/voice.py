from fastapi import APIRouter

router = APIRouter(prefix="/voice", tags=["Voice"])

# Voice-specific backend routes could be added here later if needed.
# Most browser speech recognition and text-to-speech happen in the frontend.
