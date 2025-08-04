window.addEventListener("DOMContentLoaded", () => {
  const userInput = document.getElementById("userInput");
  const generateBtn = document.getElementById("generateRoutine");
  const chatWindow = document.getElementById("chatWindow");
  const chatForm   = document.getElementById("chatForm");
  const categoryFilter = document.getElementById("categoryFilter");
  const productsContainer = document.getElementById("productsContainer");

  let messages = [window.systemPrompt];
  let allProducts = [];

  chatWindow.textContent = "👋 Hello! How can I help you today?";

    // ---------- On Load ----------
    window.addEventListener('load', () => {
      const introOverlay = document.getElementById('introOverlay');
      setTimeout(() => {
        introOverlay.classList.add('slide-out');
        setTimeout(() => introOverlay.style.display = 'none', 1300);
      }, 3100);
    });
  // ---------- Product Grid Setup ----------
    productsContainer.innerHTML = `
      <div class="placeholder-message">
        Select a category to view products
      </div>
    `;

// ── PRODUCT LOADER ──
async function loadProducts() {
  // fetch your JSON
  const res = await fetch("products.json");
  const data = await res.json();
  
  // support either { products: [...] } or [...]
  allProducts = data.products || data;
  return allProducts;
}
  // load & render everything at once by default
    loadProducts().then(products => {
      displayProducts(products);
      renderRoutineCart();
    });
// 3) Render a batch of cards:
function displayProducts(products) {
   // only show “l’oréal” entries
  const lorealOnly = products.filter(p =>
  p.brand && p.brand.toLowerCase().includes("loréal")
  );
  const tpl = document.getElementById("productCardTemplate");
  productsContainer.innerHTML = "";

  lorealOnly.forEach(p => {
    const clone = tpl.content.cloneNode(true);
    const card = clone.querySelector(".product-card");
    card.dataset.id = p.id;

    clone.querySelector("img").src = p.image;
    clone.querySelector("img").alt = p.name;
    clone.querySelector(".product-name").textContent = p.name;

    // leave brand & description in the template, but we’ll hide them with CSS
    clone.querySelector(".product-brand").textContent = p.brand;
    clone.querySelector(".description-hover").textContent = p.description;

    productsContainer.appendChild(clone);
  });

  attachCardClickListeners();
  renderSelectedProductsList();
  }



  function renderSelectedProductsList() {
    const list = document.getElementById("selectedProductsList");
    list.innerHTML = "";

    selectedProducts.forEach((id) => {
      const product = allProducts.find((p) => p.id === id);
      if (!product) return;

      const item = document.createElement("div");
      item.className = "selected-item";
      item.innerHTML = `
      ${product.name}
      <button onclick="removeProduct('${id}')" class="remove-btn">×</button>
    `;
      list.appendChild(item);
    });
  }
      
  window.removeProduct = function (id) {
    selectedProducts = selectedProducts.filter((pid) => pid !== id);
    localStorage.setItem("selectedProducts", JSON.stringify(selectedProducts));
    updateProductStyles();
    renderSelectedProductsList();
  };

  categoryFilter.addEventListener("change", async (e) => {
    const selectedCategory = e.target.value;
    const products = await loadProducts();
    const filtered = products.filter(
      (p) =>
        p.category === selectedCategory &&
        p.brand.toLowerCase().includes("l'oréal")
    );
    displayProducts(filtered);
  });

  // ---------- Product Selection Logic ----------
 
      // 4) Keep track of selected IDs in localStorage:
      let selectedProducts = JSON.parse(localStorage.getItem("selectedProducts")) || [];

      function toggleProductSelection(id) {
        const ix = selectedProducts.indexOf(id);
        if (ix === -1) selectedProducts.push(id);
        else selectedProducts.splice(ix, 1);
        localStorage.setItem("selectedProducts", JSON.stringify(selectedProducts));
        updateProductStyles();
        renderSelectedProductsList();
      };

      function updateProductStyles() {
        document.querySelectorAll(".product-card").forEach(card => {
          card.classList.toggle("selected", selectedProducts.includes(card.dataset.id));
        });
      }

      function attachCardClickListeners() {
        document.querySelectorAll(".product-card").forEach(card => {
          card.addEventListener("click", () => toggleProductSelection(card.dataset.id));
        });
      }

      function renderSelectedProductsList() {
        const list = document.getElementById("selectedProductsList");
        list.innerHTML = "";
        selectedProducts.forEach(id => {
          const p = allProducts.find(x => x.id === id);
          const div = document.createElement("div");
          div.className = "selected-item";
          div.innerHTML = `
            ${p.name}
            <button class="remove-btn">&times;</button>
          `;
          div.querySelector(".remove-btn").addEventListener("click", () => {
            toggleProductSelection(id);
          });
          list.appendChild(div);
        });
      }

          categoryFilter.addEventListener("change", async e => {
            allProducts = allProducts.length ? allProducts : await loadProducts();
            const filtered = allProducts.filter(p => p.category === e.target.value);
            displayProducts(filtered);
          });


  // Maintaining cart
  const routineCartList = document.getElementById("routineCartList");
const printRoutineBtn = document.getElementById("printRoutineBtn");

// whenever you toggle a product selection, also re-render the sidebar:
function renderRoutineCart() {
  routineCartList.innerHTML = "";
  selectedProducts.forEach(id => {
    const prod = allProducts.find(p => p.id === id);
    if (!prod) return;
    const li = document.createElement("li");
    li.textContent = prod.name;
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "×";
    removeBtn.onclick = () => {
      toggleProductSelection(id);
      renderRoutineCart();
    };
    li.appendChild(removeBtn);
    routineCartList.appendChild(li);
   });
  }

  // only enable Print if you have at least one product
  printRoutineBtn.disabled = selectedProducts.length === 0;

// extend your existing toggleProductSelection:
function toggleProductSelection(id) {
  // … your push/splice + localStorage …
  updateProductStyles();
  renderRoutineCart();
}

// initial render on page‐load
renderRoutineCart();


  // ---------- Chat Display Functions ----------
  function appendMessage(role, text) {
    const msg = document.createElement("div");
    msg.className = `msg ${role}`;
    msg.innerHTML = markdownToHTML(text);
    chatWindow.appendChild(msg);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  function markdownToHTML(mdText) {
    return mdText
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>')
      .replace(/\n/g, "<br>");
  }
  const loadingBubble = document.createElement('div');
  loadingBubble.className = 'msg ai thinking';
  loadingBubble.innerText  = '🌀 Thinking…';
 

  function showLoadingMessage() {
  const chatWindow = document.getElementById("chatWindow");
  const loadingBubble = document.createElement("div");
  loadingBubble.className = "msg ai thinking";
  loadingBubble.innerText = "🌀 Thinking…";
  chatWindow.appendChild(loadingBubble);

  const cta = document.createElement("div");
  cta.className = "msg ai";
  cta.innerHTML = `👍 Based on what you shared, I’ve recommended some products!  
  When you're ready, tap <strong>Generate Routine</strong> to get your customized plan.`;
  chatWindow.appendChild(cta);

let hasUserChatted = false;

// If you want to use chatInput and categoryDropdown, make sure they are defined above
// Example:
// const chatInput = document.getElementById("userInput");
// const categoryDropdown = document.getElementById("categoryFilter");

// Uncomment and use if needed:
// chatInput.addEventListener('keypress', function(e) {
//   if (e.key === 'Enter') {
//     hasUserChatted = true;
//     // existing chat submission logic
//   }
// });

// categoryDropdown.addEventListener('change', function() {
//   if (!hasUserChatted) {
//     loadProductsUnfiltered(this.value);
//   } else {
//     // filtered product view based on chat
//     displayRecommendedProductsOnly();
//   }
// });


  // ---------- Chatbot API Call ----------
  async function getAIResponse(userMessage) {
    messages.push({ role: "user", content: userMessage });

    const loadingMsg = document.createElement("div");
    loadingMsg.className = "msg ai thinking";

    for (let i = 0; i < 3; i++) {
      const dot = document.createElement("div");
      dot.className = "dot";
      loadingMsg.appendChild(dot);
    }

    chatWindow.appendChild(loadingMsg);
    chatWindow.scrollTop = chatWindow.scrollHeight;

    try {
      const response = await fetch(
        "https://sweet-credit-1696.kezia-west.workers.dev",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages }),
        }
      );

      const data = await response.json();
      let aiReply = data.reply || "";

      const fallback = `🤔 Hmm… that’s outside my area of glam!  
If you need help with beauty routines, product picks, or finding your perfect shade, I’m here for you 💄✨`;

      if (!aiReply || aiReply.length < 20) aiReply = fallback;

      messages.push({ role: "assistant", content: aiReply });

      chatWindow.removeChild(loadingMsg);
      return aiReply;
    } catch (err) {
      console.error("Worker fetch failed:", err);
      chatWindow.removeChild(loadingMsg);
      return "😓 Something went wrong. Please try again!";
    }
  }

  // ---------- Chat Input Handler ----------

    const sendBtn = document.getElementById('sendBtn');
    sendBtn.addEventListener('click', async () => {
      const userText = userInput.value.trim();
      if (!userText) return;
      appendMessage('user', userText);
      userInput.value = '';
      const botResponse = await getAIResponse(userText);
      appendMessage('ai', botResponse);
    });


  printRoutineBtn.addEventListener("click", async () => {
  if (!allProducts.length) await loadProducts();
  const chosen = allProducts.filter(p => selectedProducts.includes(p.id));

  // 1) turn the selected products into a bullet list
  const productLines = chosen
    .map(
      p => `- ${p.name} (${p.brand} — ${p.category}): ${p.description}`
    )
    .join("\n");

  // 2) craft a focused user prompt
  const routinePrompt = {
    role: "user",
    content: `
The user has selected these L’Oréal products:
${productLines}

Please write a step-by-step skincare & makeup routine using exactly those products. 
If an extra moisturizing step is needed, suggest an additional L’Oréal moisturizer.
Format your response so it’s printer-friendly (simple numbered steps, minimal markup).
`
  };

  // 3) show a quick “loading” message
  appendMessage("ai", "🌀 Generating your printable routine…");

  // 4) send it off to the AI
  messages.push(routinePrompt);
  const reply = await getAIResponse();    // your existing function will POST messages[]

  // 5) open a print window
  const printWindow = window.open("", "_blank");
  printWindow.document.body.innerHTML = `<pre>${reply}</pre>`;
  printWindow.print();
});


  // ---------- Generate Routine Button ----------

  generateBtn.addEventListener("click", async () => {
    if (selectedProducts.length === 0) {
      appendMessage("ai", "🛍️ Please select some products first!");
      return;
    }

    if (!allProducts.length) await loadProducts();

    const selectedData = allProducts.filter((p) =>
      selectedProducts.includes(p.id)
    );

    const lifestyleNotes = messages
      .map((m) => m.content)
      .filter((c) =>
        /skin|hair|makeup|routine|dry|oily|sensitive|bold|natural/i.test(c)
      )
      .join("\n");

    const routinePrompt = `
Build a personalized L'Oréal beauty routine using the following products:

${selectedData
  .map((p) => `- ${p.name} (${p.brand} – ${p.category}): ${p.description}`)
  .join("\n")}

The user previously mentioned:
${lifestyleNotes || "No personal details given yet."}

Format the routine in simple steps. If a product doesn't match their needs, skip it. Be helpful, elegant, and savvy.
`;

    appendMessage("user", "🪄 Generate a routine with my selected products.");
    const response = await getAIResponse(routinePrompt);
    appendMessage("ai", response);

    document.getElementById("downloadPdfBtn").style.display = "block";
  });


document.getElementById("downloadPdfBtn").style.display = "block";

document.getElementById("downloadPdfBtn").onclick = () => {
  const routineText = chatWindow.innerText;
  const blob = new Blob([routineText], { type: "application/pdf" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "my-loreal-routine.pdf";
  link.click();
};

// Modal preview and PDF download
const previewModal = document.getElementById("routinePreviewModal");
const previewText = document.getElementById("routinePreviewText");
const closeModalBtn = document.getElementById("closeModalBtn");
const confirmDownloadBtn = document.getElementById("confirmDownloadBtn");

document.getElementById("downloadPdfBtn").onclick = () => {
  const routineText = chatWindow.innerText;
  previewText.textContent = routineText;
  previewModal.style.display = "flex";
};

closeModalBtn.onclick = () => {
  previewModal.style.display = "none";
};

confirmDownloadBtn.onclick = () => {
  const routineText = previewText.textContent;
  const blob = new Blob([routineText], { type: "application/pdf" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "my-loreal-routine.pdf";
  link.click();
  previewModal.style.display = "none";
      previewText.textContent = "";
  };
  };
   });

   function attachCardClickListeners() {
  document.querySelectorAll(".product-card").forEach(card => {
    card.addEventListener("click", () => {
      // if user held Shift (or you detect small screens), show description
      if (window.innerWidth < 600) {
        card.classList.toggle("show-desc");
      } else {
        toggleProductSelection(card.dataset.id);
      }
    });
  });
}
