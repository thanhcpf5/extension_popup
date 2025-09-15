// Text-to-Speech Module
// A reusable TTS module for Chrome extensions with Vietnamese and multilingual support

class TextToSpeechModule {
  constructor(config = {}) {
    this.isEnabled = config.enabled !== false; // Default enabled
    this.rate = config.rate || 0.9;
    this.pitch = config.pitch || 1.0;
    this.volume = config.volume || 0.8;
    this.currentUtterance = null;
    this.voiceCache = new Map();
    this.isInitialized = false;

    // Language detection patterns
    this.languagePatterns = {
      vi: {
        diacritics:
          /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]/,
        words: [
          "và",
          "với",
          "của",
          "trong",
          "để",
          "cho",
          "khi",
          "đã",
          "sẽ",
          "có",
          "là",
          "một",
          "này",
          "đó",
          "nhập",
          "email",
          "tên",
          "họ",
          "địa",
          "chỉ",
          "số",
          "điện",
          "thoại",
          "thành",
          "phố",
          "gửi",
          "đăng",
          "ký",
          "bắt",
          "buộc",
          "trường",
          "biểu",
          "mẫu",
          "thông",
          "tin",
          "chọn",
          "giới",
          "thiệu",
        ],
      },
      en: {
        words: [
          "the",
          "and",
          "or",
          "but",
          "in",
          "on",
          "at",
          "to",
          "for",
          "of",
          "with",
          "by",
          "this",
          "that",
          "enter",
          "click",
          "submit",
          "form",
          "field",
          "required",
          "email",
          "name",
          "address",
          "phone",
          "select",
        ],
      },
    };

