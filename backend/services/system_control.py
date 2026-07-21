"""FRIDAY System Automation Controller (macOS / PC).

Executes system-level commands requested by Boss:
- Spotify Media Automation (Play/Pause, Next/Previous, Play specific track/playlist)
- Open Applications (Spotify, Brave, VS Code, Terminal, Finder, etc.)
- Control Web & Browser (YouTube, Google, GitHub, URL navigation in Brave)
"""
import os
import subprocess
import urllib.parse
import platform

IS_MAC = platform.system() == "Darwin"


def open_app(app_name: str) -> bool:
    """Launch an application on macOS."""
    clean_name = app_name.strip()
    if IS_MAC:
        try:
            subprocess.Popen(["open", "-a", clean_name])
            return True
        except Exception as err:
            print(f"[Automation] Failed to open app {clean_name}: {err}")
            return False
    return False


def control_spotify(command: str, query: str = "") -> bool:
    """Control Spotify playback via macOS AppleScript."""
    if not IS_MAC:
        return False
    
    cmd = command.lower().strip()
    try:
        # Ensure Spotify is running first
        open_app("Spotify")

        if cmd == "play":
            script = 'tell application "Spotify" to play'
        elif cmd == "pause" or cmd == "stop":
            script = 'tell application "Spotify" to pause'
        elif cmd == "next":
            script = 'tell application "Spotify" to next track'
        elif cmd == "previous":
            script = 'tell application "Spotify" to previous track'
        elif cmd == "play_query" and query:
            # Search and play track/playlist via Spotify URI scheme
            q_encoded = urllib.parse.quote(query.strip())
            subprocess.Popen(["open", f"spotify:search:{q_encoded}"])
            # Auto-trigger play after search opens
            script = 'delay 1.5\ntell application "System Events" to key code 36' # Press Enter
        else:
            script = 'tell application "Spotify" to play'

        subprocess.Popen(["osascript", "-e", script])
        return True
    except Exception as err:
        print(f"[Automation] Spotify control error: {err}")
        return False


def open_url_in_brave(url: str) -> bool:
    """Open a URL in Brave browser (or default browser)."""
    target_url = url if url.startswith("http") else f"https://{url}"
    if IS_MAC:
        try:
            subprocess.Popen(["open", "-a", "Brave Browser", target_url])
            return True
        except Exception:
            subprocess.Popen(["open", target_url])
            return True
    return False


def open_youtube_search(query: str = "") -> bool:
    """Open YouTube or search YouTube in Brave."""
    if not query or query.lower().strip() in ["youtube", "open youtube"]:
        url = "https://www.youtube.com"
    else:
        q_encoded = urllib.parse.quote(query.strip())
        url = f"https://www.youtube.com/results?search_query={q_encoded}"
    return open_url_in_brave(url)


def open_google_search(query: str) -> bool:
    """Search Google in Brave."""
    q_encoded = urllib.parse.quote(query.strip())
    url = f"https://www.google.com/search?q={q_encoded}"
    return open_url_in_brave(url)


def execute_system_command(action_type: str, target: str = "") -> str:
    """Router for executing OS automation requests."""
    action = action_type.lower().strip()
    target_clean = target.strip()

    print(f"[Automation] Executing action='{action}' target='{target_clean}'")

    if action == "open_spotify":
        open_app("Spotify")
        return "Opening Spotify now, Boss."

    elif action == "play_music" or action == "play_spotify":
        control_spotify("play", target_clean)
        return f"Playing '{target_clean}' on Spotify, Boss." if target_clean else "Playing your Spotify music now, Boss."

    elif action == "pause_music" or action == "pause_spotify":
        control_spotify("pause")
        return "Pausing Spotify music, Boss."

    elif action == "next_track":
        control_spotify("next")
        return "Skipping to the next track, Boss."

    elif action == "previous_track":
        control_spotify("previous")
        return "Playing previous track, Boss."

    elif action == "open_brave":
        if target_clean:
            open_url_in_brave(target_clean)
            return f"Opening {target_clean} in Brave, Boss."
        open_app("Brave Browser")
        return "Opening Brave browser, Boss."

    elif action == "open_youtube":
        open_youtube_search(target_clean)
        return f"Opening YouTube search for '{target_clean}', Boss." if target_clean else "Opening YouTube in Brave, Boss."

    elif action == "open_app":
        open_app(target_clean)
        return f"Opening {target_clean}, Boss."

    elif action == "search_web":
        open_google_search(target_clean)
        return f"Searching '{target_clean}' in Brave, Boss."

    return ""
