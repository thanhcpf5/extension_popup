// popup.js
const toggle = document.getElementById("toggle-tutorial");
const speechToggle = document.getElementById("speech-toggle");
const testVoiceBtn = document.getElementById("test-voice");
const restartBtn = document.getElementById("restart-btn");
const infoBtn = document.getElementById("info-btn");
const modal = document.getElementById("info-modal");
const closeModal = document.querySelector(".close");

// Load state
chrome.storage.sync.get(["tutorialEnabled", "speechEnabled"], (data) => {
  toggle.checked = data.tutorialEnabled !== false;
  speechToggle.checked = data.speechEnabled !== false;
});

toggle.onchange = function () {
  chrome.storage.sync.set({ tutorialEnabled: toggle.checked });
};

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

restartBtn.onclick = function () {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { action: "restartTutorial" });
  });
};

infoBtn.onclick = function () {
  modal.style.display = "block";
};
closeModal.onclick = function () {
  modal.style.display = "none";
};
window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
};
