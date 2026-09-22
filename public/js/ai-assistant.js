let aiChatHistory = [];
let aiIsSending = false;


function getAIUser() {
  const storedUser =
    localStorage.getItem("user") ||
    localStorage.getItem("smartcoop_user");

  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser);
  } catch (error) {
    return null;
  }
}


function getAIStorageKey() {
  const user = getAIUser();

  const userId =
    user?.UserID ||
    user?.userId ||
    user?.id ||
    "guest";

  return `smartcoop_ai_chat_${userId}`;
}


function getWelcomeMessage() {
  return `
    <div class="ai-message bot">

      <div class="ai-message-avatar">
        <i data-lucide="bot"></i>
      </div>

      <div class="ai-message-body">

        <div class="ai-message-bubble">

          <strong>
            Hello! I'm SmartCoop AI.
          </strong>

          <p>
            I can help you with poultry breeds,
            coop planning, feeding, health management,
            farm costs, and general poultry care.
          </p>

          <p>
            Choose a suggested question or type your
            own question below.
          </p>

        </div>

        <span class="ai-message-time">
          Ready to help
        </span>

      </div>

    </div>
  `;
}


function loadAIChat() {
  const container =
    document.getElementById(
      "chatMessages"
    );

  if (!container) return;

  try {
    const saved =
      localStorage.getItem(
        getAIStorageKey()
      );

    aiChatHistory =
      saved
        ? JSON.parse(saved)
        : [];

    if (
      !Array.isArray(
        aiChatHistory
      )
    ) {
      aiChatHistory = [];
    }

  } catch (error) {
    aiChatHistory = [];
  }

  renderAIChat();
}


function saveAIChat() {
  localStorage.setItem(
    getAIStorageKey(),
    JSON.stringify(
      aiChatHistory
    )
  );
}


function renderAIChat() {
  const container =
    document.getElementById(
      "chatMessages"
    );

  if (!container) return;

  if (
    aiChatHistory.length === 0
  ) {
    container.innerHTML =
      getWelcomeMessage();

    refreshAIIcons();

    return;
  }

  container.innerHTML =
    getWelcomeMessage();

  aiChatHistory.forEach(
    item => {

      container.insertAdjacentHTML(
        "beforeend",
        createAIMessageHTML(
          "user",
          item.message,
          item.createdAt
        )
      );

      container.insertAdjacentHTML(
        "beforeend",
        createAIMessageHTML(
          "bot",
          item.reply,
          item.createdAt
        )
      );

    }
  );

  refreshAIIcons();

  scrollAIChatToBottom();
}


function createAIMessageHTML(
  type,
  text,
  createdAt
) {
  const safeText =
    formatAIMessage(text);

  const time =
    formatAIMessageTime(
      createdAt
    );

  if (type === "user") {
    return `
      <div class="ai-message user">

        <div class="ai-message-body">

          <div class="ai-message-bubble">
            ${safeText}
          </div>

          <span class="ai-message-time">
            ${time}
          </span>

        </div>

      </div>
    `;
  }

  return `
    <div class="ai-message bot">

      <div class="ai-message-avatar">
        <i data-lucide="bot"></i>
      </div>

      <div class="ai-message-body">

        <div class="ai-message-bubble">
          ${safeText}
        </div>

        <span class="ai-message-time">
          ${time}
        </span>

      </div>

    </div>
  `;
}


function addAIMessage(
  type,
  text,
  createdAt =
    new Date().toISOString()
) {
  const container =
    document.getElementById(
      "chatMessages"
    );

  if (!container) return;

  container.insertAdjacentHTML(
    "beforeend",
    createAIMessageHTML(
      type,
      text,
      createdAt
    )
  );

  refreshAIIcons();

  scrollAIChatToBottom();
}


async function sendAIMessage() {
  if (aiIsSending) return;

  const input =
    document.getElementById(
      "aiInput"
    );

  const sendButton =
    document.getElementById(
      "aiSendBtn"
    );

  if (!input) return;

  const message =
    input.value.trim();

  if (!message) return;


  const user =
    getAIUser();

  const userId =
    user?.UserID ||
    user?.userId ||
    user?.id ||
    null;


  aiIsSending = true;

  input.value = "";

  updateAICharacterCount();

  resizeAIInput();

  addAIMessage(
    "user",
    message
  );

  showAITyping();


  if (sendButton) {
    sendButton.disabled = true;
  }

  input.disabled = true;


  try {

    const response =
      await fetch(
        "/api/ai-assistant/chat",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              userId,
              message,

              history:
                aiChatHistory
                  .slice(-10)
            })
        }
      );


    const result =
      await response.json();


    hideAITyping();


    if (
      response.status === 429
    ) {

      showAIUpgradePopup(
        result.message ||
        "You have used all 5 free AI Assistant questions for today. Upgrade to Premium for unlimited AI assistance."
      );

      return;
    }


    if (
      !response.ok ||
      !result.success
    ) {

      throw new Error(
        result.message ||
        "SmartCoop AI is unavailable."
      );

    }


    const reply =
      result.reply ||
      "I wasn't able to generate a response.";


    const createdAt =
      new Date()
        .toISOString();


    aiChatHistory.push({
      message,
      reply,
      createdAt
    });


    saveAIChat();


    addAIMessage(
      "bot",
      reply,
      createdAt
    );


} catch (error) {

  console.error(
    "AI Assistant Error:",
    error
  );

  hideAITyping();

  addAIMessage(
    "bot",
    "Sorry, SmartCoop AI Assistant is not available right now. Please try again later."
  );



  } finally {

    aiIsSending = false;

    input.disabled = false;


    if (sendButton) {
      sendButton.disabled = false;
    }


    input.focus();
  }
}


