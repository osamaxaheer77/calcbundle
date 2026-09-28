'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('dice-form');
  if (!form) return;

  function secureRandomInt(max) {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return arr[0] % max;
  }

  function roll() {
    const count = parseInt(el('dice-count').value, 10);
    const sides = parseInt(el('dice-sides').value, 10);
    const resultEl = el('dice-result');

    if (!count || count < 1 || count > 100 || !sides || sides < 2) {
      resultEl.innerHTML = '<p class="tool-result is-error">Enter 1&ndash;100 dice with at least 2 sides each.</p>';
      return;
    }

    const rolls = [];
    for (let i = 0; i < count; i++) rolls.push(secureRandomInt(sides) + 1);
    const total = rolls.reduce((a, b) => a + b, 0);

    resultEl.innerHTML = `
      <div class="summary-payment-box">
        <div class="label">Total</div>
        <div class="value">${total}</div>
      </div>
      <div class="stat-row"><span>Individual Rolls</span><strong>${rolls.join(', ')}</strong></div>
      ${count > 1 ? `<div class="stat-row"><span>Average</span><strong>${(total / count).toFixed(2)}</strong></div>` : ''}
    `;
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); roll(); });
  roll();
})();
