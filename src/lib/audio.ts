// Audio synthesis helper for German Voice Receptionist using ElevenLabs

let currentAudio: HTMLAudioElement | null = null;

export function playLocalAudio(url: string, onEnd?: () => void): () => void {
  stopSpeaking();
  currentAudio = new Audio(url);
  currentAudio.onended = () => { if (onEnd) onEnd(); };
  currentAudio.onerror = () => { if (onEnd) onEnd(); };
  currentAudio.play().catch(e => {
    console.error("Local audio playback error:", e);
    if (onEnd) onEnd();
  });
  return () => { stopSpeaking(); };
}

export function speakText(text: string, voiceId: string | null, onEnd?: () => void): () => void {
  // Cancel any ongoing speech
  stopSpeaking();

  // Clean markdown or brackets from text
  const cleanedText = text
    .replace(/\[.*?\]/g, '')
    .replace(/\*/g, '')
    .replace(/#/g, '')
    .trim();

  if (!cleanedText) {
    if (onEnd) onEnd();
    return () => {};
  }

  const payload = {
    text: cleanedText,
    voiceId: voiceId || undefined
  };

  fetch('/api/voice/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
    .then(res => {
      if (!res.ok) throw new Error("TTS failed");
      return res.blob();
    })
    .then(blob => {
      const url = URL.createObjectURL(blob);
      currentAudio = new Audio(url);
      
      currentAudio.onended = () => {
        URL.revokeObjectURL(url);
        if (onEnd) onEnd();
      };
      
      currentAudio.onerror = () => {
        URL.revokeObjectURL(url);
        if (onEnd) onEnd();
      };

      currentAudio.play().catch(e => {
        console.error("Audio playback error:", e);
        if (onEnd) onEnd();
      });
    })
    .catch(err => {
      console.error(err);
      if (onEnd) onEnd();
    });

  return () => {
    stopSpeaking();
  };
}

export function stopSpeaking(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}
