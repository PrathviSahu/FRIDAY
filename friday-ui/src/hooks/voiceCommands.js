export function normalizeTranscript(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}


export function matchVoiceCommand(transcript) {
  const text = normalizeTranscript(transcript);
  console.log('[Voice] Transcript:', transcript, '-> normalized:', text);
  if (!text) return null;

  // WAKE WORD PATTERNS
  if (/\bwake\s*up\b/.test(text)) { return 'wake'; }
  if (/\bwake\b/.test(text)) { return 'wake'; }
  if (/\bfriday\b/.test(text)) { return 'wake'; }
  if (/\b(?:hey|hi)\s+fri/.test(text)) { return 'wake'; }

  // COMMAND PATTERNS
  if (/\btrading\b/.test(text)) { return 'trading'; }
  if (/\bengineering\b/.test(text)) { return 'engineering'; }
  if (/\b(?:lock|secure|securely)\b/.test(text)) { return 'lock'; }
  if (/\b(?:open|launch|start)\b.*\b(?:vscode|visual studio code|vs code|code)\b/.test(text)) { return 'vscode'; }
  if (/\b(?:open|launch|start)\b.*\b(?:browser|chrome|edge|safari)\b/.test(text)) { return 'browser'; }
  if (/\b(?:open|show|launch)\b.*\b(?:dashboard|status|panel)\b/.test(text)) { return 'dashboard'; }

  console.log('[Voice] No match found for:', text);
  return null;
}


export function shouldVerifyVoice(confidence = 0) {
  return Number(confidence) >= 0.7;
}