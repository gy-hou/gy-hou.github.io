/**
 * AI Chat Widget for Academic Homepage
 * Floating chat button → expandable panel → calls Cloudflare Worker (DeepSeek)
 */
(function () {
  var WORKER_URL = "https://wiki-ai-chat.hougarry.workers.dev";

  var messages = [];
  var isOpen = false;

  var wrapper = document.createElement("div");
  wrapper.id = "ai-chat-wrapper";
  wrapper.innerHTML =
    '<button id="ai-chat-btn" title="AI Assistant">' +
    '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">' +
    '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></button>' +
    '<div id="ai-chat-panel">' +
    '<div id="ai-chat-header">' +
    '<span>AI Assistant</span>' +
    '<button id="ai-chat-close">&times;</button></div>' +
    '<div id="ai-chat-messages"></div>' +
    '<div id="ai-chat-input-row">' +
    '<input id="ai-chat-input" type="text" placeholder="Ask me anything..." maxlength="200">' +
    '<button id="ai-chat-send">Send</button></div></div>';

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
      appendMsg("assistant", "Hi! I'm the AI assistant for this site. Feel free to ask about my research, projects, or anything on this page.");
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

    var typingId = appendMsg("assistant", "Thinking...");

    fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: messages }),
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var reply = data.reply || data.error || "Sorry, something went wrong.";
        removeMsg(typingId);
        appendMsg("assistant", reply);
        messages.push({ role: "assistant", content: reply });
      })
      .catch(function () {
        removeMsg(typingId);
        appendMsg("assistant", "Network error. Please try again.");
      });
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
