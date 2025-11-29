window.addEventListener("load", () => {

  // Regex matches: 1d8, d20, 4d4+4, 2d10-1, +4, -2, etc.
const diceRegex = /(?<![\w])(?:[+-]?\d*d\d+(?:[+-]\d+)?|[+-]\d+)(?![\w])/g;
function wrapDiceNodes(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent;
    if (!diceRegex.test(text)) return;

    const frag = document.createDocumentFragment();
    let lastIndex = 0;

    text.replace(diceRegex, (match, offset) => {
      if (offset > lastIndex) {
        frag.appendChild(document.createTextNode(text.slice(lastIndex, offset)));
      }

      const span = document.createElement("span");
      span.className = "dice-roller";
      span.dataset.dice = match;
      span.textContent = match;
      frag.appendChild(span);

      lastIndex = offset + match.length;
    });

    if (lastIndex < text.length) {
      frag.appendChild(document.createTextNode(text.slice(lastIndex)));
    }

    node.replaceWith(frag);
    return;
  }

  node.childNodes.forEach(wrapDiceNodes);
}

// Run on the whole body
wrapDiceNodes(document.body);


  function parseDice(notation) {
    // If it's just +4 or -2
    if (/^[+-]\d+$/.test(notation)) {
      return { count: 1, size: 20, mod: parseInt(notation, 10) };
    }

    // Full dice notation (may have no leading number)
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

  // Simple toast
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
    document.body.appendChild(t);

    requestAnimationFrame(() => (t.style.opacity = "1"));
    setTimeout(() => {
      t.style.opacity = "0";
      setTimeout(() => t.remove(), 300);
    }, 1500);
  }

  document.querySelectorAll(".dice-roller").forEach(span => {
    span.style.cursor = "pointer";

    span.addEventListener("click", () => {
      const notation = span.dataset.dice;
      const parsed = parseDice(notation);
      if (!parsed) return;

      const result = rollDice(parsed);
      showToast(`${notation} → ${result}`);
    });
  });
});
