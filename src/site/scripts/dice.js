// === dice.js (dynamic + safe version, no innerHTML rewriting) ===

window.addEventListener("load", () => {
  applyDiceLogic();
});

// Watch for dynamic DOM changes (for SPAs, client-rendered statblocks, etc.)
const observer = new MutationObserver(mutations => {
  for (const m of mutations) {
    m.addedNodes.forEach(node => applyDiceLogic(node));
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});


// ===============================================================
//  Core logic
// ===============================================================

function applyDiceLogic(root = document.body) {
  const diceRegex = /(?<![\w])(?:[+-]?\d*d\d+(?:[+-]\d+)?|[+-]\d+)(?![\w])/g;

  function process(node) {
    // Only process text nodes
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent;
      if (!diceRegex.test(text)) return;

      const frag = document.createDocumentFragment();
      let last = 0;

      text.replace(diceRegex, (match, offset) => {
        if (offset > last) {
          frag.appendChild(document.createTextNode(text.slice(last, offset)));
        }

        const span = document.createElement("span");
        span.className = "dice-roller";
        span.dataset.dice = match;
        span.textContent = match;
        frag.appendChild(span);

        last = offset + match.length;
      });

      if (last < text.length) {
        frag.appendChild(document.createTextNode(text.slice(last)));
      }

      node.replaceWith(frag);
      return;
    }

    // Skip script/style tags
    if (node.nodeType === Node.ELEMENT_NODE &&
        (node.tagName === "SCRIPT" || node.tagName === "STYLE")) {
      return;
    }

    // Recurse
    node.childNodes.forEach(process);
  }

  process(root);

  // Attach click handlers to all spans not yet initialized
  document.querySelectorAll(".dice-roller:not([data-init])").forEach(span => {
    span.dataset.init = "1";
    span.style.cursor = "pointer";
    span.addEventListener("click", () => {
      const notation = span.dataset.dice;
      const parsed = parseDice(notation);
      if (!parsed) return;

      const result = rollDice(parsed);
      showToast(`${notation} → ${result}`);
    });
  });
}


// ===============================================================
//  Dice Parsing + Rolling
// ===============================================================

function parseDice(notation) {
  // “+4” or “-1”
  if (/^[+-]\d+$/.test(notation)) {
    return { count: 1, size: 20, mod: parseInt(notation, 10) };
  }

  // Full dice notation: 1d8, d20, 4d4+4, 2d10-1, etc.
  const m = notation.match(/^([+-]?\d*)d(\d+)([+-]\d+)?$/i);
  if (!m) return null;

  let [, count, size, mod] = m;

  count = count === "" || count === "+" || count === "-" ? 1 : parseInt(count, 10);
  size = parseInt(size, 10);
  mod = mod ? parseInt(mod, 10) : 0;

  return { count, size, mod };
}

function rollDice({ count, size, mod }) {
  let total = 0;
  for (let i = 0; i < count; i++) {
    total += Math.floor(Math.random() * size) + 1;
  }
  return total + mod;
}


// ===============================================================
//  Toast Notification
// ===============================================================

function showToast(msg) {
  const t = document.createElement("div");
  t.textContent = msg;
  t.style.position = "fixed";
  t.style.bottom = "20px";
  t.style.right = "20px";
  t.style.padding = "10px 16px";
  t.style.background = "black";
  t.style.color = "white";
  t.style.borderRadius = "6px";
  t.style.opacity = "0";
  t.style.transition = "opacity 0.3s";
  t.style.zIndex = "99999";
  document.body.appendChild(t);

  requestAnimationFrame(() => (t.style.opacity = "1"));

  setTimeout(() => {
    t.style.opacity = "0";
    setTimeout(() => t.remove(), 300);
  }, 1500);
}
