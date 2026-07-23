# ⚡ F.R.I.D.A.Y. — Voice-Controlled AI Operating System & Quantum Trading Workstation

> **F.R.I.D.A.Y.** is a full-stack, voice-controlled AI desktop operating system inspired by Iron Man's J.A.R.V.I.S., built using **React 18**, **Vite**, **Python FastAPI**, **Groq (Llama 3.3 70B)**, and **Google Gemini 2.5**.

---

## 📖 Overview

**F.R.I.D.A.Y.** is a comprehensive personal AI assistant designed to streamline trading, daily productivity, media control, and macOS system automation. 

Key architectural pillars:
- **Dual-Engine Hybrid AI Brain**: Sub-150ms voice interactions via Groq Llama 3.3 70B + complex reasoning & fallbacks via Google Gemini 2.5.
- **Strict Female Voice Engine**: Microsoft Edge-TTS neural voices (`en-IN-NeerjaNeural` / `hi-IN-SwaraNeural`) paired with a browser fallback filter that strictly enforces female voice selection (e.g. Samantha, Victoria, Karen, Zira) while excluding male voices.
- **Quantum Trading Workstation**: TradingView Lightweight Charts canvas engine with live OHLCV candle streaming across 7 timeframes (`1m` to `1W`) for 5000+ symbols (NSE/BSE Indian Equities, Forex, Crypto, US Stocks), 30-second live auto-polling, and a drag-and-drop watchlist backed by SQLite database persistence.
- **Zero-Config Spotify Automation**: Control music playback, track search, volume, and progress seek bar (`/api/spotify/seek`) via an anonymous web player token without manual OAuth setup.
- **macOS Automation & Hardware Telemetry**: Voice-driven application management (`open`/`close`), system volume control, and real-time CPU, RAM, Disk, and Power monitoring.
- **Autonomous AI Job Portal Agent *(Roadmap / In Development)***: AI job search aggregator across LinkedIn, Naukri, and Internshala with match scoring, owner review queue, and voice-authorized auto-apply agent.

---

## ✨ Full Feature Breakdown

### 🧠 1. Adaptive Self-Learning AI Brain & Memory Core (`learning_engine.py`)
- **Sub-150ms Dual-Engine LLM**: Groq Llama 3.3 70B primary engine (~150ms) + Google Gemini 2.5 failover.
- **Unified SQLite Brain Database (`friday_brain.db`)**:
  - `memories`: Permanent facts & user preferences about Prem.
  - `conversation_history`: Short-term context & RAG keyword-token semantic memory search across past conversation turns.
  - `user_action_habits`: High-value habit tracking (trading, music, weather, job search) by hour & day-of-week with proactive verbal suggestions when confidence $S_{habit} \ge 0.70$.
  - `user_corrections`: Automatic voice correction detection (*"wrong song"*, *"not that remix"*, *"yeh nahi"*) applying a **-40.0 soft penalty weight** to rejected targets.
  - `job_profile`, `resume_data`, `job_applications`: Full career profile memory with automatic signal extraction (*"I am a Java developer"* → saves role, skills, experience).
- **Dynamic Brevity Controller**: Auto-adjusts response length based on query complexity (≤8 words → 1 short phrase; questions → max 2 sentences).
- **Voice Fingerprint & Security**: Dedicated owner authorization ("Prem") with gated guest permission controls (`"allow guest"` / `"revoke guest"`).

### 🎵 2. Zero-Config Spotify Automation & Smart Audio Ducking
- **Zero-OAuth Web Player Token Engine**: Anonymous token resolver for instant song & playlist playback without manual API credentials.
- **Automatic Audio Ducking**: Spotify music volume automatically dips to 20% whenever FRIDAY speaks and restores instantly when she finishes, ensuring crisp speech clarity over music.
- **Voice Media Control**: *"play Kesariya"*, *"volume down"*, *"mute"*, *"set volume to 70%"*, *"next track"*, *"pause"*, *"play English playlist"*.
- **Now Playing Telemetry**: Live track title, artist, artwork, position timer, and click-to-seek progress bar (`/api/spotify/seek`).

### 📈 3. Quantum Trading Workstation
- **TradingView Lightweight Charts Engine**: High-performance canvas chart rendering with candlestick & volume histograms.
- **Real-Time Data Pipeline (`/api/trading/ohlcv`)**: Live and historical OHLCV data via Yahoo Finance (`yfinance`) across 7 timeframes (`1m`, `5m`, `15m`, `30m`, `1h`, `1D`, `1W`).
- **5000+ Symbols Covered**: Indian Equities (`NSE:RELIANCE`, `NSE:TCS`, `BSE:SENSEX`, `NSE:NIFTY50`), Forex (`FX:EURUSD`), Crypto (`BINANCE:BTCUSDT`), Global Indices (`OANDA:NAS100USD`), and US Equities.
- **Persistent Drag-and-Drop Watchlist**: HTML5 drag-and-drop reordering. All custom ordering, stock additions, and deletions persist permanently in SQLite (`friday_trading_db.sqlite`) and `localStorage`.
- **Live Auto-Polling**: Real-time tick updates every 30 seconds with pulsing `LIVE` badge and manual refresh button (`↺`).