function askSuggested(
  question
) {
  const input =
    document.getElementById(
      "aiInput"
    );

  if (!input) return;

  input.value = question;

  updateAICharacterCount();

  resizeAIInput();

  sendAIMessage();
}


function showAITyping() {
  const indicator =
    document.getElementById(
      "aiTypingIndicator"
    );

  if (!indicator) return;

  indicator.classList.remove(
    "hidden"
  );

  refreshAIIcons();

  scrollAIChatToBottom();
}


function hideAITyping() {
  const indicator =
    document.getElementById(
      "aiTypingIndicator"
    );

  if (!indicator) return;

  indicator.classList.add(
    "hidden"
  );
}


function clearAIChat() {
  if (
    aiChatHistory.length === 0
  ) {
    return;
  }

  const confirmed =
    confirm(
      "Clear your SmartCoop AI conversation?"
    );

  if (!confirmed) return;

  aiChatHistory = [];

  localStorage.removeItem(
    getAIStorageKey()
  );

  renderAIChat();
}


function setupAIInput() {
  const input =
    document.getElementById(
      "aiInput"
    );

  if (!input) return;

  input.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Enter" &&
        !event.shiftKey
      ) {

        event.preventDefault();

        sendAIMessage();

      }

    }
  );


  input.addEventListener(
    "input",
    () => {

      updateAICharacterCount();

      resizeAIInput();

    }
  );


  updateAICharacterCount();

  resizeAIInput();
}


function updateAICharacterCount() {
  const input =
    document.getElementById(
      "aiInput"
    );

  const counter =
    document.getElementById(
      "aiCharacterCount"
    );

  if (
    !input ||
    !counter
  ) {
    return;
  }

  counter.textContent =
    `${input.value.length} / 1000`;
}


function resizeAIInput() {
  const input =
    document.getElementById(
      "aiInput"
    );

  if (!input) return;

  input.style.height =
    "auto";

  input.style.height =
    `${Math.min(
      input.scrollHeight,
      110
    )}px`;
}


function scrollAIChatToBottom() {
  const container =
    document.getElementById(
      "chatMessages"
    );

  if (!container) return;

  setTimeout(
    () => {

      container.scrollTop =
        container.scrollHeight;

    },
    50
  );
}


function formatAIMessageTime(
  dateValue
) {
  const date =
    dateValue
      ? new Date(dateValue)
      : new Date();

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return date
    .toLocaleTimeString(
      "en-US",
      {
        hour:
          "numeric",

        minute:
          "2-digit"
      }
    );
}


function formatAIMessage(
  value
) {
  let text =
    escapeAIHTML(
      String(
        value ?? ""
      ).trim()
    );


  text =
    text.replace(
      /^### (.+)$/gm,
      '<h4 class="ai-response-heading">$1</h4>'
    );


  text =
    text.replace(
      /^## (.+)$/gm,
      '<h3 class="ai-response-heading">$1</h3>'
    );


  text =
    text.replace(
      /^# (.+)$/gm,
      '<h3 class="ai-response-heading">$1</h3>'
    );


  text =
    text.replace(
      /\*\*(.*?)\*\*/g,
      "<strong>$1</strong>"
    );


  text =
    text.replace(
      /^\* (.+)$/gm,
      '<div class="ai-response-list-item"><span>•</span><div>$1</div></div>'
    );


  text =
    text.replace(
      /^- (.+)$/gm,
      '<div class="ai-response-list-item"><span>•</span><div>$1</div></div>'
    );


  text =
    text.replace(
      /^(\d+)\. (.+)$/gm,
      '<div class="ai-response-list-item numbered"><span>$1.</span><div>$2</div></div>'
    );


  text =
    text.replace(
      /\n{2,}/g,
      '<div class="ai-response-space"></div>'
    );


  text =
    text.replace(
      /\n/g,
      "<br>"
    );


  return text;
}


function escapeAIHTML(
  value
) {
  return String(
    value ?? ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
}


function showAIUpgradePopup(message) {

  const existing =
    document.getElementById(
      "aiUpgradePopup"
    );

  if (existing) {
    existing.remove();
  }

  const overlay =
    document.createElement("div");

  overlay.id =
    "aiUpgradePopup";

  overlay.className =
    "upgrade-overlay";

  overlay.innerHTML = `
    <div class="upgrade-modal">

      <button
        type="button"
        class="upgrade-close"
        onclick="closeAIUpgradePopup()"
      >
        ×
      </button>

      <div class="upgrade-icon">
        <i data-lucide="crown"></i>
      </div>

      <h2>
        Free Limit Reached
      </h2>

      <p>
        ${escapeAIHTML(message)}
      </p>

      <div class="upgrade-actions">

        <button
          type="button"
          class="upgrade-later-btn"
          onclick="closeAIUpgradePopup()"
        >
          Maybe Later
        </button>

        <button
          type="button"
          class="upgrade-premium-btn"
          onclick="window.location.href='subscription.html'"
        >
          <i data-lucide="crown"></i>
          Upgrade to Premium
        </button>

      </div>

    </div>
  `;

  document.body.appendChild(
    overlay
  );

  refreshAIIcons();
}

function closeAIUpgradePopup() {
  const popup =
    document.getElementById(
      "aiUpgradePopup"
    );

  if (popup) {
    popup.remove();
  }
}


function refreshAIIcons() {
  if (window.lucide) {
    lucide.createIcons();
  }
}


document.addEventListener(
  "DOMContentLoaded",
  () => {

    loadAIChat();

    setupAIInput();

    refreshAIIcons();

  }
);