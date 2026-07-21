"""FRIDAY's conversational brain.

Takes a user's transcribed utterance and asks Gemini for a reply, in the
F.R.I.D.A.Y. persona. Returns both a spoken reply and an optional structured
action so the frontend can still open panels / lock / etc. for known intents.

Requires GEMINI_API_KEY in backend/.env (same key used by stt.py).
"""
import os
import json
import re

from google import genai
from google.genai import types

MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

# Actions the frontend already knows how to perform. Gemini is told to pick one
# of these when the user's intent matches; otherwise action is "none" and we
# just speak the reply.
KNOWN_ACTIONS = ["dashboard", "trading", "engineering", "vscode", "browser", "lock", "none"]

_SYSTEM_PROMPT = (
    "You are F.R.I.D.A.Y., Tony Stark's witty, loyal, highly capable AI assistant. "
    "You address the user as 'Boss'. Keep spoken replies concise (1-2 sentences), "
    "confident, and lightly witty — never robotic. "
    "You can perform these actions when the user asks: "
    "dashboard (show dashboard/status), trading (open trading systems), "
    "engineering (open engineering console), vscode (open VS Code/editor), "
    "browser (open a web browser), lock (secure/lock the system). "
    "For anything else — questions, chit-chat, general requests — just answer "
    "conversationally with action 'none'. "
    "ALWAYS respond with a single JSON object and nothing else, in the form: "
    '{"reply": "<what you say out loud>", "action": "<one of: '
    + ", ".join(KNOWN_ACTIONS)
    + '>"}'
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


def _extract_json(text: str) -> dict:
    """Pull the first JSON object out of the model's text, tolerating fences."""
    if not text:
        return {}
    # Strip ```json ... ``` fences if present.
    fenced = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    candidate = fenced.group(1) if fenced else None
    if candidate is None:
        brace = re.search(r"\{.*\}", text, re.DOTALL)
        candidate = brace.group(0) if brace else None
    if not candidate:
        return {}
    try:
        return json.loads(candidate)
    except json.JSONDecodeError:
        return {}


def respond(transcript: str) -> dict:
    """Return {'reply': str, 'action': str} for a user utterance."""
    text = (transcript or "").strip()
    if not text:
        return {"reply": "", "action": "none"}

    client = _get_client()
    response = client.models.generate_content(
        model=MODEL,
        contents=[_SYSTEM_PROMPT, f"User said: {text}"],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.7,
        ),
    )
    raw = (getattr(response, "text", "") or "").strip()
    data = _extract_json(raw)

    reply = str(data.get("reply") or "").strip()
    action = str(data.get("action") or "none").strip().lower()
    if action not in KNOWN_ACTIONS:
        action = "none"
    if not reply:
        # Fallback: speak whatever the model produced, or a safe default.
        reply = raw or "I'm not sure how to help with that, Boss."
    return {"reply": reply, "action": action}


async def chat_with_audio(data: bytes, mime_type: str) -> dict:
    """One-shot: transcribe audio with Gemini, then generate FRIDAY reply."""
    if not data:
        return {"reply": "", "action": "none", "transcript": ""}

    client = _get_client()
    # Multimodal prompt: give the model the audio and ask for both transcript
    # and response in one call. Gemini will handle STT+LLM internally.
    response = client.models.generate_content(
        model=MODEL,
        contents=[
            types.Part.from_bytes(data=data, mime_type=mime_type),
            _SYSTEM_PROMPT,
            "User is speaking to F.R.I.D.A.Y. Please transcribe their words, then "
            "generate a concise witty response in the FRIDAY personality, and return ONLY JSON: "
            '{"reply": "...", "action": "...", "transcript": "..."}',
        ],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.5,
        ),
    )
    raw = (getattr(response, "text", "") or "").strip()
    data = _extract_json(raw)

    reply = str(data.get("reply") or "").strip()
    action = str(data.get("action") or "none").strip().lower()
    transcript = str(data.get("transcript") or "").strip()
    if action not in KNOWN_ACTIONS:
        action = "none"
    if not reply:
        reply = "I didn't catch that, Boss."
    return {"reply": reply, "action": action, "transcript": transcript}
