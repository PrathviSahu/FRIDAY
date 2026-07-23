import { useEffect, useRef } from 'react';
import { matchVoiceCommand } from './voiceCommands';
import { fetchChatText } from '../api/chatText';
import { speak, stopSpeaking } from '../services/ttsService';

const withTimeout = (promise, ms) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    ),
  ]);

export function useSpeech({ locked, isLocked, workspace = 'unlocked', enabled = true, onCommand, onConversation }) {
  // Support both prop name variants: locked (LockScreen) and isLocked (legacy)
  const _locked = locked ?? isLocked ?? false;
  const activeRef     = useRef(false);  // true while SpeechRecognition is running
  const processingRef = useRef(false);  // true while a command is being handled
  const speakingRef   = useRef(false);  // true while FRIDAY's TTS is playing
  const enabledRef    = useRef(enabled); // mirrors the enabled prop reactively
  const lockedRef     = useRef(_locked);
  const workspaceRef  = useRef(workspace);
  const onCommandRef  = useRef(onCommand);
  const onConvRef     = useRef(onConversation);
  const lastTranscriptRef = useRef(null); // { text, ts } — dedup guard for double-fired transcripts

  // Keep refs in sync with props every render — no re-mount needed
  useEffect(() => { lockedRef.current = _locked; }, [_locked]);
  useEffect(() => { workspaceRef.current = workspace; }, [workspace]);
  useEffect(() => { onCommandRef.current = onCommand; }, [onCommand]);
  useEffect(() => { onConvRef.current = onConversation; }, [onConversation]);

  // When enabled flips OFF → abort recognizer immediately.
  // When it flips ON  → let the inner loop restart via scheduleRestart.
  useEffect(() => {
    enabledRef.current = enabled;
    if (!enabled) {
      // Hard-stop: abort is caught below by the silenced handlers, no restart scheduled
      stopRecognizer();
    }
  }, [enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  // Hold a stable ref to the abort helper so the enabled effect can call it
  const stopRecognizerRef = useRef(null);
  const stopRecognizer = () => {
    if (stopRecognizerRef.current) stopRecognizerRef.current();
  };

  useEffect(() => {
    let rec              = null;
    let cancelled        = false;
    let restartTimer     = null;    // only ONE pending restart at a time
    let keepAlive        = null;
    let noSpeechStreak   = 0;       // consecutive no-speech errors → exponential back-off

    // Register the abort helper so the enabled-toggle effect can reach it
    stopRecognizerRef.current = () => {
      if (restartTimer) { clearTimeout(restartTimer); restartTimer = null; }
      if (rec) {
        rec.onend    = null;
        rec.onerror  = null;
        rec.onresult = null;
        try { rec.abort(); } catch (_) {}
        activeRef.current = false;
      }
    };

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      console.warn('[Voice] SpeechRecognition not supported in this browser.');
      return;
    }

    // ── Schedule at most one pending restart ─────────────────────────────────
    const scheduleRestart = (ms) => {
      if (cancelled || restartTimer || !enabledRef.current) return;
      restartTimer = setTimeout(() => {
        restartTimer = null;
        if (!cancelled && enabledRef.current) start();
      }, ms);
    };

    // ── Create and boot a fresh SpeechRecognition instance ───────────────────
    const start = () => {
      if (cancelled || !enabledRef.current) return;

      // Silence old instance BEFORE abort so its onend/onerror don't re-fire
      if (rec) {
        rec.onend    = null;
        rec.onerror  = null;
        rec.onresult = null;
        try { rec.abort(); } catch (_) {}
        rec = null;
      }

      rec = new SpeechRec();
      rec.continuous     = true;
      rec.interimResults = false;
      rec.lang           = 'en-US';

      rec.onstart = () => {
        console.log('[Voice] Microphone actively Listening...');
        activeRef.current = true;
        noSpeechStreak = 0;
      };

      rec.onerror = (e) => {
        activeRef.current = false;
        if (cancelled || !enabledRef.current) return;
        console.warn('[Voice] Recognition error:', e.error);

        if (e.error === 'no-speech') {
          // Exponential back-off: 500 → 1000 → 2000 → 4000 → 5000ms cap
          noSpeechStreak += 1;
          const delay = Math.min(500 * Math.pow(2, noSpeechStreak - 1), 5000);
          console.log(`[Voice] no-speech streak=${noSpeechStreak}, retrying in ${delay}ms`);
          scheduleRestart(delay);
        } else if (e.error === 'network') {
          scheduleRestart(1000);
        }
        // 'aborted' is intentional — let onend handle cleanup
      };

      rec.onend = () => {
        activeRef.current = false;
        if (cancelled || !enabledRef.current) return;
        console.log('[Voice] Recognition ended, scheduling restart...');
        const delay = noSpeechStreak > 0 ? Math.min(500 * noSpeechStreak, 3000) : 300;
        scheduleRestart(delay);
      };

      rec.onresult = async (e) => {
        if (!enabledRef.current) return;

        const idx = e.resultIndex ?? 0;
        const rawTranscript = e.results[idx]?.[0]?.transcript ?? '';
        if (!rawTranscript.trim()) return;

        console.log('[Voice] Raw speech recognized:', rawTranscript);

        // ⚡ INSTANT BARGE-IN: stop TTS when user speaks
        if (speakingRef.current) {
          console.log('[Voice Interrupt] 🛑 User speech mid-sentence — aborting TTS...');
          stopSpeaking();
          speakingRef.current = false;
        }

        // ── Wake-word stripping (only at start of transcript) ─────────────────
        // Strips optional wake-word prefix: "Friday play music" -> "play music", "Hey Friday volume 80" -> "volume 80"
        let query = rawTranscript.trim()
          // Fix known Web Speech STT phonetic misheards at start of phrase
          .replace(/^ready\s*(?:film|feel|fill)/i, 'play')
          .replace(/^if\s+friday\s+please/i, 'play')
          .replace(/^suno\s+friday/i, '')
          .replace(/^(?:if|he|hey|hi|hello|ok|okay|sun|suno|aye)?\s*(?:friday|fraide|frida|freddy|frieda|freddie|freya|phiday|fri\s*day)\b\s*/gi, '')
          .trim();

        // Wake-word-only interrupt (user said only "Friday" to stop TTS)
        if (!query) {
          console.log('[Voice Interrupt] Wake-word only — listening for command...');
          noSpeechStreak = 0;
          return;
        }

        // ── Minimal Noise Filter (grunts only) ─────────────────────────────────
        // ONLY drop pure non-word grunts — NEVER drop song names or short queries!
        const NOISE_ONLY = new Set(['uh', 'um', 'hmm', 'hm', 'ah', 'oh']);
        const normalized = query.toLowerCase().trim();
        if (NOISE_ONLY.has(normalized)) {
          console.log('[Voice] Ignored grunt noise:', query);
          start();
          return;
        }

        // ── Dedup guard ───────────────────────────────────────────────────────
        const now = Date.now();
        const lastRaw = lastTranscriptRef.current;
        if (lastRaw && lastRaw.text === rawTranscript.trim() && now - lastRaw.ts < 2500) {
          console.log('[Voice] Suppressing duplicate transcript within 2.5s:', rawTranscript);
          return;
        }
        lastTranscriptRef.current = { text: rawTranscript.trim(), ts: now };

        // Stop recognizer while processing
        if (rec) {
          rec.onend    = null;
          rec.onerror  = null;
          rec.onresult = null;
          try { rec.abort(); } catch (_) {}
          rec = null;
          activeRef.current = false;
        }

        noSpeechStreak = 0;

        // Fix common Web Speech STT phonetic misrecognitions
        if (/^at\s+this\s+song/i.test(query)) {
          query = query.replace(/^at\s+this\s+song/i, 'add this song');
        }

        console.log('[Voice] Valid command recognized:', rawTranscript.trim(), '-> query:', query);

        if (query.length > 0) {
          if (window.fridayCheckPendingConfirmation) {
            const handled = await window.fridayCheckPendingConfirmation(query);
            if (handled) {
              console.log('[Voice] Pending proactive action confirmed.');
              start();
              return;
            }
          }

          handleCmd(query);
        } else {
          start();
        }
      };



      try {
        rec.start();
      } catch (err) {
        console.warn('[Voice] start() threw:', err.message || err);
        scheduleRestart(800);
      }
    };

    // ── Watchdog: revive if mic silently died ─────────────────────────────────
    keepAlive = setInterval(() => {
      if (!cancelled && enabledRef.current && !activeRef.current && !processingRef.current && !restartTimer) {
        console.log('[Voice Watchdog] Mic inactive — restarting...');
        noSpeechStreak = 0;
        start();
      }
    }, 5000);

    let lastProcessedCmd = '';
    let lastProcessedTime = 0;

    // ── Command handler ───────────────────────────────────────────────────────
    const handleCmd = async (cmd) => {
      const now = Date.now();
      if (processingRef.current || (cmd === lastProcessedCmd && now - lastProcessedTime < 2500)) {
        console.log('[Voice] Suppressing duplicate rapid command:', cmd);
        if (!activeRef.current) start();
        return;
      }
      processingRef.current = true;
      lastProcessedCmd = cmd;
      lastProcessedTime = now;

      try {
        const localCommand = matchVoiceCommand(cmd);
        if (localCommand) {
          // Workspace commands are blocked when the system is locked
          const workspaceCommands = ['trading', 'dashboard', 'engineering', 'vscode', 'browser'];
          if (lockedRef.current && workspaceCommands.includes(localCommand)) {
            const lockedReply = 'System is locked, Boss. Please unlock first.';
            onConvRef.current?.({ transcript: cmd, reply: lockedReply, action: 'none' });
            speakingRef.current = true;
            try { await withTimeout(speak(lockedReply), 8000); } catch (_) {}
            speakingRef.current = false;
            return;
          }

          onCommandRef.current?.(localCommand);
          const reply = localCommand === 'trading'
            ? 'Opening Personal Trading Station, Prem.'
            : localCommand === 'dashboard'
            ? 'Opening Dashboard, Prem.'
            : localCommand === 'engineering'
            ? 'Opening Engineering Console, Prem.'
            : 'Executing command, Prem.';
          onConvRef.current?.({ transcript: cmd, reply, action: localCommand });
          speakingRef.current = true;
          try { await withTimeout(speak(reply), 10000); } catch (_) {}
          speakingRef.current = false;
          return;
        }

        const data   = await withTimeout(fetchChatText(cmd), 12000);
        const reply  = data.reply?.trim()  || 'At your service, Boss.';
        const action = data.action?.trim() || 'none';

        if (action && action !== 'none') onCommandRef.current?.(action);
        onConvRef.current?.({ transcript: cmd, reply, action });

        // ── Speak response ───────────────────────────────────────────────────
        if (!data.silence_tts) {
          speakingRef.current = true;
          try { await withTimeout(speak(reply), 15000); } catch (_) {}
          speakingRef.current = false;
        }
        noSpeechStreak = 0;

        // Brief buffer after speech finishes, restart mic
        await new Promise(r => setTimeout(r, 400));

      } catch (err) {
        console.warn('[Voice] Command error:', err);
        speakingRef.current = false;
      } finally {
        processingRef.current = false;
        // 🚀 CRITICAL PERMANENT FIX: Always guarantee mic restarts in finally block
        if (!cancelled && enabledRef.current && !activeRef.current) {
          start();
        }
      }
    };

    // Boot immediately if enabled
    const bootTimer = setTimeout(() => { if (enabledRef.current) start(); }, 0);

    return () => {
      cancelled = true;
      activeRef.current    = false;
      speakingRef.current  = false;
      stopRecognizerRef.current = null;
      if (keepAlive)    clearInterval(keepAlive);
      if (restartTimer) clearTimeout(restartTimer);
      clearTimeout(bootTimer);
      if (rec) {
        rec.onend = null; rec.onerror = null; rec.onresult = null;
        try { rec.abort(); } catch (_) {}
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}