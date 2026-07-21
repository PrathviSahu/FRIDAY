# Friday Project Architecture Overview

**Document purpose**  
This file describes the high‑level architecture of the *Friday* desktop assistant project, covering its major components, data flows, and technology choices. It is intended for developers, architects, and stakeholders who need a clear mental model of how the system works and where future work should be focused.

---  

## 1. Project Vision
Friday is a personal AI‑assistant for desktop environments that:
- Listens for voice wake‑words (e.g., “Friday”, “wake up”) and fingerprint authentication.
- Executes commands (open apps, send messages, run scripts) after a successful wake‑up.
- Provides a conversational UI for LLM‑driven responses.
- Integrates with system‑level security (fingerprint, lock‑screen state).

---  

## 2. High‑Level Diagram  

```
+-------------------+          +----------------------+          +-------------------+
|  Front‑end (React|  HTTP/WS |  Backend API (Node)  |  RPC/HTTP|  Backend Services |
|  + Vite)          | <----->  |  (Express / Fastify)| <----->  |  (LLM inference, |
|  - UI Components  |          |  - Auth (Fingerprint)|          |   Text‑to‑Text)   |
|  - Voice Hook     |          |  - Voice‑command OK |          |  - Storage, Cache |
|  - Fingerprint UI|          +----------------------+          +-------------------+
+-------------------+                     ^                         |
                                            |                         |
                                            | HTTPS (REST/WS)          |
                                            v                         |
+-------------------+                 +-------------------+        |
|  OS Integration   | <------------ |  Security Layer  | <------+
|  (LockScreen, UI)|                |  (Biometric,    |
|   - LockScreen.jsx|                |   Permission)   |
+-------------------+                +-------------------+
```

---  

## 3. Technology Stack  

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **UI** | React 18 + Vite | Fast dev experience, hot‑module reload, easy bundling for desktop. |
| **Voice** | Web Speech API (SpeechRecognition) | Native browser support, works offline after user gesture. |
| **State / Hooks** | Custom React hooks (`useSpeech`, `useOrbState`) | Encapsulates voice‑recognition lifecycle, authentication state, and command handling. |
| **Backend API** | Node.js + Express (or Fastify) | Lightweight HTTP server, easy to deploy alongside desktop assets. |
| **LLM Integration** | Anthropic Claude / OpenAI‑compatible API | Provides text‑only chat endpoint (`/api/chat/text`). |
| **Security** | WebAuthn / Platform Authenticator API | Handles fingerprint authentication on supported OS. |
| **Desktop Packaging** | Electron / Tauri (currently Vite‑based) | Wraps the React UI into a native window, accesses OS features. |
| **Package Management** | npm / Yarn | Standard JS ecosystem. |
| **Testing / CI** | Jest + Playwright (optional) | Unit & integration tests for core flows. |
| **Build / CI** | GitHub Actions | Lint, test, and package on push. |

---  

## 4. Directory Structure  

```
/FRIDAY
│
├─ /frontend (src)                  # React UI
│   ├─ /components                 # UI components (LockScreen, Buttons)
│   ├─ /hooks                      # Custom hooks (useSpeech, useOrbState)
│   ├─ /services                   # API clients (fetchChatText, fetchAuth)
│   ├─ /pages / routes             # Page routing (if any)
│   └─ index.jsx
│
├─ /backend                         # Node server (optional)
│   ├─ server.js / app.js
│   ├─ routes/
│   │   └─ auth.js
│   ├─ services/
│   │   └─ llm.js                  # Wrapper around /api/chat/text
│   └─ config/
│
├─ /scripts                         # Dev / build scripts
│   └─ start.sh / dev.sh
│
├─ /tests                           # Unit / integration tests
│
├─ .gitignore
├─ package.json
├─ vite.config.js
└─ architecture.md                  # <-- <--- This file
```

---  

## 5. Core Components  

### 5.1 Front‑end – `useSpeech` Hook  
- **Responsibilities:**  
  - Request microphone permission.  
  - Initialise `SpeechRecognition`.  
  - Continuously stream interim results.  
  - Detect the **first** wake‑word from the `WAKE_WORDS` list (including multi‑word phrases like “wake up”).  
  - Execute `handleCmd(cmd)` once a wake‑word is found.  

