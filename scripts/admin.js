// If running in browser, ensure your HTML includes: <script type="module" src="scripts/admin.js"></script>
import { CONFIG } from "../config.js";

const targetUrlInput = document.getElementById("target-url");
const scanDomBtn = document.getElementById("scan-dom-btn");
const stepsTableBody = document.querySelector("#steps-table tbody");
const addStepBtn = document.getElementById("add-step-btn");
const saveBtn = document.getElementById("save-btn");

let steps = [];
let currentUrl = "";

// Render steps in table
function renderSteps() {
  stepsTableBody.innerHTML = "";
  steps.forEach((step, idx) => {
    const row = document.createElement("tr");
    // Selector cell
    const selectorCell = document.createElement("td");
    const selectorInput = document.createElement("input");
    selectorInput.value = step.selector;
    selectorInput.oninput = (e) => {
      steps[idx].selector = e.target.value;
    };
    selectorCell.appendChild(selectorInput);
    row.appendChild(selectorCell);
    // Text cell
    const textCell = document.createElement("td");
    const textInput = document.createElement("input");
    textInput.value = step.text;
    textInput.oninput = (e) => {
      steps[idx].text = e.target.value;
    };
    textCell.appendChild(textInput);
    row.appendChild(textCell);
    // Validate cell (hidden, but editable for future features)
    // If you want to show, add a column in table header and here
    // Actions cell
    const actionsCell = document.createElement("td");
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.onclick = () => {
      steps.splice(idx, 1);
      renderSteps();
    };
    actionsCell.appendChild(deleteBtn);
    row.appendChild(actionsCell);
    stepsTableBody.appendChild(row);
  });
}

// Add new step
addStepBtn.onclick = () => {
  steps.push({ selector: "", text: "", validate: "" });
  renderSteps();
};

// Modular AI API call for future extensibility
async function callAIAPI(url, dom) {
  // Gửi DOM tới OpenAI API để sinh bước hướng dẫn
  const endpoint = "https://api.openai.com/v1/chat/completions";
  const apiKey = CONFIG.OPENAI_KEY; // Thay bằng API key thực tế
  const prompt = `Hãy phân tích DOM sau và sinh ra các bước hướng dẫn dạng JSON: {\"url\": [ { \"selector\": \"#element1\", \"text\": \"Step 1: ...\", \"validate\": \"#element1\" }, ... ] }\nDOM: ${dom}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Bạn là trợ lý AI giúp sinh các bước hướng dẫn từ DOM.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 1024,
      temperature: 0.2,
    }),
  });
  const data = await response.json();
  // Trích xuất JSON từ response
  try {
    const content = data.choices[0].message.content;
    return JSON.parse(content);
  } catch (e) {
    throw new Error("Không thể phân tích kết quả từ OpenAI API");
  }
}

// Scan DOM with AI
scanDomBtn.onclick = async () => {
  const url = targetUrlInput.value.trim();
  if (!url) return alert("Please enter a target URL.");
  currentUrl = url;
  // Get DOM from content script
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript(
      {
        target: { tabId: tabs[0].id },
        func: () => document.documentElement.outerHTML,
      },
      async (results) => {
        if (!results || !results[0] || !results[0].result)
          return alert("Failed to get DOM.");
        const dom = results[0].result;
        try {
          const data = await callAIAPI(url, dom);
          steps = data[url] || [];
          renderSteps();
        } catch (err) {
          alert("AI API error: " + err.message);
        }
      }
    );
  });
};

// Save steps to chrome.storage.local
saveBtn.onclick = () => {
  if (!currentUrl) return alert("No target URL set.");
  chrome.storage.local.get(["steps"], (result) => {
    const stepsObj = result.steps || {};
    stepsObj[currentUrl] = steps;
    chrome.storage.local.set({ steps: stepsObj }, () => {
      alert("Steps saved!");
    });
  });
};

// Initial render
renderSteps();
