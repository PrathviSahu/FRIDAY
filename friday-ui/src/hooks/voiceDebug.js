export function voiceDebug(label, ...args) {
  if (window.isSecureContext) {
    console.log(`[Voice Debug] ${label}:`, ...args);
  }
}
export function fingerprintDebug(label, ...args) {
  if (window.isSecureContext) {
    console.log(`[Fingerprint Debug] ${label}:`, ...args);
  }
}

// Global debug overlay component
try {
  if (typeof window !== 'undefined') {
    window.fridayDebug = {
      voiceDebug,
      fingerprintDebug,
      isDebug: true,
      voiceEnabled: typeof window.SpeechRecognition !== 'undefined',
      fingerprintSupported: () => window.PublicKeyCredential !== undefined,
    };
  }
} catch (e) {}