// popup.js
const toggle = document.getElementById("toggle-tutorial");
const speechToggle = document.getElementById("toggle-speech");
const testVoiceBtn = document.getElementById("test-speech-btn");
const restartBtn = document.getElementById("restart-btn");
const infoBtn = document.getElementById("info-btn");
const modal = document.getElementById("info-modal");
const closeModal = document.querySelector(".close");

// Load state
chrome.storage.sync.get(["tutorialEnabled", "speechEnabled"], (data) => {
  if (toggle) {
    toggle.checked = data.tutorialEnabled !== false;
  }

  if (speechToggle) {
    // Enable speech by default - only disable if explicitly set to false
    speechToggle.checked =
      data.speechEnabled === undefined ? true : data.speechEnabled;
  }

  // If this is the first time, set speechEnabled to true in storage
  if (data.speechEnabled === undefined) {
    chrome.storage.sync.set({ speechEnabled: true });
  }
});

if (toggle) {
  toggle.onchange = function () {
    chrome.storage.sync.set({ tutorialEnabled: toggle.checked });
  };
}

if (speechToggle) {
  speechToggle.onchange = function () {
    chrome.storage.sync.set({ speechEnabled: speechToggle.checked });
    // Send message to content script to update speech settings
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "toggleSpeech",
        enabled: speechToggle.checked,
      });
    });
  };
}

if (testVoiceBtn) {
  testVoiceBtn.onclick = function () {
    const testText =
      "Chào mừng bạn đến với hướng dẫn sử dụng website dịch vụ công Bộ Công An. Tôi sẽ hướng dẫn bạn từng bước một cách dễ hiểu và chi tiết.";
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "testVoice",
        text: testText,
      });
    });
  };
}

if (restartBtn) {
  restartBtn.onclick = function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "restartTutorial" });
    });
  };
}

if (infoBtn && modal) {
  infoBtn.onclick = function () {
    modal.style.display = "block";
  };
}

if (closeModal && modal) {
  closeModal.onclick = function () {
    modal.style.display = "none";
  };

  window.onclick = function (event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  };
}
