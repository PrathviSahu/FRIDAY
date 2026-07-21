import { useEffect, useRef } from 'react';
import { matchVoiceCommand } from './voiceCommands';
import { speak } from '../services/ttsService';
import { fetchChatText } from '../api/chatText';

/**
 * Wake word trigger phrases.
 */
const WAKE_WORDS = [
  'hey friday',
  'hi friday',
  'hello friday',
  'ok friday',
  'okay friday',
  'wake up friday',
  'wake up',
  'friday'
];

/**
 * Strips out any wake-word (like "hey friday", "friday", etc.) from anywhere in the transcript.
 * Sends ONLY the clean actual query to FRIDAY's AI brain!
 */
function cleanQuery(transcript) {
  if (!transcript) return '';
  let cleaned = transcript.trim();

  // Strip wake word phrases case-insensitively
  for (const wakeWord of WAKE_WORDS) {
    const reg = new RegExp(wakeWord, 'gi');
    cleaned = cleaned.replace(reg, '');
  }

  // Clean remaining leading/trailing punctuation and whitespace
  return cleaned.replace(/^[\s,.\-?]+|[\s,.\-?]+$/g, '').trim();
}

/**
 * Returns the extracted clean query.
 */
function extractCommand(transcript, locked) {
  if (!transcript) return null;
  const t = transcript.trim().toLowerCase();

  const sortedWords = WAKE_WORDS.slice().sort((a, b) => b.length - a.length);

  // Check if wake-word exists in transcript
  const hasWakeWord = sortedWords.some(w => t.includes(w));

  if (hasWakeWord) {
    const cleaned = cleanQuery(transcript);
    return cleaned || 'hello';
  }

  // Once unlocked, allow direct questions without requiring wake word
  if (!locked && t.length > 2) {
    return cleanQuery(transcript) || t;
  }

  return null;
}

export function useSpeech({ onCommand, onConversation, enabled = true, locked = false }) {
  const activeRef = useRef(false);
  const processingRef = useRef(false);

  const onCommandRef = useRef(onCommand);
  const onConversationRef = useRef(onConversation);
  const lockedRef = useRef(locked);

  onCommandRef.current = onCommand;
  onConversationRef.current = onConversation;
  lockedRef.current = locked;

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    let cancelled = false;
    let rec = null;

    const start = () => {
      if (cancelled) return;

      rec = new SR();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onresult = (e) => {
        const result = e.results[e.resultIndex];
        if (!result || !result.isFinal) return;
        const text = result[0].transcript.trim();
        if (!text) return;

        console.log('[Voice] Raw speech recognized:', text);
        const cmd = extractCommand(text, lockedRef.current);
        if (cmd) {
          console.log('[Voice] Clean query sent to AI (wake-word removed):', cmd);
          handleCmd(cmd);
        }
      };

      rec.onerror = (e) => {
        if (e.error === 'no-speech' || e.error === 'aborted') return;
        console.warn('[Voice] Speech error:', e.error);
        if (!cancelled && activeRef.current) {
          setTimeout(start, 500);
        }
      };

      rec.onend = () => {
        if (!cancelled && activeRef.current) {
          setTimeout(start, 200);
        }
      };

      try {
        rec.start();
        activeRef.current = true;
      } catch (e) {
        // ignore already started error
      }
    };

    const handleCmd = async (cmd) => {
      if (processingRef.current) return;

      processingRef.current = true;
      try {
        // SECURITY CHECK: If system is LOCKED, block main features
        if (lockedRef.current) {
          const lockedReply = "Access denied, Boss. Please authenticate with your fingerprint key first.";
          
          onConversationRef.current?.({
            transcript: cmd,
            reply: lockedReply,
            action: 'none',
          });

          await speak(lockedReply);
          return;
        }

        // UNLOCKED STATE: Execute full system features
        const localCommand = matchVoiceCommand(cmd);
        if (localCommand) {
          onCommandRef.current?.(localCommand);
          processingRef.current = false;
          return;
        }

        const data = await fetchChatText(cmd);
        const reply = data.reply?.trim() || '';
        const action = data.action?.trim() || 'none';

        if (action && action !== 'none') {
          onCommandRef.current?.(action);
        }

        onConversationRef.current?.({
          transcript: cmd,
          reply,
          action,
        });

        await speak(reply);
      } catch (err) {
        console.warn('[Voice] Command error:', err);
      } finally {
        processingRef.current = false;
      }
    };

    const timer = setTimeout(start, 0);

    return () => {
      cancelled = true;
      activeRef.current = false;
      try { rec?.stop(); } catch (_) {}
      clearTimeout(timer);
    };
  }, []);
}