// popup.js
const toggle = document.getElementById("toggle-tutorial");
const restartBtn = document.getElementById("restart-btn");
const infoBtn = document.getElementById("info-btn");
const modal = document.getElementById("info-modal");
const closeModal = document.querySelector(".close");

// Load state
chrome.storage.sync.get(["tutorialEnabled"], (data) => {
  toggle.checked = data.tutorialEnabled !== false;
});

toggle.onchange = function () {
  chrome.storage.sync.set({ tutorialEnabled: toggle.checked });
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
