"""Speech-to-text via Google Gemini.

Replaces the browser's Web Speech API (which is Chrome-only and fails inside
the Tauri webview). The frontend captures mic audio with MediaRecorder and
POSTs each chunk here; Gemini transcribes it and we return the text. The
frontend then runs its own command matcher on the transcript.

Requires GEMINI_API_KEY in backend/.env.
"""
import os

from google import genai
from google.genai import types

MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

_PROMPT = (
    "You are a speech-to-text transcription service for the FRIDAY assistant. "
    "Transcribe the user's spoken audio into text exactly as heard. "
    "Output only the transcribed words, with no commentary, no quotation marks, "
    "and no added punctuation beyond natural speech."
)

_client = None


def _get_client():
    global _client
    if _client is None:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key or api_key == "your_key_here":
            raise RuntimeError("GEMINI_API_KEY is not set in backend/.env")
        _client = genai.Client(api_key=api_key)
    return _client


def transcribe_audio(data: bytes, mime_type: str) -> str:
    """Transcribe raw audio bytes. Returns the recognized text (may be empty)."""
    if not data:
        return ""
    client = _get_client()
    response = client.models.generate_content(
        model=MODEL,
        contents=[
            types.Part.from_bytes(data=data, mime_type=mime_type),
            _PROMPT,
        ],
    )
    return (getattr(response, "text", "") or "").strip()
