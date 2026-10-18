/**
 * FarmBridge Speech Engine: SpeechRecognition & SpeechSynthesis (TTS)
 * Robust fallback, language switching (ta-IN / en-IN), and failure diagnostics.
 */

const SpeechEngine = (function() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  const synth = window.speechSynthesis || null;

  let recognitionInstance = null;
  let isListening = false;
  let voiceRepliesEnabled = true;

  // Language configurations with fallbacks
  const LANG_CONFIG = {
    ta: {
      primary: "ta-IN",
      fallbacks: ["ta-LK", "ta-SG", "en-IN"],
      voiceLangPrefix: "ta"
    },
    en: {
      primary: "en-IN",
      fallbacks: ["en-US", "en-GB"],
      voiceLangPrefix: "en"
    }
  };

  function isSupported() {
    return !!SpeechRecognition;
  }

  function setVoiceReplies(enabled) {
    voiceRepliesEnabled = !!enabled;
    localStorage.setItem("farmbridge_voice_replies", voiceRepliesEnabled ? "true" : "false");
  }

  function getVoiceReplies() {
    const saved = localStorage.getItem("farmbridge_voice_replies");
    if (saved !== null) {
      voiceRepliesEnabled = saved === "true";
    }
    return voiceRepliesEnabled;
  }

  /**
   * Starts speech recognition with automatic fallback retry on language errors.
   */
  function startListening(currentLang, callbacks) {
    if (!SpeechRecognition) {
      if (callbacks.onError) {
        callbacks.onError({
          type: "unsupported",
          message: currentLang === "ta" ? I18N.ta.err_unsupported : I18N.en.err_unsupported
        });
      }
      return;
    }

    if (isListening && recognitionInstance) {
      try {
        recognitionInstance.stop();
      } catch (e) {}
    }

    const config = LANG_CONFIG[currentLang] || LANG_CONFIG.ta;
    let langIndex = 0;
    const languagesToTry = [config.primary, ...config.fallbacks];

    function createAndRun(targetLang) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = targetLang;

      recognition.onstart = function() {
        isListening = true;
        if (callbacks.onStart) callbacks.onStart(targetLang);
      };

      recognition.onresult = function(event) {
        let interim = "";
        let final = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcript;
          } else {
            interim += transcript;
          }
        }

        const fullText = (final || interim).trim();
        const isFinalResult = !!final;
        if (callbacks.onResult) {
          callbacks.onResult(fullText, isFinalResult);
        }
      };

      recognition.onerror = function(event) {
        const error = event.error;
        // If language not supported and we have fallbacks left, retry with next language code
        if ((error === "language-not-supported" || error === "bad-grammar") && langIndex < languagesToTry.length - 1) {
          langIndex++;
          console.warn(`Speech recognition language '${targetLang}' not supported, trying fallback '${languagesToTry[langIndex]}'`);
          createAndRun(languagesToTry[langIndex]);
          return;
        }

        let userMsg = "";
        let errorType = error;
        let actionLink = null;

        const isTa = currentLang === "ta";

        switch (error) {
          case "not-allowed":
          case "permission-denied":
            errorType = "blocked";
            userMsg = isTa ? I18N.ta.err_mic_blocked : I18N.en.err_mic_blocked;
            actionLink = {
              text: isTa ? I18N.ta.err_mic_new_tab : I18N.en.err_mic_new_tab,
              url: window.location.href
            };
            break;
          case "audio-capture":
            errorType = "no_mic";
            userMsg = isTa ? I18N.ta.err_no_mic : I18N.en.err_no_mic;
            break;
          case "network":
            errorType = "network";
            userMsg = isTa ? I18N.ta.err_no_internet : I18N.en.err_no_internet;
            break;
          case "no-speech":
            errorType = "no_speech";
            userMsg = isTa ? I18N.ta.err_nothing_heard : I18N.en.err_nothing_heard;
            break;
          default:
            errorType = error;
            userMsg = (isTa ? "குரல் பதிவு பிழை: " : "Speech recognition error: ") + error;
        }

        if (callbacks.onError) {
          callbacks.onError({
            type: errorType,
            message: userMsg,
            actionLink: actionLink,
            rawError: error
          });
        }
      };

      recognition.onend = function() {
        isListening = false;
        if (callbacks.onEnd) callbacks.onEnd();
      };

      recognitionInstance = recognition;
      try {
        recognition.start();
      } catch (err) {
        if (callbacks.onError) {
          callbacks.onError({
            type: "exception",
            message: err.message
          });
        }
      }
    }

    createAndRun(languagesToTry[langIndex]);
  }

  function stopListening() {
    if (recognitionInstance) {
      try {
        recognitionInstance.stop();
      } catch (e) {}
    }
    isListening = false;
  }

  let cachedVoices = [];
  if (synth) {
    cachedVoices = synth.getVoices() || [];
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = () => {
        cachedVoices = synth.getVoices() || [];
      };
    }
  }

  /**
   * Speaks text using SpeechSynthesis in Tamil or English.
   */
  function speak(text, lang = "ta") {
    if (!synth || !voiceRepliesEnabled || !text) return;

    try {
      synth.cancel(); // Stop any pending speech

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95; // Slightly slower for crisp farmer comprehension
      utterance.pitch = 1.0;

      const voices = (cachedVoices && cachedVoices.length > 0) ? cachedVoices : (synth.getVoices() || []);
      const prefix = lang === "ta" ? "ta" : "en";
      
      // Attempt to find language-matching voice
      const matchedVoice = voices.find(v => {
        const vl = (v.lang || "").toLowerCase();
        const vn = (v.name || "").toLowerCase();
        return vl.startsWith(prefix) || vn.includes(lang === "ta" ? "tamil" : "english");
      });

      if (matchedVoice) {
        utterance.voice = matchedVoice;
        utterance.lang = matchedVoice.lang;
      } else {
        utterance.lang = lang === "ta" ? "ta-IN" : "en-IN";
      }

      synth.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis error:", e);
    }
  }

  function stopSpeaking() {
    if (synth) {
      try {
        synth.cancel();
      } catch (e) {}
    }
  }

  return {
    isSupported,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    setVoiceReplies,
    getVoiceReplies,
    isListening: () => isListening
  };
})();
