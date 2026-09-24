'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('mmmr-form');
  if (!form) return;

  function fmt(n) {
    return n.toLocaleString('en-US', { maximumFractionDigits: 4 });
  }

  function calculate() {
    const raw = el('mmmr-numbers').value;
    const values = raw.split(/[,\s]+/).map((s) => s.trim()).filter((s) => s !== '').map(Number);

    if (values.length === 0 || values.some((v) => !Number.isFinite(v))) {
      el('mmmr-result').innerHTML = '<p class="tool-result is-error">Enter a list of numbers separated by commas.</p>';
      return;
    }

    const n = values.length;
    const sum = values.reduce((s, v) => s + v, 0);
    const mean = sum / n;

    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(n / 2);
    const median = n % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];

    const counts = new Map();
    values.forEach((v) => counts.set(v, (counts.get(v) || 0) + 1));
    const maxCount = Math.max(...counts.values());
    let modes = [];
    if (maxCount > 1) {
      modes = [...counts.entries()].filter(([, c]) => c === maxCount).map(([v]) => v).sort((a, b) => a - b);
    }

    const range = sorted[n - 1] - sorted[0];

    el('mmmr-result').innerHTML = `
      <div class="summary-payment-box">
        <div class="label">Mean</div>
        <div class="value">${fmt(mean)}</div>
      </div>
      <div class="stat-row"><span>Median</span><strong>${fmt(median)}</strong></div>
      <div class="stat-row"><span>Mode</span><strong>${modes.length ? modes.map(fmt).join(', ') : 'None (no repeated values)'}</strong></div>
      <div class="stat-row"><span>Range</span><strong>${fmt(range)}</strong></div>
      <div class="stat-row"><span>Count, N</span><strong>${n}</strong></div>
      <div class="stat-row"><span>Sum</span><strong>${fmt(sum)}</strong></div>
      <div class="stat-row"><span>Sorted Data</span><strong style="font-weight:500;">${sorted.map(fmt).join(', ')}</strong></div>
    `;
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  calculate();
})();