    this.init();
  }

  async init() {
    if (this.isInitialized) return;

    try {
      // Wait for voices to be loaded
      if (window.speechSynthesis) {
        await this.waitForVoices();
        await this.cacheVoices();
        this.isInitialized = true;
        console.log("TTS Module initialized successfully");
      } else {
        console.warn("Speech Synthesis not supported in this browser");
      }
    } catch (error) {
      console.error("TTS Module initialization failed:", error);
    }
  }

  waitForVoices() {
    return new Promise((resolve) => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        resolve(voices);
      } else {
        window.speechSynthesis.onvoiceschanged = () => {
          resolve(window.speechSynthesis.getVoices());
        };
      }
    });
  }

  async cacheVoices() {
    const voices = window.speechSynthesis.getVoices();

    // Cache Vietnamese voices
    const vietnameseVoices = voices.filter(
      (voice) =>
        voice.lang.startsWith("vi") ||
        voice.lang.includes("VN") ||
        voice.name.toLowerCase().includes("vietnamese")
    );
    this.voiceCache.set("vi", vietnameseVoices);

    // Cache English voices
    const englishVoices = voices.filter(
      (voice) =>
        voice.lang.startsWith("en") &&
        (voice.name.includes("Google") ||
          voice.name.includes("Microsoft") ||
          voice.default ||
          voice.localService)
    );
    this.voiceCache.set("en", englishVoices);

    // Cache other languages
    const otherLanguages = ["zh", "ja", "ko", "fr", "de", "es", "it"];
    otherLanguages.forEach((lang) => {
      const langVoices = voices.filter((voice) => voice.lang.startsWith(lang));
      if (langVoices.length > 0) {
        this.voiceCache.set(lang, langVoices);
      }
    });

    console.log(
      "TTS: Cached voices for languages:",
      Array.from(this.voiceCache.keys())
    );
  }

  detectLanguage(text) {
    if (!text || typeof text !== "string") return "en";

    const lowerText = text.toLowerCase();
    const words = lowerText.split(/\s+/).filter((word) => word.length > 1);

    // Check for Vietnamese
    const viPattern = this.languagePatterns.vi;
    if (viPattern.diacritics.test(text)) return "vi";

    const viWordCount = viPattern.words.filter((word) =>
      lowerText.includes(word)
    ).length;
    if (viWordCount >= 2 || viWordCount / words.length > 0.15) return "vi";

    // Check for English
    const enPattern = this.languagePatterns.en;
    const enWordCount = enPattern.words.filter((word) =>
      lowerText.includes(word)
    ).length;
    if (enWordCount >= 2 || enWordCount / words.length > 0.2) return "en";

    // Default to English
    return "en";
  }

  selectVoice(language) {
    const cachedVoices = this.voiceCache.get(language);
    if (cachedVoices && cachedVoices.length > 0) {
      // Prefer Google/Microsoft voices, then local service, then default
      return (
        cachedVoices.find((voice) => voice.name.includes("Google")) ||
        cachedVoices.find((voice) => voice.name.includes("Microsoft")) ||
        cachedVoices.find((voice) => voice.localService) ||
        cachedVoices[0]
      );
    }

    // Fallback to any available voice for the language
    const allVoices = window.speechSynthesis.getVoices();
    return allVoices.find((voice) => voice.lang.startsWith(language));
  }

  /**
   * Main method to speak text
   * @param {string} text - Text to speak
   * @param {Object} options - Configuration options
   * @param {string} options.priority - 'high' to interrupt current speech, 'normal' to queue
   * @param {string} options.language - Force specific language ('vi', 'en', etc.)
   * @param {number} options.rate - Speech rate override (0.1 - 10)
   * @param {number} options.pitch - Speech pitch override (0 - 2)
   * @param {number} options.volume - Speech volume override (0 - 1)
   * @param {Function} options.onStart - Callback when speech starts
   * @param {Function} options.onEnd - Callback when speech ends
   * @param {Function} options.onError - Callback on error
   * @returns {Promise<boolean>} - Success status
   */
  async speak(text, options = {}) {
    if (!this.isEnabled || !text || !window.speechSynthesis) {
      return false;
    }

    // Ensure TTS is initialized
    if (!this.isInitialized) {
      await this.init();
    }

    const {
      priority = "normal",
      language = null,
      rate = this.rate,
      pitch = this.pitch,
      volume = this.volume,
      onStart = null,
      onEnd = null,
      onError = null,
    } = options;

    try {
      // Stop current speech if high priority
      if (priority === "high") {
        this.stop();
      } else if (window.speechSynthesis.speaking) {
        return false; // Don't interrupt for normal priority
      }

      // Detect language if not specified
      const detectedLanguage = language || this.detectLanguage(text);

      // Create utterance
      const utterance = new SpeechSynthesisUtterance(text);

      // Configure utterance
      utterance.rate = Math.max(0.1, Math.min(10, rate));
      utterance.pitch = Math.max(0, Math.min(2, pitch));
      utterance.volume = Math.max(0, Math.min(1, volume));
      utterance.lang =
        detectedLanguage === "vi" ? "vi-VN" : `${detectedLanguage}-US`;

      // Select appropriate voice
      const selectedVoice = this.selectVoice(detectedLanguage);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      // Store reference
      this.currentUtterance = utterance;

      // Set up event handlers
      return new Promise((resolve, reject) => {
        utterance.onstart = () => {
          console.log(`TTS: Started speaking in ${detectedLanguage}`);
          if (onStart) onStart();
        };

        utterance.onend = () => {
          console.log("TTS: Finished speaking");
          this.currentUtterance = null;
          if (onEnd) onEnd();
          resolve(true);
        };

        utterance.onerror = (event) => {
          console.error("TTS Error:", event.error);
          this.currentUtterance = null;
          if (onError) onError(event.error);
          reject(new Error(event.error));
        };

        // Start speaking
        window.speechSynthesis.speak(utterance);
      });
    } catch (error) {
      console.error("TTS: Speech failed:", error);
      if (options.onError) options.onError(error);
      return false;
    }
  }

  /**
   * Stop current speech
   */
  stop() {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      this.currentUtterance = null;
    }
  }

  /**
   * Pause current speech
   */
  pause() {
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
    }
  }

  /**
   * Resume paused speech
   */
  resume() {
    if (window.speechSynthesis && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  }

  /**
   * Check if currently speaking
   * @returns {boolean}
   */
  isSpeaking() {
    return window.speechSynthesis ? window.speechSynthesis.speaking : false;
  }

  /**
   * Check if currently paused
   * @returns {boolean}
   */
  isPaused() {
    return window.speechSynthesis ? window.speechSynthesis.paused : false;
  }

  /**
   * Enable or disable TTS
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    if (!enabled) {
      this.stop();
    }
  }

  /**
   * Get current configuration
   * @returns {Object}
   */
  getConfig() {
    return {
      enabled: this.isEnabled,
      rate: this.rate,
      pitch: this.pitch,
      volume: this.volume,
      isInitialized: this.isInitialized,
      availableLanguages: Array.from(this.voiceCache.keys()),
    };
  }

  /**
   * Update configuration
   * @param {Object} config
   */
  updateConfig(config) {
    if (config.hasOwnProperty("enabled")) this.isEnabled = config.enabled;
    if (config.hasOwnProperty("rate")) this.rate = config.rate;
    if (config.hasOwnProperty("pitch")) this.pitch = config.pitch;
    if (config.hasOwnProperty("volume")) this.volume = config.volume;
  }

  /**
   * Get available voices for a language
   * @param {string} language
   * @returns {Array}
   */
  getVoicesForLanguage(language) {
    return this.voiceCache.get(language) || [];
  }

  /**
   * Convenience method for Vietnamese text
   * @param {string} text
   * @param {Object} options
   * @returns {Promise<boolean>}
   */
  speakVietnamese(text, options = {}) {
    return this.speak(text, { ...options, language: "vi" });
  }

  /**
   * Convenience method for English text
   * @param {string} text
   * @param {Object} options
   * @returns {Promise<boolean>}
   */
  speakEnglish(text, options = {}) {
    return this.speak(text, { ...options, language: "en" });
  }

  /**
   * Batch speak multiple texts with delays
   * @param {Array<string>} texts
   * @param {Object} options
   * @param {number} options.delay - Delay between texts in ms
   * @returns {Promise<boolean[]>}
   */
  async speakBatch(texts, options = {}) {
    const { delay = 500, ...speechOptions } = options;
    const results = [];

    for (let i = 0; i < texts.length; i++) {
      try {
        const result = await this.speak(texts[i], speechOptions);
        results.push(result);

        // Add delay between texts (except for the last one)
        if (i < texts.length - 1 && delay > 0) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      } catch (error) {
        results.push(false);
      }
    }

    return results;
  }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = TextToSpeechModule;
} else if (typeof window !== "undefined") {
  window.TextToSpeechModule = TextToSpeechModule;
}
