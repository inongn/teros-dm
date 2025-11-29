document.addEventListener("DOMContentLoaded", () => {
  const bodyHTML = document.body.innerHTML;

  // Regex matches: 1d8, d20, 4d4+4, 2d10-1, +4, -2, etc.
const diceRegex = /(?<![\w])(?:[+-]?\d*d\d+(?:[+-]\d+)?|[+-]\d+)(?![\w])/g;

  document.body.innerHTML = bodyHTML.replace(diceRegex, match => {
    return `<span class="dice-roller" data-dice="${match}">${match}</span>`;
  });

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
