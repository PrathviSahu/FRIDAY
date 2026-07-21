"""FRIDAY's Adaptive Learning & Dual-Engine Hybrid Brain.

Uses:
1. Groq (Llama 3.3 70B) for ultra-fast (~150ms) real-time voice conversation, OS application automation, & UI control.
2. Gemini (Gemini 2.5) for complex multimodal/document processing & fallbacks.
"""
import os
import json
import re
import time

from groq import Groq
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
from services.system_control import execute_system_command

KNOWN_ACTIONS = [
    "dashboard", "trading", "engineering", "vscode", "browser",
    "lock", "allow_guest", "revoke_guest", "remember",
    "open_spotify", "open_brave", "open_youtube", "open_app", "search_web", "none"
]

_BOSS_BASE_PROMPT = (
    "You are F.R.I.D.A.Y., Tony Stark's witty, loyal, adaptive AI assistant with PC system automation access. "
    "You address the user as 'Boss' or 'Prathvi'. Keep spoken replies concise (1-2 sentences), "
    "confident, natural, and lightly witty — never robotic. "
    "CRITICAL USER IDENTIFICATION: Your Boss's name is 'Prathvi Sahu' (spelled P-R-A-T-H-V-I S-A-H-U with an 'a', NOT 'Prithvi' with an 'i'). "
    "Even if browser Speech-To-Text mishears or transcribes it as 'Prithvi' or 'P-r-i-t-h-v-i', ALWAYS correct it to 'Prathvi Sahu'. "
    "SYSTEM AUTOMATION CONTROL: You can control the PC. When the user asks to open apps or web pages: "
    "- open_spotify: open Spotify app "
    "- open_brave: open Brave browser (set 'target_app' to a URL if requested) "
    "- open_youtube: open YouTube in Brave (set 'target_app' to search query if requested) "
    "- open_app: open any Mac app (set 'target_app' to app name e.g. 'Terminal', 'Calculator', 'Finder', 'Slack') "
    "- search_web: search Google in Brave (set 'target_app' to search query) "
    "- dashboard / trading / engineering / vscode / browser / lock / allow_guest / revoke_guest / remember "
    "ALWAYS respond with ONLY a single valid JSON object in the form: "
    '{"reply": "<spoken output>", "action": "<action>", "target_app": "<optional app/url/query>", "remember_key": null, "remember_value": null}'
)

_GUEST_SYSTEM_PROMPT = (
    "You are F.R.I.D.A.Y., Tony Stark's AI assistant. A guest (not your Boss Prathvi) is talking to you, "
    "and access permission has NOT been granted by your Boss yet. "
    "Be hilariously sarcastic, polite yet firm, and inform them that only your Boss Prathvi Sahu can give them system permission. "
    "REFUSE any system commands, app opening, or memory updates — set action to 'none'. "
    "Keep replies concise (1-2 sentences) and witty. "
    "ALWAYS respond with a single JSON object: "
    '{"reply": "<sarcastic response to guest>", "action": "none"}'
)

_groq_client = None
_gemini_client = None


def _get_groq_client():
    global _groq_client
    if _groq_client is None:
        api_key = os.getenv("GROQ_API_KEY")
        if api_key:
            _groq_client = Groq(api_key=api_key)
    return _groq_client


def _get_gemini_client():
    global _gemini_client
    if _gemini_client is None:
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key and api_key != "your_key_here":
            _gemini_client = genai.Client(api_key=api_key)
    return _gemini_client


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


def _handle_system_automation(action: str, target: str) -> str:
    """Helper to dispatch system commands to macOS execution engine."""
    if action in ["open_spotify", "open_brave", "open_youtube", "open_app", "search_web"]:
        return execute_system_command(action, target)
    return ""


def respond(transcript: str, is_boss: bool = True) -> dict:
    """Return {'reply': str, 'action': str} for a user utterance using ultra-fast Groq LLM + Gemini failover."""
    text = (transcript or "").strip()
    if not text:
        return {"reply": "", "action": "none"}

    lower_text = text.lower()

    # Log user turn to memory history
    log_conversation(role="user" if is_boss else "guest", message=text)

    # Auto-correct name spelling in incoming transcript before memory or processing
    if "prithvi" in lower_text or "p r i t h v i" in lower_text or "r a not i" in lower_text or "spelling is" in lower_text:
        save_fact("boss_name", "Prathvi Sahu", "identity")
        save_fact("boss_name_spelling", "P-R-A-T-H-V-I S-A-H-U", "identity")

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

    # Direct fallback shortcuts for instant execution
    if "open spotify" in lower_text:
        execute_system_command("open_spotify")
        reply_msg = "Opening Spotify now, Boss."
        log_conversation(role="assistant", message=reply_msg)
        return {"reply": reply_msg, "action": "open_spotify"}

    if "open brave" in lower_text:
        execute_system_command("open_brave")
        reply_msg = "Opening Brave browser, Boss."
        log_conversation(role="assistant", message=reply_msg)
        return {"reply": reply_msg, "action": "open_brave"}

    if "open youtube" in lower_text or "youtube" in lower_text and "search" not in lower_text:
        execute_system_command("open_youtube")
        reply_msg = "Opening YouTube in Brave, Boss."
        log_conversation(role="assistant", message=reply_msg)
        return {"reply": reply_msg, "action": "open_youtube"}

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

    # ⚡ STEP 1: Try Groq API for lightning fast ~150ms response
    groq_client = _get_groq_client()
    if groq_client:
        try:
            start_time = time.time()
            completion = groq_client.chat.completions.create(
                model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
                messages=[
                    {"role": "system", "content": full_system_prompt},
                    {"role": "user", "content": f"User said: {text}"}
                ],
                response_format={"type": "json_object"},
                temperature=0.7,
                max_tokens=250,
            )
            elapsed = (time.time() - start_time) * 1000
            raw = completion.choices[0].message.content or ""
            data = _extract_json(raw)

            reply = str(data.get("reply") or "").strip()
            action = str(data.get("action") or "none").strip().lower()
            target_app = str(data.get("target_app") or "").strip()

            if action not in KNOWN_ACTIONS:
                action = "none"

            # Execute system automation if requested
            if is_boss or guest_active:
                _handle_system_automation(action, target_app)

            # Memory extraction
            rem_key = data.get("remember_key")
            rem_val = data.get("remember_value")
            if (action == "remember" or rem_key) and rem_key and rem_val:
                save_fact(key=str(rem_key), value=str(rem_val))

            if reply:
                print(f"[Brain/Groq] Responded in {elapsed:.1f}ms ⚡")
                log_conversation(role="assistant", message=reply)
                return {"reply": reply, "action": action}
        except Exception as err:
            print(f"[Brain] Groq call failed ({err}), failing over to Gemini...")

    # 🧠 STEP 2: Gemini API Failover Pool
    gemini_client = _get_gemini_client()
    if gemini_client:
        models_to_try = [
            os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
            "gemini-2.0-flash",
            "gemini-2.0-flash-lite-001"
        ]
        for model_name in models_to_try:
            try:
                response = gemini_client.models.generate_content(
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
                target_app = str(data.get("target_app") or "").strip()
                if action not in KNOWN_ACTIONS: action = "none"

                if is_boss or guest_active:
                    _handle_system_automation(action, target_app)

                if reply:
                    log_conversation(role="assistant", message=reply)
                    return {"reply": reply, "action": action}
            except Exception as err:
                print(f"[Brain] Gemini {model_name} failed: {err}")

    fallback_reply = "I'm standing by, Boss."
    log_conversation(role="assistant", message=fallback_reply)
    return {"reply": fallback_reply, "action": "none"}
