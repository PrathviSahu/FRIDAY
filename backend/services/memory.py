"""FRIDAY's Adaptive Learning & Persistent Memory Module.

Stores:
- User Preferences & Personal Facts
- Learned Corrections & Preferences
- Interactive Session Conversation History
"""
import sqlite3
import json
from pathlib import Path
from datetime import datetime

DB_PATH = Path(__file__).parent.parent / "data" / "friday_memory.db"
DB_PATH.parent.mkdir(parents=True, exist_ok=True)


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_memory_db():
    with get_db() as conn:
        conn.execute("""
        CREATE TABLE IF NOT EXISTS memories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT,
            key_fact TEXT UNIQUE,
            value_fact TEXT,
            confidence REAL DEFAULT 1.0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)
        conn.execute("""
        CREATE TABLE IF NOT EXISTS conversation_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            role TEXT,
            message TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)
        conn.commit()


# Initialize database table on import
init_memory_db()


def save_fact(key: str, value: str, category: str = "preference"):
    """Save or update a learned fact about the Boss or environment."""
    key_clean = key.strip().lower()
    val_clean = value.strip()
    with get_db() as conn:
        conn.execute("""
        INSERT INTO memories (category, key_fact, value_fact, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(key_fact) DO UPDATE SET
            value_fact = excluded.value_fact,
            updated_at = CURRENT_TIMESTAMP
        """, (category, key_clean, val_clean))
        conn.commit()


def get_all_memories() -> list:
    """Retrieve all learned memories formatted for AI prompt injection."""
    with get_db() as conn:
        rows = conn.execute("SELECT key_fact, value_fact, category FROM memories").fetchall()
        return [{"key": r["key_fact"], "value": r["value_fact"], "category": r["category"]} for r in rows]


def get_memory_context_string() -> str:
    """Formats all saved facts into a string for Gemini's system prompt."""
    memories = get_all_memories()
    if not memories:
        return "No prior user preferences saved yet."
    
    lines = ["Here are the permanent facts and preferences you have learned about your Boss:"]
    for m in memories:
        lines.append(f"- {m['key']}: {m['value']}")
    return "\n".join(lines)


def log_conversation(role: str, message: str):
    """Keep track of recent chat turns for contextual continuity."""
    with get_db() as conn:
        conn.execute("INSERT INTO conversation_history (role, message) VALUES (?, ?)", (role, message))
        conn.commit()


def get_recent_conversation(limit: int = 6) -> list:
    """Get the last N messages to maintain short-term context."""
    with get_db() as conn:
        rows = conn.execute(
            "SELECT role, message FROM conversation_history ORDER BY id DESC LIMIT ?", (limit,)
        ).fetchall()
        return [{"role": r["role"], "message": r["message"]} for r in reversed(rows)]
