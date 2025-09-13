(function () {
  let stepsConfig,
    steps,
    currentStep = 0;
  let overlayBg, tooltip, highlighted;
  let tutorialEnabled = true;

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === "restartTutorial") {
      if (steps) {
        currentStep = 0;
        showStep(currentStep);
      }
    }
  });

  chrome.storage.sync.get(["tutorialEnabled"], (data) => {
    tutorialEnabled = data.tutorialEnabled !== false;
    initTutorial();
  });

  async function initTutorial() {
    chrome.storage.local.get(["steps"], (result) => {
      stepsConfig = result.steps || {};
      const url = window.location.href;
      for (const key in stepsConfig) {
        if (url.startsWith(key)) {
          steps = stepsConfig[key];
          break;
        }
      }
      if (!steps || !Array.isArray(steps) || steps.length === 0) return;
      if (tutorialEnabled) showStep(currentStep);
    });
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
      }>Quay lại</button>
      <button class="tutorial-btn" id="tutorial-next" ${
        idx === steps.length - 1 ? "disabled" : ""
      }>Tiếp tục</button>
      <button class="tutorial-btn" id="tutorial-skip">Bỏ qua</button>
    `;
    tooltip.appendChild(btns);
    document.body.appendChild(tooltip);

    const rect = el.getBoundingClientRect();
    tooltip.style.top = `${rect.bottom + window.scrollY + 12}px`;
    tooltip.style.left = `${rect.left + window.scrollX}px`;

    btns.querySelector("#tutorial-back").onclick = () => {
      if (currentStep > 0) {
        currentStep--;
        showStep(currentStep);
      }
    };
    btns.querySelector("#tutorial-next").onclick = () => {
      if (validateStep && !validateStep(step)) {
        alert("Vui lòng thực hiện đúng hướng dẫn trước khi tiếp tục!");
        return;
      }
      if (currentStep < steps.length - 1) {
        currentStep++;
        showStep(currentStep);
      }
    };
    btns.querySelector("#tutorial-skip").onclick = removeOverlay;
  }

  function removeOverlay() {
    if (overlayBg) overlayBg.remove();
    if (tooltip) tooltip.remove();
    if (highlighted) highlighted.classList.remove("tutorial-highlight");
    overlayBg = tooltip = highlighted = null;
  }
})();
