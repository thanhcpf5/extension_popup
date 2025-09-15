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

    // Language detection patterns (Vietnamese only for this extension)
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
          "bước",
          "hướng",
          "dẫn",
          "tiếp",
          "tục",
          "quay",
          "lại",
          "bỏ",
          "qua",
          "đọc",
          "nghe",
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

    // Cache Vietnamese voices with expanded search criteria
    const vietnameseVoices = voices.filter(
      (voice) =>
        voice.lang.startsWith("vi") ||
        voice.lang.includes("VN") ||
        voice.lang.includes("vi-") ||
        voice.name.toLowerCase().includes("vietnamese") ||
        voice.name.toLowerCase().includes("vietnam") ||
        voice.name.toLowerCase().includes("tiếng việt")
    );

    // If no Vietnamese voices found, try to find any voice that might work with Vietnamese
    if (vietnameseVoices.length === 0) {
      console.warn(
        "No Vietnamese voices found, searching for alternative voices"
      );

      // Look for Google or Microsoft voices that might support Vietnamese
      const alternativeVoices = voices.filter(
        (voice) =>
          voice.name.includes("Google") ||
          voice.name.includes("Microsoft") ||
          voice.name.includes("Natural") ||
          voice.localService
      );

      if (alternativeVoices.length > 0) {
        vietnameseVoices.push(...alternativeVoices.slice(0, 3)); // Take first 3 as backup
      }
    }

    this.voiceCache.set("vi", vietnameseVoices);

    console.log(
      "TTS: Cached Vietnamese voices:",
      vietnameseVoices.map((v) => `${v.name} (${v.lang})`)
    );

    if (vietnameseVoices.length === 0) {
      console.warn("WARNING: No Vietnamese voices available on this system");
    }
  }

  detectLanguage(text) {
    // Always return Vietnamese for this extension
    return "vi";
  }

  selectVoice(language) {
    // For this extension, always try to use Vietnamese voices
    const vietnameseVoices = this.voiceCache.get("vi");
    if (vietnameseVoices && vietnameseVoices.length > 0) {
      // Priority order for Vietnamese voices:
      // 1. Google Vietnamese voices
      // 2. Microsoft Vietnamese voices
      // 3. Any voice with Vietnamese in the name
      // 4. Local service voices
      // 5. First available Vietnamese voice

      const googleVoice = vietnameseVoices.find(
        (voice) =>
          voice.name.includes("Google") &&
          (voice.lang.startsWith("vi") || voice.lang.includes("VN"))
      );
      if (googleVoice) {
        console.log("Selected Google Vietnamese voice:", googleVoice.name);
        return googleVoice;
      }

      const microsoftVoice = vietnameseVoices.find(
        (voice) =>
          voice.name.includes("Microsoft") &&
          (voice.lang.startsWith("vi") || voice.lang.includes("VN"))
      );
      if (microsoftVoice) {
        console.log(
          "Selected Microsoft Vietnamese voice:",
          microsoftVoice.name
        );
        return microsoftVoice;
      }

      const namedVietnameseVoice = vietnameseVoices.find(
        (voice) =>
          voice.name.toLowerCase().includes("vietnamese") ||
          voice.name.toLowerCase().includes("vietnam")
      );
      if (namedVietnameseVoice) {
        console.log(
          "Selected named Vietnamese voice:",
          namedVietnameseVoice.name
        );
        return namedVietnameseVoice;
      }

      const localVoice = vietnameseVoices.find((voice) => voice.localService);
      if (localVoice) {
        console.log("Selected local Vietnamese voice:", localVoice.name);
        return localVoice;
      }

      console.log(
        "Selected first available Vietnamese voice:",
        vietnameseVoices[0].name
      );
      return vietnameseVoices[0];
    }

    // Fallback: try to find any Vietnamese voice in all available voices
    const allVoices = window.speechSynthesis.getVoices();
    const fallbackVietnameseVoice = allVoices.find(
      (voice) =>
        voice.lang.startsWith("vi") ||
        voice.lang.includes("VN") ||
        voice.name.toLowerCase().includes("vietnamese")
    );

    if (fallbackVietnameseVoice) {
      console.log(
        "Selected fallback Vietnamese voice:",
        fallbackVietnameseVoice.name
      );
      return fallbackVietnameseVoice;
    }

    // Last resort: use default voice but warn user
    console.warn("No Vietnamese voice found, using default voice");
    return allVoices.find((voice) => voice.default) || allVoices[0];
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

      // Force Vietnamese language for this extension
      const detectedLanguage = "vi"; // Always use Vietnamese

      // Create utterance
      const utterance = new SpeechSynthesisUtterance(text);

      // Configure utterance
      utterance.rate = Math.max(0.1, Math.min(10, rate));
      utterance.pitch = Math.max(0, Math.min(2, pitch));
      utterance.volume = Math.max(0, Math.min(1, volume));

      // Always set Vietnamese language
      utterance.lang = "vi-VN";

      // Select appropriate Vietnamese voice
      const selectedVoice = this.selectVoice("vi");
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        console.log(
          `TTS: Using voice: ${selectedVoice.name} (${selectedVoice.lang})`
        );
      } else {
        console.warn("TTS: No Vietnamese voice selected, using default");
      }

      // Store reference
      this.currentUtterance = utterance;

      // Set up event handlers
      return new Promise((resolve, reject) => {
        utterance.onstart = () => {
          console.log(`TTS: Started speaking Vietnamese text`);
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
   * Convenience method for Vietnamese text (redundant since all text is treated as Vietnamese)
   * @param {string} text
   * @param {Object} options
   * @returns {Promise<boolean>}
   */
  speakVietnamese(text, options = {}) {
    return this.speak(text, options); // Language will be forced to Vietnamese anyway
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
