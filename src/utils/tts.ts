export function speakText(text: string, locale: string) {
  if (typeof window === 'undefined') return;

  // Stop any currently playing audio
  if ((window as any).currentAudio) {
    (window as any).currentAudio.pause();
  }
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }

  if (!text) return;

  // Map locale to Google TTS language code
  let langCode = 'en';
  if (locale === 'si-LK') langCode = 'si';
  else if (locale === 'ta-LK') langCode = 'ta';
  else langCode = 'en';

  // For Sinhala and Tamil, native voices are often missing on desktop OS.
  // We use Google Translate TTS API for reliable voice output.
  // Split text if it's too long (Google TTS has a ~200 char limit per request)
  const chunks = text.match(/.{1,200}(\s|$)/g) || [text];
  
  let currentChunk = 0;
  
  const playNextChunk = () => {
    if (currentChunk >= chunks.length) return;
    
    const chunkText = chunks[currentChunk];
    try {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${langCode}&client=tw-ob&q=${encodeURIComponent(chunkText)}`;
      const audio = new Audio(url);
      (window as any).currentAudio = audio;
      
      audio.onended = () => {
        currentChunk++;
        playNextChunk();
      };
      
      audio.play().catch(e => {
        console.warn("Audio play failed, falling back to Web Speech API", e);
        fallbackSpeechSynthesis(text, locale);
      });
    } catch (e) {
      fallbackSpeechSynthesis(text, locale);
    }
  };

  playNextChunk();
}

function fallbackSpeechSynthesis(text: string, locale: string) {
  if (!window.speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = locale;
  window.speechSynthesis.speak(utterance);
}
