import re
from datetime import date, timedelta
from typing import Any

DATE_KEYWORDS = {
    "today": 0,
    "tomorrow": 1,
    "next week": 7,
    "this week": 0,
    "next friday": None,
}

PRIORITY_MAP = {
    "high": "high",
    "urgent": "high",
    "medium": "medium",
    "normal": "medium",
    "low": "low",
    "minor": "low",
}


def extract_priority(text: str) -> str | None:
    lowered = text.lower()
    for key, value in PRIORITY_MAP.items():
        if key in lowered:
            return value
    return None


def extract_date(text: str) -> str | None:
    lowered = text.lower()
    if "tomorrow" in lowered:
        return (date.today() + timedelta(days=1)).isoformat()
    if "today" in lowered:
        return date.today().isoformat()
    if "next friday" in lowered:
        delta = (4 - date.today().weekday() + 7) % 7
        delta = 7 if delta == 0 else delta
        return (date.today() + timedelta(days=delta)).isoformat()
    match = re.search(r"(\d{4}-\d{2}-\d{2})", text)
    if match:
        return match.group(1)
    return None


def clean_intent(text: str) -> str:
    return re.sub(r"[^a-z0-9 ]", "", text.lower()).strip()