- **Voice Media Control**: *"play Kesariya"*, *"volume down"*, *"mute"*, *"set volume to 70%"*, *"next track"*, *"pause"*, *"play English playlist"*.
- **Now Playing Telemetry**: Live song title, artist name, album cover art, playback position timer, and click-to-seek progress bar (`/api/spotify/seek`).

### 💻 4. macOS System Automation & Telemetry
- **Voice Application Control**: Open and quit macOS applications (`Brave`, `VS Code`, `Spotify`, `Terminal`, `Finder`) via sanitized AppleScript wrappers.
- **System Telemetry**: Real-time CPU usage %, RAM GB/%, SSD Disk %, and Battery power monitoring via `psutil`.
- **System Volume Control**: Adjust master output volume by percentage or relative step commands.

### 📋 5. HUD Dashboard & Widgets
- **Spotify Card**: Floating player with album art, position seek bar, and playback toggles.
- **Todo Card**: Task manager with priority tags (`High`, `Normal`, `Low`), status filters (`All`, `Active`, `Completed`), inline editing, and voice-to-todo creation.
- **Weather Card**: Live weather via Open-Meteo API with auto IP geolocation and city voice search.
- **System Monitor Card**: Real-time hardware telemetry charts.
- **Web Search Card**: Inline web search widget.
- **Ambient Lock Screen**: Glassmorphism UI with GLSL shader orb animation.

### 💼 6. Autonomous AI Job Portal *(Roadmap / In Development)*
- **AI Job Scraper**: Automatically aggregates relevant developer & engineering job listings from LinkedIn, Naukri, and Internshala.
- **Match Scoring Engine**: LLM ranks opportunities based on skills, salary, location, and company repute.
- **Human-in-the-Loop Review Queue**: Surfaced in FRIDAY UI / Voice for explicit owner approval (`"Approve"` / `"Reject"`).
- **Auto-Apply Agent**: Automated browser agent populating resume details and submitting job applications upon voice authorization.

---

## 🛠️ Technology Stack

| Domain | Technologies |
|---|---|
| **Frontend UI** | React 18, Vite, Tailwind CSS, Framer Motion, TradingView Lightweight Charts, Web Speech API, WebGL GLSL Shaders |
| **Backend API** | Python 3.11, FastAPI, Uvicorn, SQLite, yfinance, psutil, asyncio |
| **AI Models** | Groq (Llama 3.3 70B Versatile), Google Gemini 2.5 |
| **Audio / Speech** | Web Speech API (STT), Microsoft Edge-TTS (Neural TTS) |
| **Integrations** | Spotify Web Player API, Open-Meteo, Google Drive API, AppleScript (`osascript`) |

---

## 📁 Directory Structure

```
FRIDAY/
├── README.md                      # <--- Main & Single Comprehensive Documentation
├── architecture.md                # Technical Architecture & System Design Document
├── backend/                       # Python FastAPI Backend
│   ├── app.py                     # Main FastAPI server (:8000)
│   ├── database/                  # SQLite database wrappers (watchlist_db.py)
│   ├── data/                      # Persistent JSON/SQLite data (todos.json, memory.db)
│   ├── services/                  # Business logic services
│   │   ├── brain.py               # Groq/Gemini LLM dual-engine
│   │   ├── system_control.py      # macOS AppleScript & Spotify automation
│   │   ├── market_data.py         # Live prices & Yahoo Finance OHLCV generator
│   │   ├── todos.py               # Task CRUD service
│   │   ├── system_stats.py        # psutil system telemetry
│   │   ├── weather.py             # Open-Meteo API wrapper
│   │   └── memory.py              # Long-term memory store
│   └── requirements.txt
└── friday-ui/                     # React Frontend (Vite)
    ├── src/
    │   ├── components/            # LockScreen, Panels (SpotifyCard, TodoCard, SystemHUD, WeatherCard)
    │   ├── hooks/                 # useSpeech.js, useOrbState.jsx, useProactiveSuggestions.js
    │   ├── UI/TradingWorkstation/ # Quantum Trading Workstation & Lightweight Charts
    │   └── services/              # ttsService.js
    └── package.json
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+)
- Python (v3.11+)
- macOS (for AppleScript automation & system telemetry)

### 1. Launch Backend Server
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000
```

### 2. Launch Frontend UI
```bash
cd friday-ui
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🔒 Security Policy
- **CORS Isolation**: API endpoints are strictly restricted to local frontend origins (`http://localhost:5173`, `http://127.0.0.1:5173`).
- **Input Sanitization**: Application control and AppleScript triggers enforce strict alphanumeric regex sanitization (`re.sub(r'[^a-zA-Z0-9\s._\-]', '', app_name)`) to prevent command injection.
- **Defensive Data Handling**: Safe dictionary lookup patterns (`dict.get()`) used across data models to prevent unexpected runtime crashes.

---

*Author / Lead Architect:* **Prem (Prathvi Sahu)** & **F.R.I.D.A.Y.**
