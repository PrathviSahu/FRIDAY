/**
 * Calls the text-only chat endpoint (/api/chat/text) which does LLM-only processing
 * (no speech-to-text). Used when the wake-word has already been detected client-side.
 */
export async function fetchChatText(text: string): Promise<{ reply: string; action: string }> {
  const res = await fetch('http://localhost:5173/api/chat/text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`chat/text ${res.status}: ${err}`);
  }

  // The backend returns { reply: "...", action: "..." }
  return res.json();
}