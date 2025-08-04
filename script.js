window.addEventListener("DOMContentLoaded", () => {
  // ── Elements & State ──
  const searchInput       = document.getElementById("productSearch");
  const productsContainer = document.getElementById("productsContainer");
  const cartList          = document.getElementById("routineCartList");
  const clearCartBtn      = document.getElementById("clearCartBtn");
  const generateBtn       = document.getElementById("generateRoutine");
  const chatForm          = document.getElementById("chatForm");
  const sendBtn           = document.getElementById("sendBtn");
  const userInput         = document.getElementById("userInput");
  const chatWindow        = document.getElementById("chatWindow");
  const selectedBox       = document.querySelector(".selected-products");

  let allProducts = [];
  let cart = JSON.parse(localStorage.getItem("cart") || "[]");
  let messages = [ window.systemPrompt ];

  // ── Fetch & Initial Render ──
  fetch("products.json")
    .then(r => r.json())
    .then(data => allProducts = data.products || data)
    .then(() => {
      renderRecommendations(allProducts);
      renderCart();
    });

  // ── Renders product cards ──
  function renderRecommendations(list) {
    productsContainer.innerHTML = "";
    list.forEach(p => {
      const card = document.createElement("div");
      card.className = "product-card";
      card.innerHTML = `
        <img src="${p.image}" alt="${p.name}">
        <h3>${p.name}</h3>
      `;
      card.addEventListener("click", () => {
        if (!cart.includes(p.id)) {
          cart.push(p.id);
          saveCart();
          renderCart();
        }
      });
      productsContainer.appendChild(card);
    });
  }

  // ── Renders cart with remove buttons ──
  function renderCart() {
    cartList.innerHTML = "";
    cart.forEach((id, idx) => {
      const p = allProducts.find(x => x.id === id);
      if (!p) return;
      const li = document.createElement("li");
      li.textContent = p.name;
      const btn = document.createElement("button");
      btn.textContent = "×";
      btn.className = "remove-btn";
      btn.addEventListener("click", () => {
        cart.splice(idx, 1);
        saveCart();
        renderCart();
      });
      li.appendChild(btn);
      cartList.appendChild(li);
    });
    clearCartBtn.disabled = cart.length === 0;
  }

  function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
  }

  // ── Clear Cart ──
  clearCartBtn.addEventListener("click", () => {
    if (!cart.length) return;
    if (confirm("Remove all items from your routine cart?")) {
      cart = [];
      saveCart();
      renderCart();
    }
  });

  // ── Live Search ──
  searchInput.addEventListener("input", () => {
    const q = searchInput.value.toLowerCase();
    renderRecommendations(
      allProducts.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q)
      )
    );
  });

  // ── Chat / AI Handler ──
  async function handleChatSubmission() {
    const text = userInput.value.trim();
    if (!text) return;
    appendMessage("user", text);
    userInput.value = "";
    messages.push({ role: "user", content: text });
    const raw = await getAIResponse(text);
    let json;
    try { json = JSON.parse(raw); }
    catch { return appendMessage("ai", raw); }

    if (Array.isArray(json.recommendations)) {
      renderRecommendations(json.recommendations);
    }
    appendMessage("ai", json.chat || "");
  }

  chatForm.addEventListener("submit", e => {
    e.preventDefault();
    handleChatSubmission();
  });
  sendBtn.addEventListener("click", () => chatForm.dispatchEvent(new Event("submit")));

  // ── Generate Routine ──
  generateBtn.addEventListener("click", async () => {
    if (!cart.length) {
      alert("Pick some products first!");
      return;
    }
    const lines = cart.map(id => {
      const p = allProducts.find(x => x.id === id);
      return `- ${p.name}`;
    }).join("\n");

    appendMessage("ai", "🌀 Generating your routine…");
    messages.push({
      role: "user",
      content: `Here are my selected products:\n${lines}\n\nPlease give me a step-by-step routine.`
    });
    const aiRaw = await getAIResponse();
    let aiJson;
    try { aiJson = JSON.parse(aiRaw); }
    catch { return appendMessage("ai", aiRaw); }

    appendMessage("ai", aiJson.chat || "");
    // put numbered steps into the selected box
    const steps = (aiJson.chat || "")
      .split("\n")
      .filter(l => /^\d+\./.test(l.trim()))
      .map(l => l.replace(/^\d+\.\s*/, ""));
    selectedBox.innerHTML = `
      <h3>Your Routine</h3>
      <ol>
        ${steps.map(s => `<li>${s}</li>`).join("")}
      </ol>
    `;
  });
  function markdownToHTML(mdText) {
  return mdText
    // links: [text](url) → <a href="url" target="_blank">text</a>
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>')
    // bold: **text** → <strong>text</strong>
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // newlines → <br>
    .replace(/\n/g, '<br>');
}
  // ── Helpers ──
  function appendMessage(role, txt) {
    const msg = document.createElement("div");
    msg.className = "msg " + role;
    msg.innerHTML = markdownToHTML(txt);
    chatWindow.appendChild(msg);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  async function getAIResponse(userMessage) {
    const loader = document.createElement("div");
    loader.className = "msg ai thinking";
    loader.innerText = "🌀 Thinking…";
    chatWindow.appendChild(loader);

    const res = await fetch("https://sweet-credit-1696.kezia-west.workers.dev", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages })
    });
    const { reply } = await res.json();
    chatWindow.removeChild(loader);
    return reply || "😓 Something went wrong.";
  }
});

window.addEventListener('load', () => {
  const introOverlay = document.getElementById('introOverlay');
  // wait 3.1s to match your animation length, then slide out and hide
  setTimeout(() => {
    introOverlay.classList.add('slide-out');
    setTimeout(() => introOverlay.style.display = 'none', 1250);
  }, 3100);

  // clean up once the slide-out animation finishes
  introOverlay.addEventListener('animationend', e => {
    if (e.animationName === 'slideLeftOut') {
      introOverlay.style.display = 'none';
    }
  });

      // ── POPUP + PRINT ROUTINE ──
      const printBtn = document.getElementById("printRoutineBtn");
      printBtn.addEventListener("click", () => {
        const html = selectedBox.innerHTML.trim();
        if (!html) {
          alert("Generate a routine first!");
          return;
        }
        // open a tiny popup
        const w = window.open("", "_blank", "width=600,height=600,scrollbars=yes");
        w.document.write(`
          <html>
            <head>
              <title>Your L'Oréal Routine</title>
              <style>
                body { font-family: sans-serif; padding: 20px; }
                h3 { margin-top: 0; }
                ol { margin-left: 1.5em; }
              </style>
            </head>
            <body>
              ${html}
              <hr>
              <button onclick="window.print()">Print</button>
            </body>
          </html>
        `);
        w.document.close();
      });

      // ── POPUP + SHOW ROUTINE MARKUP ──
      const downloadBtn = document.getElementById("downloadPdfBtn");
      downloadBtn.addEventListener("click", () => {
        const html = selectedBox.innerHTML.trim();
        if (!html) {
          alert("Generate a routine first!");
          return;
        }
        // open a popup with the raw HTML so users can copy or save it
        const w = window.open("", "_blank", "width=600,height=600,scrollbars=yes");
        w.document.write(`
          <html>
            <head>
              <title>Your Routine Markup</title>
              <style>
                body { font-family: monospace; padding: 20px; white-space: pre-wrap; }
                textarea { width: 100%; height: 90%; }
              </style>
            </head>
            <body>
              <h3>Copy / Save this markup</h3>
              <textarea readonly>${html.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</textarea>
            </body>
          </html>
        `);
        w.document.close();
      });

});