- **Key logic:**  
  - Phrase matching is case‑insensitive and trims leading punctuation.  
  - Prioritises longer phrases (e.g., “wake up”) before single‑word matches.  

### 5.2 LockScreen UI  
- Renders a fullscreen overlay when the OS is locked.  
- Handles fingerprint authentication via `useOrbState`.  
- Emits `runAuthSequence('wake', {speakImmediately:true})` on successful unlock.  

### 5.3 Backend API (`/api/chat/text`)  
- Receives JSON payload `{ text: string }`.  
- Forwards to the LLM (Claude / OpenAI) and returns `{ reply, action }`.  
- Errors are caught and re‑thrown as human‑readable messages.  

### 5.4 Voice Command Flow  
1. `useSpeech` captures audio → transcribes → extracts command.  
2. `handleCmd` checks for **local** commands via `matchVoiceCommand`.  
3. If none, sends request to backend (`fetchChatText`).  
4. Backend replies → `speak(reply)` (TTS) and updates conversation state.  

---  

## 6. Authentication & Security Flow  

1. **Fingerprint Prompt** – Triggered from the LockScreen component when the UI detects a locked state.  
2. **WebAuthn Call** – Browser asks OS for a biometric verification.  
3. **Successful Auth** – `runAuthSequence('wake', ...)` is dispatched, un‑locks the UI and enables voice listening.  
4. **Failed Auth** – Remains locked; voice listening stays disabled to avoid accidental commands.  

---  

## 7. API Contract (Backend)  

| Method | Endpoint | Request Body | Response |
|--------|----------|--------------|----------|
| POST   | `/api/chat/text` | `{ "text": "wake up" }` | `{ "reply": string, "action": string }` |
| (Optional) GET | `/status` | – | `{ "status":"ok" }` |

---  

## 8. Wake‑Word Detection – Current Issues & Fixes  

- **Symptom:** The voice pipeline sometimes hears “if Friday” or “stilll same error” instead of a clean wake‑word.  
- **Root cause:**  
  - The `WAKE_WORDS` list was incomplete (missing “wake”, “wake up”).  
  - `extractCommand` previously sliced after the *first* matched word without checking for trailing punctuation or longer multi‑word phrases.  
- **Fixes Implemented:**  
  1. Added explicit `"wake"` and `"wake up"` entries to `WAKE_WORDS`.  
  2. Refactored `extractCommand` to iterate over **all** known phrases, prioritising longer matches.  
  3. Trimmed and normalised the extracted command before returning.  

The recent `curl` test confirms that the backend correctly processes a raw wake‑up request:

```
{"reply":"I'm wide awake, Boss. Systems are green and waiting on your command.","action":"none"}
```

---  

## 9. Security Considerations  

- **Permission Model:** Microphone access requires a user gesture (click “Start Listening”). This prevents background eavesdropping.  
- **Biometric Data:** The project never stores raw fingerprint data; only a WebAuthn assertion is validated by the OS.  
- **Least‑Privilege API Calls:** The `/api/chat/text` endpoint only accepts plain text; no file uploads or privileged actions are exposed.  

---  

## 10. Deployment & Packaging  

1. **Development:** `npm run dev` – hot‑reload UI, backend auto‑restart (if separate).  
2. **Production Build:** `npm run build` – generates optimized static assets.  
3. **Packaging:**  
   - **Electron:** `electron-builder` config in `package.json`.  
   - **Tauri:** alternative lighter wrapper; requires Rust toolchain.  
4. **Distribution:** Signed installers for macOS, Windows, and Linux (AppImage/Snap).  

---  

## 11. Future Work  

| Area | Planned Enhancements |
|------|----------------------|
| **Wake‑Word Robustness** | Deploy a small on‑device keyword spotting model (e.g., Vosk) for offline detection. |
| **Command Parsing** | Introduce a full intent classifier (slot‑filling) to support complex commands (“open my calendar at 3pm”). |
| **Multi‑Modal Input** | Add image‑based UI commands (e.g., screenshot, draw). |
| **Persistent Memory** | Store conversation history in a local SQLite DB for context across sessions. |
| **Privacy Guard** | Add a “mute” toggle that disables microphone completely. |
| **Testing** | Expand unit tests for `useSpeech` and add integration tests for the API contract. |

---  

*Prepared by:*  
[Your Name] – Lead Architect, Friday Assistant  
Date: 2025‑11‑03  

---