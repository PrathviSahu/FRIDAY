"""FRIDAY's Adaptive Learning & Conversational Brain.

Takes a user's transcribed utterance and asks Gemini for a reply, in the
F.R.I.D.A.Y. persona. Injects persistent memory facts and multi-turn context.
"""
import os
import json
import re
import time

from google import genai
from google.genai import types
from services.voice_auth import is_guest_permitted, set_guest_permission
from services.memory import (
    save_fact,
    get_all_memories,
    get_memory_context_string,
    log_conversation,
    get_recent_conversation
)

KNOWN_ACTIONS = [
    "dashboard", "trading", "engineering", "vscode", "browser",
    "lock", "allow_guest", "revoke_guest", "remember", "none"
]

_BOSS_BASE_PROMPT = (
    "You are F.R.I.D.A.Y., Tony Stark's witty, loyal, adaptive AI assistant. "
    "You address the user as 'Boss'. Keep spoken replies concise (1-2 sentences), "
    "confident, natural, and lightly witty — never robotic. "
    "You are a LEARNING AI: when the user tells you to remember something (e.g. 'remember that my favorite stock is NVDA' "
    "or 'remember I like dark mode'), extract the memory key and value and return action 'remember', "
    "with a 'remember_key' and 'remember_value' field in your JSON. "
    "Available actions: "
    "dashboard (show dashboard/status), trading (open trading systems), "
    "engineering (open engineering console), vscode (open VS Code/editor), "
    "browser (open a web browser), lock (secure/lock the system), "
    "allow_guest (grant guest access), revoke_guest (revoke guest access), "
    "remember (save a fact to permanent memory), none (general response). "
    "ALWAYS respond with ONLY a single JSON object in the form: "
    '{"reply": "<spoken output>", "action": "<action>", "remember_key": "<optional>", "remember_value": "<optional>"}'
)

_GUEST_SYSTEM_PROMPT = (
    "You are F.R.I.D.A.Y., Tony Stark's AI assistant. A guest (not your Boss) is talking to you, "
    "and access permission has NOT been granted by your Boss yet. "
    "Be hilariously sarcastic, polite yet firm, and inform them that only your Boss can give them system permission. "
    "REFUSE any system commands or memory updates — set action to 'none'. "
    "Keep replies concise (1-2 sentences) and witty. "
    "ALWAYS respond with a single JSON object: "
    '{"reply": "<sarcastic response to guest>", "action": "none"}'
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
    if not text:
        return {}
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


def respond(transcript: str, is_boss: bool = True) -> dict:
    """Return {'reply': str, 'action': str} for a user utterance using live Gemini LLM + Memory."""
    text = (transcript or "").strip()
    if not text:
        return {"reply": "", "action": "none"}

    lower_text = text.lower()

    # Log user turn to memory history
    log_conversation(role="user" if is_boss else "guest", message=text)

    # Check for permission commands from Boss
    if "allow guest" in lower_text or "grant guest" in lower_text or "let them speak" in lower_text or "give permission" in lower_text:
        set_guest_permission(True)
        reply_msg = "Guest access granted, Boss. I'll answer their queries now."
        log_conversation(role="assistant", message=reply_msg)
        return {"reply": reply_msg, "action": "allow_guest"}

    if "revoke guest" in lower_text or "stop guest" in lower_text or "lock guest" in lower_text:
        set_guest_permission(False)
        reply_msg = "Guest access revoked, Boss. Back to Boss-only mode."
        log_conversation(role="assistant", message=reply_msg)
        return {"reply": reply_msg, "action": "revoke_guest"}

    # Build dynamic prompt with stored memory context
    guest_active = is_guest_permitted()
    if is_boss or guest_active:
        memory_str = get_memory_context_string()
        recent_history = get_recent_conversation(limit=4)
        history_str = "\n".join([f"{h['role'].upper()}: {h['message']}" for h in recent_history])
        
        full_system_prompt = (
            f"{_BOSS_BASE_PROMPT}\n\n"
            f"[PERMANENT MEMORY & USER PREFERENCES]\n{memory_str}\n\n"
            f"[RECENT CONVERSATION HISTORY]\n{history_str}"
        )
    else:
        full_system_prompt = _GUEST_SYSTEM_PROMPT

    client = _get_client()

    models_to_try = [
        os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
        "gemini-2.0-flash",
        "gemini-2.0-flash-lite-001",
        "gemini-flash-latest"
    ]

    last_error = None
    for model_name in models_to_try:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=[full_system_prompt, f"User said: {text}"],
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

            # Check if LLM extracted a new memory fact to store
            rem_key = data.get("remember_key")
            rem_val = data.get("remember_value")
            if (action == "remember" or rem_key) and rem_key and rem_val:
                save_fact(key=str(rem_key), value=str(rem_val))
                print(f"[Memory] Saved fact: {rem_key} -> {rem_val}")

            # Also support direct explicit 'remember' phrase handling
            if "remember that" in lower_text or "remember my" in lower_text:
                parts = text.lower().replace("remember that", "").replace("remember my", "").replace("remember", "").strip()
                if parts:
                    save_fact(key=parts, value=parts)
                    print(f"[Memory] Saved direct fact: {parts}")

            if reply:
                log_conversation(role="assistant", message=reply)
                return {"reply": reply, "action": action}
        except Exception as err:
            last_error = err
            print(f"[Brain] Model {model_name} failed ({err}), trying next model...")
            time.sleep(0.3)

    print(f"[Error] All Gemini models failed: {last_error}")
    fallback_reply = "I apologize, Boss. Neural cloud connections are rate-limited right now. Please try again in a moment."
    log_conversation(role="assistant", message=fallback_reply)
    return {
        "reply": fallback_reply,
        "action": "none"
    }
