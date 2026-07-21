import { useEffect, useRef } from 'react';
import { matchVoiceCommand } from './voiceCommands';
import { speak } from '../services/ttsService';
import { fetchChatText } from '../api/chatText';

/**
 * ALL words that act as wake-words. Any of these will trigger FRIDAY.
 *
 * IMPORTANT: Add the new wake words ("wake" and "wake up") to ensure they are recognized
 * before the word "friday" (so "wake up" is matched first).
 */
const WAKE_WORDS = [
  'wake',        // New! matches "wake" and "wake up" (if matching longer phrase first)
  'wake up',     // Longer phrase matched first (automatically by algorithm)
  'friday',
  'hey',
  'hi',
  'hello',
  'ok',
  'okay',
  'yo',
  'um',
  'uh',
  'so',
  'listen',
  'please',
  'well',
  'actually',
  'right',
  'just',
  'now'
];

/**
 * Returns the command part after the FIRST wake-word found,
 * or null if no wake-word is present.
 *
 * Matches longest phrases first (e.g., "wake up") to avoid partial matches.
 * Handles "if Friday" correctly by trimming leading punctuation and whitespace.
 */
function extractCommand(transcript) {
  if (!transcript) return null;
  const t = transcript.trim().toLowerCase();

  // Sort by descending length to match longer phrases first
  // e.g., "wake up" before "wake"
  const sortedWords = WAKE_WORDS.slice().sort((a, b) => b.length - a.length);

  // Try each wake word in order of length
  for (const wakeWord of sortedWords) {
    const index = t.indexOf(wakeWord);
    if (index !== -1) {
      // Slice after the complete wake word match
      const after = t.substring(index + wakeWord.length);
      // Trim leading punctuation and whitespace
      return after.replace(/^[\s,.\-?]+/, '').trim();
    }
  }

  return null;
}

/**
 * The voice hook that captures audio, detects wake words, and dispatches commands.
 * Includes error handling for malformed transcripts and permission issues.
 */
export function useSpeech({ onCommand, onConversation, enabled = false }) {
  const recRef = useRef(null);
  const activeRef = useRef(false);
  const processingRef = useRef(false);
  const lastFinalRef = useRef('');

  // Keep callbacks fresh to avoid stale closures
  const onCommandRef = useRef(onCommand);
  const onConversationRef = useRef(onConversation);
  onCommandRef.current = onCommand;
  onConversationRef.current = onConversation;

  useEffect(() => {
    if (!enabled) return;

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      console.warn('[Voice] SpeechRecognition not available. Use Chrome/Edge.');
      return;
    }

    let cancelled = false;
    let rec = null;

    const start = async () => {
      if (cancelled) return;

      // Request microphone permission first (must be done after user gesture)
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (e) {
        console.warn('[Voice] Mic permission denied:', e);
        return;
      }

      // Initialize speech recognition engine
      rec = new SR();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onresult = (e) => {
        const result = e.results[e.resultIndex];
        if (!result || !result.isFinal) return;
        const text = result[0].transcript.trim();
        if (!text) return;

        // Check for wake word at the beginning (or anywhere)
        const cmd = extractCommand(text);
        if (cmd) {
          console.log('[Voice] Wake-word detected → command:', cmd);
          handleCmd(cmd);
        } else {
          console.log('[Voice] No wake-word detected in:', text);
        }
      };

      rec.onerror = (e) => {
        console.warn('[Voice] Recognition error:', e.error || e);
        // Attempt to restart if not explicitly cancelled
        if (!cancelled && activeRef.current) {
          setTimeout(start, 300);
        }
      };

      rec.onend = () => {
        console.log('[Voice] Recognition stopped (will restart if enabled)');
        if (!cancelled && activeRef.current && enabled) {
          setTimeout(start, 100);
        }
      };

      // Start the recognition engine
      try {
        rec.start();
        activeRef.current = true;
        console.log('[Voice] Started listening for wake words...', { enabled, WAKE_WORDS });
      } catch (e) {
        console.warn('[Voice] Could not start recognition:', e);
      }
    };

    const handleCmd = async (cmd) => {
      if (processingRef.current) {
        console.log('[Voice] Command already processing, skipping:', cmd);
        return;
      }

      processingRef.current = true;
      try {
        // First, try to match a local command (shortcut handling)
        const localCommand = matchVoiceCommand(cmd);
        if (localCommand) {
          console.log('[Voice] Local command matched:', localCommand);
          onCommandRef.current?.(localCommand);
          return;
        }

        // No local command, send to backend chat endpoint
        console.log('[Voice] Sending to backend:', cmd);
        const data = await fetchChatText(cmd);
        const reply = data.reply?.trim() || '';
        const action = data.action?.trim() || 'none';

        console.log('[Voice] FRIDAY response:', { reply, action });
        await speak(reply);

        // Notify the UI of the new assistant message
        onConversationRef.current?.({
          transcript: cmd,
          reply,
          action,
        });
      } catch (err) {
        console.warn('[Voice] Command processing failed:', err);
        // Provide a user-friendly error response
        await speak('I encountered an error. Please try again.');
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
  }, [enabled]);
}