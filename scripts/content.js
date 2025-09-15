(function () {
  let stepsConfig,
    steps,
    currentStep = 0;
  let overlayBg, tooltip, highlighted;
  let tutorialEnabled = true;
  let speechEnabled = true;
  let tts = null;

  // Initialize TTS module
  async function initTTS() {
    try {
      tts = new TextToSpeechModule({
        enabled: speechEnabled,
        rate: 0.9,
        pitch: 1.0,
        volume: 0.8,
      });

      await tts.init();
      console.log("TTS initialized successfully");
    } catch (error) {
      console.warn("TTS initialization failed:", error);
      tts = null;
    }
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === "restartTutorial") {
      if (steps) {
        currentStep = 0;
        showStep(currentStep);
      }
    } else if (msg.action === "toggleSpeech") {
      speechEnabled = msg.enabled;
      if (tts) {
        tts.setEnabled(speechEnabled);
      }
      sendResponse({ success: true });
    } else if (msg.action === "testVoice") {
      if (tts && speechEnabled) {
        tts.speak(msg.text);
      }
      sendResponse({ success: true });
    }
  });

  chrome.storage.sync.get(["tutorialEnabled", "speechEnabled"], (data) => {
    tutorialEnabled = data.tutorialEnabled !== false;
    speechEnabled = data.speechEnabled !== false;
    initTutorial();
    initTTS();
  });

  async function initTutorial() {
    try {
      const res = await fetch(chrome.runtime.getURL("steps.json"));
      stepsConfig = await res.json();
    } catch (e) {
      console.error("Failed to load steps.json", e);
      return;
    }
    const url = window.location.href;
    for (const key in stepsConfig) {
      if (url.startsWith(key)) {
        steps = stepsConfig[key];
        break;
      }
    }
    if (!steps || !Array.isArray(steps) || steps.length === 0) return;
    if (tutorialEnabled) showStep(currentStep);
  }

  function showStep(idx) {
    removeOverlay();
    const step = steps[idx];
    if (!step) return;
    const el = document.querySelector(step.selector);
    if (!el) return;

    overlayBg = document.createElement("div");
    overlayBg.className = "tutorial-overlay-bg";
    document.body.appendChild(overlayBg);

    el.classList.add("tutorial-highlight");
    highlighted = el;

    tooltip = document.createElement("div");
    tooltip.className = "tutorial-tooltip";
    tooltip.innerHTML = `<div>${step.text}</div>`;

    const btns = document.createElement("div");
    btns.className = "tutorial-buttons";
    btns.innerHTML = `
      <button class="tutorial-btn" id="tutorial-back" ${
        idx === 0 ? "disabled" : ""
      }>Quay lại</button>
      <button class="tutorial-btn" id="tutorial-next" ${
        idx === steps.length - 1 ? "disabled" : ""
      }>Tiếp tục</button>
      <button class="tutorial-btn" id="tutorial-speak">🔊 Đọc</button>
      <button class="tutorial-btn" id="tutorial-skip">Bỏ qua</button>
    `;
    tooltip.appendChild(btns);
    document.body.appendChild(tooltip);

    const rect = el.getBoundingClientRect();
    tooltip.style.top = `${rect.bottom + window.scrollY + 12}px`;
    tooltip.style.left = `${rect.left + window.scrollX}px`;

    // Auto-speak the step if TTS is enabled
    if (tts && speechEnabled) {
      speakStepText(step);
    }

    btns.querySelector("#tutorial-back").onclick = () => {
      if (tts) tts.stop(); // Stop current speech
      if (currentStep > 0) {
        currentStep--;
        showStep(currentStep);
      }
    };
    btns.querySelector("#tutorial-next").onclick = () => {
      if (tts) tts.stop(); // Stop current speech

      // Check if validateStep function exists and validate
      if (typeof validateStep === "function" && !validateStep(step)) {
        if (tts && speechEnabled) {
          tts.speak("Vui lòng thực hiện đúng hướng dẫn trước khi tiếp tục!", {
            priority: "high",
          });
        } else {
          alert("Vui lòng thực hiện đúng hướng dẫn trước khi tiếp tục!");
        }
        return;
      }

      if (currentStep < steps.length - 1) {
        currentStep++;
        showStep(currentStep);
      }
    };
    btns.querySelector("#tutorial-speak").onclick = () => {
      speakStepText(step);
    };
    btns.querySelector("#tutorial-skip").onclick = () => {
      if (tts) tts.stop(); // Stop current speech
      removeOverlay();
    };
  }

  async function speakStepText(step) {
    if (!tts || !speechEnabled) {
      console.log("TTS not available or disabled");
      return;
    }

    try {
      // Use the original step text without adding duplicate step numbering
      let speechText = step.text;

      // Add contextual information based on the step
      if (step.selector) {
        const element = document.querySelector(step.selector);
        if (element) {
          const tagName = element.tagName.toLowerCase();
          if (tagName === "input" || tagName === "textarea") {
            const inputType = element.type || "text";
            if (inputType === "email") {
              speechText += ". Đây là trường nhập email.";
            } else if (inputType === "password") {
              speechText += ". Đây là trường nhập mật khẩu.";
            } else if (inputType === "text") {
              speechText += ". Đây là trường nhập văn bản.";
            }
          } else if (tagName === "button") {
            speechText += ". Đây là một nút bấm.";
          } else if (tagName === "select") {
            speechText += ". Đây là menu lựa chọn.";
          }
        }
      }

      // Add step position information
      // if (steps.length > 1) {
      //   speechText += ` Đây là bước ${currentStep + 1} trong tổng số ${
      //     steps.length
      //   } bước.`;
      // }

      await tts.speak(speechText, {
        priority: "high",
        onStart: () => {
          console.log("Started speaking step text");
          // Update speak button to show it's speaking
          const speakBtn = document.getElementById("tutorial-speak");
          if (speakBtn) {
            speakBtn.textContent = "⏸️ Dừng";
            speakBtn.onclick = () => {
              if (tts) {
                tts.stop();
                speakBtn.textContent = "🔊 Đọc";
                speakBtn.onclick = () => speakStepText(step);
              }
            };
          }
        },
        onEnd: () => {
          console.log("Finished speaking step text");
          // Reset speak button
          const speakBtn = document.getElementById("tutorial-speak");
          if (speakBtn) {
            speakBtn.textContent = "🔊 Đọc";
            speakBtn.onclick = () => speakStepText(step);
          }
        },
        onError: (error) => {
          console.error("TTS error:", error);
          // Reset speak button
          const speakBtn = document.getElementById("tutorial-speak");
          if (speakBtn) {
            speakBtn.textContent = "🔊 Đọc";
            speakBtn.onclick = () => speakStepText(step);
          }
        },
      });
    } catch (error) {
      console.error("Failed to speak step text:", error);
    }
  }

  function removeOverlay() {
    if (tts) tts.stop(); // Stop any ongoing speech
    if (overlayBg) overlayBg.remove();
    if (tooltip) tooltip.remove();
    if (highlighted) highlighted.classList.remove("tutorial-highlight");
    overlayBg = tooltip = highlighted = null;
  }
})();
