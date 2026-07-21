# Friday Project Architecture Overview

**Document purpose**  
This file describes the high-level architecture of the *Friday* desktop assistant project, covering its major components, data flows, technology choices, persistent services, and active Spotify/System automation integrations.

---

## 1. Project Vision
Friday is a personal AI assistant built for **Prem** (Prathvi Sahu) that:
- Listens continuously for voice wake-words (e.g., "Friday", "Hey Friday", "Suno Friday") and WebAuthn fingerprint authentication.
- Executes system automation on macOS (app control, smart volume routing, background Spotify track/playlist control, YouTube & web search).
- Features a **Floating Draggable Widget Ecosystem**:
  - 🎵 **Spotify Floating Card**: Spotify dark-glass UI, real album poster art via AppleScript, shuffle/repeat/play controls, clickable progress scrubber bar, and instantaneous song search line.
  - 📋 **Todo Card**: Persistent task manager with priority tags (High/Normal/Low), status filter tabs, inline double-click editing, and progress tracking.
  - ⚡ **System Monitor HUD**: Real-time macOS CPU %, RAM GB/%, SSD Disk %, and Battery/Power status telemetry via `psutil`.
- Uses a dual-engine hybrid AI (Groq Llama 3.3 70B primary for ~150ms responses + Gemini 2.5 failover).
- Features **Smarter Context & Proactive Suggestion Engine**:
  - Injects live track state, pending todos, time-of-day context (morning/afternoon/night), and persistent song memory into LLM prompts.
  - Periodically (every 30 mins) evaluates time & context to announce proactive voice suggestions with a sleek glass toast UI notification.

---

## 2. High-Level Diagram  

```
+---------------------+          HTTP / JSON          +-------------------------+
|  React 18 Frontend  | <---------------------------> |  FastAPI Python Backend |
|  (friday-ui)        |  POST /api/chat/text          |  (backend/app.py :8000) |
|  - useSpeech Hook   |  GET  /api/spotify/current-tr |                         |
|  - Draggable Widgets|  GET/POST/DELETE /api/todos   +-------------------------+
|    * SpotifyCard    |  GET  /api/system/stats              /     |     \
|    * TodoCard       |  GET  /api/proactive                /      |      \
|    * SystemHUD      |                                    v       v       v
+---------------------+                       [ Fast-Path ]  [ Services ] [ Dual-Engine LLM ]
                                              Shortcuts      - todos.py   - Groq 70B (150ms)
                                                  |          - stats.py   - Gemini 2.5
                                                  v          - memory.py
                                          [ system_control.py ]
                                            (macOS AppleScript)
                                            /                 \
                                  [ Spotify App ]        [ macOS System ]
                                  - Direct URIs          - Output Volume
                                  - Background Control   - App Management
                                  - Album Artwork URL    - Telemetry (psutil)
```

---

## 3. Technology Stack  

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **UI** | React 18 + Vite + Tailwind CSS + Framer Motion | Fast dev experience, modular UI, draggable interactive HUD widgets. |
| **Voice STT** | Web Speech API (`en-US`) | Browser-native STT with exponential backoff on `no-speech` errors. |
| **Hooks** | `useSpeech.js`, `useProactiveSuggestions.js`, `useOrbState.jsx` | Encapsulates speech lifecycle, proactive scheduling, mic mute state, and TTS echo guards. |
| **Backend API** | Python 3.11 + FastAPI + Uvicorn | High-performance asynchronous API server running at `http://localhost:8000`. |
| **Primary LLM** | Groq (`llama-3.3-70b-versatile`) | Ultra-fast (~150ms) intent extraction and natural conversational replies. |
| **Failover LLM** | Google Gemini 2.5 | Heavy reasoning and fallback handling if primary LLM fails. |
| **TTS Engine** | Edge-TTS (Microsoft Neural Voices) | Natural British female voice output with Web Speech API browser fallback. |
| **OS Automation** | Python `subprocess` + macOS AppleScript (`osascript`) | Native macOS control over Spotify, apps, browser URLs, and system volume. |
| **System Telemetry** | `psutil` | Live macOS CPU %, RAM %, Disk %, and Battery metrics. |
| **Persistence** | JSON File Storage (`data/todos.json`, `data/memory.json`) | Persistent lightweight data storage surviving server restarts. |
| **Security** | WebAuthn Platform Authenticator | Biometric fingerprint gate for LockScreen unlock. |

---

## 4. Directory Structure  

```
/FRIDAY
├── friday-ui/                         # React Frontend (Vite)
│   ├── src/
│   │   ├── api/                      # fetchChatText.ts API client
│   │   ├── components/               # LockScreen, Panels (SpotifyCard, TodoCard, SystemMonitorCard), Debug
│   │   ├── context/                  # FridayContext, FridaySync
│   │   ├── hooks/                    # useSpeech.js, useProactiveSuggestions.js, useOrbState.jsx, voiceCommands.js
│   │   └── services/                 # ttsService.js
│   └── package.json
│
├── backend/                           # Python FastAPI Backend
│   ├── app.py                        # Main FastAPI server (:8000)
│   ├── data/                         # Persistent JSON storage (todos.json, memory.json)
│   ├── services/
│   │   ├── brain.py                  # Groq/Gemini LLM engine + Fast-path shortcuts + Proactive engine
│   │   ├── system_control.py         # macOS AppleScript system & Spotify automation + Artwork URL
│   │   ├── todos.py                  # Persistent Todo CRUD service
│   │   ├── system_stats.py           # psutil telemetry service (CPU, RAM, Disk, Battery)
│   │   ├── memory.py                 # Permanent memory & preference storage
│   │   └── voice_auth.py             # Boss / Guest permission gating
│   └── requirements.txt
│
└── architecture.md                    # <--- Updated Architecture Specification
```

---

## 5. Active API Endpoints  

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat/text` | Main voice/text AI brain endpoint (supports `silence_tts` & voice-to-todo) |
| GET | `/api/spotify/current-track` | Active track details (title, artist, album, state, artwork_url) |
| GET | `/api/todos` | Fetch all stored todo items |
| POST | `/api/todos` | Create a new todo item |
| PATCH | `/api/todos/{id}/toggle` | Toggle todo completion state |
| PATCH | `/api/todos/{id}/text` | Edit todo text |
| DELETE | `/api/todos/{id}` | Delete a single todo |
| DELETE | `/api/todos/done` | Clear all completed todos |
| GET | `/api/system/stats` | Fetch real-time CPU %, RAM %, Disk %, and Battery stats |
| GET | `/api/proactive` | Returns time-aware proactive announcement |
| POST | `/api/tts` | Edge-TTS neural speech audio generator |

---

## 6. Security & Identity

- **Owner / Boss**: **Prem** (addressed as Prem across all replies and UI status).
- **Boss Gating**: System commands (app launch, volume, media control, todo creation) are restricted to Prem.
- **Guest Access**: Guests can speak only when Prem explicitly says `"allow guest"`. Refused via `"revoke guest"`.

---
*Updated:* July 2026  
*Lead Architect:* Prem (Prathvi Sahu) & F.R.I.D.A.Y.