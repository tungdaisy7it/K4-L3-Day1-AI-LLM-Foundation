(() => {
  const chatWindow = document.getElementById("chat-window");
  const emptyHint = document.getElementById("empty-hint");
  const composer = document.getElementById("composer");
  const messageInput = document.getElementById("message-input");
  const sendBtn = document.getElementById("send-btn");
  const personaInput = document.getElementById("persona-input");
  const resetBtn = document.getElementById("reset-btn");
  const statusLine = document.getElementById("status-line");
  const modelBadge = document.getElementById("model-badge");
  const baseUrlBadge = document.getElementById("baseurl-badge");
  const debugBox = document.getElementById("debug-box");
  const toggleDebugBtn = document.getElementById("toggle-debug");
  const pipelineEl = document.getElementById("pipeline");
  const statTurns = document.getElementById("stat-turns");
  const statTokens = document.getElementById("stat-tokens");
  const statCost = document.getElementById("stat-cost");
  const statHistory = document.getElementById("stat-history");

  const STEP_ORDER = ["input", "build", "context", "send", "model", "render", "cost"];

  const state = {
    history: [],
    totalTokens: 0,
    totalCost: 0,
    turns: 0,
    maxHistoryMessages: 6,
  };

  function fmtCost(n) {
    return "$" + n.toFixed(6);
  }

  async function loadInfo() {
    try {
      const res = await fetch("/api/info");
      const data = await res.json();
      modelBadge.textContent = "model: " + data.model;
      baseUrlBadge.textContent = "endpoint: " + data.base_url;
      personaInput.value = data.default_persona || "";
      state.maxHistoryMessages = data.max_history_messages || 6;
      statHistory.textContent = `0/${state.maxHistoryMessages} message`;
      if (!data.has_api_key) {
        modelBadge.textContent += " (thiếu OPENAI_API_KEY!)";
        modelBadge.style.background = "var(--error)";
      }
    } catch (err) {
      modelBadge.textContent = "model: (không đọc được /api/info)";
    }
  }

  function setPipelineState(activeKey, doneKeys) {
    const items = pipelineEl.querySelectorAll("li");
    items.forEach((li) => {
      const step = li.dataset.step;
      li.classList.toggle("active", step === activeKey);
      li.classList.toggle("done", doneKeys.includes(step));
    });
  }

  function resetPipeline() {
    pipelineEl.querySelectorAll("li").forEach((li) => {
      li.classList.remove("active", "done");
    });
  }

  async function stepThroughPipeline(upToKey) {
    const idx = STEP_ORDER.indexOf(upToKey);
    for (let i = 0; i <= idx; i++) {
      setPipelineState(STEP_ORDER[i], STEP_ORDER.slice(0, i));
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 120));
    }
  }

  function addBubble(role, text, meta) {
    emptyHint.hidden = true;
    const div = document.createElement("div");
    div.className = "msg " + role;
    div.textContent = text;
    if (meta) {
      const metaEl = document.createElement("span");
      metaEl.className = "msg-meta";
      metaEl.textContent = meta;
      div.appendChild(metaEl);
    }
    chatWindow.appendChild(div);
    chatWindow.scrollTop = chatWindow.scrollHeight;
    return div;
  }

  function updateStats() {
    statTurns.textContent = String(state.turns);
    statTokens.textContent = String(state.totalTokens);
    statCost.textContent = fmtCost(state.totalCost);
    statHistory.textContent = `${state.history.length}/${state.maxHistoryMessages} message`;
  }

  function setBusy(isBusy, statusText) {
    sendBtn.disabled = isBusy;
    messageInput.disabled = isBusy;
    statusLine.hidden = !statusText;
    statusLine.textContent = statusText || "";
  }

  async function sendMessage(message) {
    addBubble("user", message);

    await stepThroughPipeline("context");
    setBusy(true, `Đang gửi request tới model "${modelBadge.textContent.replace("model: ", "")}"…`);
    setPipelineState("send", STEP_ORDER.slice(0, STEP_ORDER.indexOf("send")));

    let data;
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          persona: personaInput.value,
          history: state.history,
          message,
        }),
      });
      data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Lỗi không xác định từ server.");
      }
    } catch (err) {
      addBubble("error", "Lỗi: " + err.message);
      resetPipeline();
      setBusy(false, "");
      return;
    }

    await stepThroughPipeline("model");

    const meta =
      `${data.model} · ${data.latency.toFixed(2)}s · ` +
      `${data.usage.input_tokens} in / ${data.usage.output_tokens} out tok · ` +
      fmtCost(data.usage.total_cost);
    addBubble("assistant", data.reply, meta);

    await stepThroughPipeline("render");

    state.history = data.history;
    state.turns += 1;
    state.totalTokens += data.usage.input_tokens + data.usage.output_tokens;
    state.totalCost += data.usage.total_cost;
    updateStats();

    debugBox.textContent = JSON.stringify(data.messages_sent, null, 2);

    await stepThroughPipeline("cost");
    setBusy(false, "");
    setTimeout(resetPipeline, 600);
  }

  composer.addEventListener("submit", (e) => {
    e.preventDefault();
    const message = messageInput.value.trim();
    if (!message) return;
    messageInput.value = "";
    sendMessage(message);
  });

  messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      composer.requestSubmit();
    }
  });

  resetBtn.addEventListener("click", () => {
    state.history = [];
    state.totalTokens = 0;
    state.totalCost = 0;
    state.turns = 0;
    updateStats();
    chatWindow.innerHTML = "";
    chatWindow.appendChild(emptyHint);
    emptyHint.hidden = false;
    debugBox.textContent = "(chưa có request nào)";
    resetPipeline();
  });

  toggleDebugBtn.addEventListener("click", () => {
    debugBox.hidden = !debugBox.hidden;
  });

  loadInfo();
  updateStats();
})();
