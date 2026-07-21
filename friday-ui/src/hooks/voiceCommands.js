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

  // STRICT SHORTCUT COMMAND PATTERNS
  // Require explicit action verbs (e.g. "open trading", "lock yourself") so general questions are passed to AI brain
  if (/\b(?:lock yourself|lock down|lock system|secure system)\b/.test(text)) { return 'lock'; }
  if (/\b(?:open|show|launch|start)\b.*\btrading\b/.test(text)) { return 'trading'; }
  if (/\b(?:open|show|launch|start)\b.*\bengineering\b/.test(text)) { return 'engineering'; }
  if (/\b(?:open|launch|start)\b.*\b(?:vscode|visual studio code|vs code)\b/.test(text)) { return 'vscode'; }
  if (/\b(?:open|launch|start)\b.*\b(?:browser|chrome|edge|safari)\b/.test(text)) { return 'browser'; }
  if (/\b(?:open|show|launch)\b.*\b(?:dashboard|status panel)\b/.test(text)) { return 'dashboard'; }

  return null;
}


export function shouldVerifyVoice(confidence = 0) {
  return Number(confidence) >= 0.7;
}