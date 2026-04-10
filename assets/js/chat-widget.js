/**
 * AI Chat Widget
 * Floating chat button -> expandable panel -> calls Cloudflare Worker
 */
(function () {
  var SITE_MODE = "academic";
  var SITE_CONFIG = getSiteConfig();

  var messages = [];
  var isOpen = false;

  var wrapper = document.createElement("div");
  wrapper.id = "ai-chat-wrapper";
  wrapper.innerHTML =
    '<button id="ai-chat-btn" title="' +
    SITE_CONFIG.ui.title +
    '">' +
    '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">' +
    '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></button>' +
    '<div id="ai-chat-panel">' +
    '<div id="ai-chat-header">' +
    "<span>" +
    SITE_CONFIG.ui.title +
    "</span>" +
    '<button id="ai-chat-close">&times;</button></div>' +
    '<div id="ai-chat-messages"></div>' +
    '<div id="ai-chat-input-row">' +
    '<input id="ai-chat-input" type="text" placeholder="' +
    SITE_CONFIG.ui.placeholder +
    '" maxlength="200">' +
    '<button id="ai-chat-send">' +
    SITE_CONFIG.ui.send +
    "</button></div></div>";

  document.body.appendChild(wrapper);

  var btn = document.getElementById("ai-chat-btn");
  var panel = document.getElementById("ai-chat-panel");
  var closeBtn = document.getElementById("ai-chat-close");
  var msgBox = document.getElementById("ai-chat-messages");
  var input = document.getElementById("ai-chat-input");
  var sendBtn = document.getElementById("ai-chat-send");

  btn.onclick = function () {
    isOpen = !isOpen;
    panel.classList.toggle("open", isOpen);
    btn.classList.toggle("hidden", isOpen);
    if (isOpen && messages.length === 0) {
      appendMsg("assistant", SITE_CONFIG.ui.welcome);
    }
    if (isOpen) input.focus();
  };

  closeBtn.onclick = function () {
    isOpen = false;
    panel.classList.remove("open");
    btn.classList.remove("hidden");
  };

  sendBtn.onclick = doSend;
  input.onkeydown = function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      doSend();
    }
  };

  function doSend() {
    var text = input.value.trim();
    if (!text) return;

    input.value = "";
    appendMsg("user", text);
    messages.push({ role: "user", content: text });

    var responseLanguage = SITE_CONFIG.defaultLanguage;
    var typingId = appendMsg("assistant", SITE_CONFIG.ui.thinking);

    requestReply({
      site_mode: SITE_MODE,
      response_language: responseLanguage,
      messages: messages,
    })
      .then(function (data) {
        var reply = data.reply || data.error || SITE_CONFIG.ui.fallbackError;
        removeMsg(typingId);
        appendMsg("assistant", reply);
        messages.push({ role: "assistant", content: reply });
      })
      .catch(function () {
        removeMsg(typingId);
        appendMsg("assistant", SITE_CONFIG.ui.networkError);
      });
  }

  function requestReply(payload) {
    return postToWorker(SITE_CONFIG.workerUrl, payload);
  }

  function postToWorker(url, payload) {
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(function (response) {
      if (!response.ok) {
        throw new Error("worker_http_" + response.status);
      }
      return response.json();
    });
  }

  function getSiteConfig() {
    var selected = {
      workerUrl: "https://academic-ai-chat.hougarry.workers.dev",
      defaultLanguage: "en",
      ui: {
        title: "AI Assistant",
        placeholder: "Ask me anything...",
        send: "Send",
        welcome: "Hi! I'm the AI assistant for this site. Feel free to ask about my research, projects, or anything on this page.",
        thinking: "Thinking...",
        networkError: "Network error. Please try again.",
        fallbackError: "Sorry, something went wrong.",
      },
    };

    var workerOverrides = window.__AI_CHAT_WORKERS__;
    if (workerOverrides && workerOverrides.academic) {
      selected.workerUrl = workerOverrides.academic;
    }

    return selected;
  }

  var msgCounter = 0;

  function appendMsg(role, text) {
    var id = "msg-" + ++msgCounter;
    var div = document.createElement("div");
    div.className = "ai-chat-msg ai-chat-" + role;
    div.id = id;
    div.textContent = text;
    msgBox.appendChild(div);
    msgBox.scrollTop = msgBox.scrollHeight;
    return id;
  }

  function removeMsg(id) {
    var el = document.getElementById(id);
    if (el) el.remove();
  }
})();
