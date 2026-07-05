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

  // Clean the text to avoid TTS reading out raw punctuation in weird ways if it falls back
  // But we need punctuation for normal TTS pacing, so we'll just remove excessive ones.
  const cleanText = text.replace(/[!]/g, '.');

  let targetLang = 'en-US';
  let ttsLocale = locale;
  
  // Auto-detect language based on characters, so it works even if app language was switched
  if (/[\u0D80-\u0DFF]/.test(cleanText)) {
    targetLang = 'si';
    ttsLocale = 'si-LK';
  } else if (/[\u0B80-\u0BFF]/.test(cleanText)) {
    targetLang = 'ta';
    ttsLocale = 'ta-LK';
  } else if (locale === 'si-LK') {
    targetLang = 'si';
  } else if (locale === 'ta-LK') {
    targetLang = 'ta';
  }

  const speakNative = (voice: SpeechSynthesisVoice | null) => {
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = ttsLocale; // Use full locale like si-LK
    if (voice) {
      utterance.voice = voice;
      window.speechSynthesis.speak(utterance);
    } else {
      // If no native voice found for Sinhala/Tamil, we MUST use Google Translate TTS 
      // otherwise the English voice will literally say "exclamation point" instead of reading Sinhala.
      if (targetLang === 'si' || targetLang === 'ta') {
        speakGoogleTranslate(cleanText, targetLang);
      } else {
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  const speakGoogleTranslate = (textToSpeak: string, langCode: string) => {
    // We split by 150 chars to be safe with Google TTS limits
    // Use [\s\S] to match newlines correctly instead of just .
    const chunks = textToSpeak.match(/[\s\S]{1,150}(?:\s|$)|[\s\S]{1,150}/g) || [textToSpeak];
    let currentChunk = 0;
    
    const playNextChunk = () => {
      if (currentChunk >= chunks.length) return;
      
      const chunkText = chunks[currentChunk].trim();
      if (!chunkText) {
        currentChunk++;
        playNextChunk();
        return;
      }

      try {
        // ttsspeed=0.3 makes the robotic voice slightly slower and "calmer"
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${langCode}&client=tw-ob&ttsspeed=0.3&q=${encodeURIComponent(chunkText)}`;
        const audio = new Audio(url);
        (window as any).currentAudio = audio;
        
        audio.onended = () => {
          currentChunk++;
          playNextChunk();
        };
        
        audio.play().catch(e => {
          console.warn("Audio play failed", e);
          // Last resort fallback
          if (window.speechSynthesis) {
            const utterance = new SpeechSynthesisUtterance(chunkText);
            utterance.lang = ttsLocale;
            window.speechSynthesis.speak(utterance);
          }
        });
      } catch (e) {
        console.error("Google TTS error", e);
      }
    };

    playNextChunk();
  };

  if (!window.speechSynthesis) {
    if (targetLang === 'si' || targetLang === 'ta') {
      speakGoogleTranslate(cleanText, targetLang);
    }
    return;
  }

  const findAndSpeak = () => {
    const voices = window.speechSynthesis.getVoices();
    let selectedVoice = null;
    
    if (targetLang === 'si') {
      selectedVoice = voices.find(v => v.lang.includes('si') || v.name.toLowerCase().includes('sinhala'));
    } else if (targetLang === 'ta') {
      selectedVoice = voices.find(v => v.lang.includes('ta') || v.name.toLowerCase().includes('tamil'));
    } else {
      selectedVoice = voices.find(v => v.name.includes('Google') && v.lang.startsWith('en')) || 
                      voices.find(v => v.lang === 'en-US');
    }
    
    speakNative(selectedVoice || null);
  };

  let voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    findAndSpeak();
  } else {
    const handleVoicesChanged = () => {
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      findAndSpeak();
    };
    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
    
    // Safety timeout in case voiceschanged never fires
    setTimeout(() => {
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      if (!(window as any).currentAudio) {
        findAndSpeak();
      }
    }, 1000);
  }
}
