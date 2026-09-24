'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('circ-form');
  if (!form) return;

  function num(id) {
    const field = el(id);
    if (!field || field.value.trim() === '') return null;
    const v = parseFloat(field.value);
    return Number.isFinite(v) ? v : null;
  }

  function fmt(n) {
    return n.toLocaleString('en-US', { maximumFractionDigits: 5 });
  }

  function calculate() {
    const r = num('circ-r');
    const d = num('circ-d');
    const c = num('circ-c');
    const a = num('circ-a');
    const filled = [r, d, c, a].filter((v) => v !== null).length;

    if (filled !== 1) {
      el('circ-result').innerHTML = '<p class="tool-result is-error">Enter exactly one value &mdash; radius, diameter, circumference, or area.</p>';
      return;
    }

    let radius;
    if (r !== null) {
      if (r <= 0) { el('circ-result').innerHTML = '<p class="tool-result is-error">Radius must be greater than 0.</p>'; return; }
      radius = r;
    } else if (d !== null) {
      if (d <= 0) { el('circ-result').innerHTML = '<p class="tool-result is-error">Diameter must be greater than 0.</p>'; return; }
      radius = d / 2;
    } else if (c !== null) {
      if (c <= 0) { el('circ-result').innerHTML = '<p class="tool-result is-error">Circumference must be greater than 0.</p>'; return; }
      radius = c / (2 * Math.PI);
    } else {
      if (a <= 0) { el('circ-result').innerHTML = '<p class="tool-result is-error">Area must be greater than 0.</p>'; return; }
      radius = Math.sqrt(a / Math.PI);
    }

    const diameter = 2 * radius;
    const circumference = 2 * Math.PI * radius;
    const area = Math.PI * radius * radius;

    el('circ-result').innerHTML = `
      <div class="summary-payment-box">
        <div class="label">Radius</div>
        <div class="value">${fmt(radius)}</div>
      </div>
      <div class="stat-row"><span>Diameter</span><strong>${fmt(diameter)}</strong></div>
      <div class="stat-row"><span>Circumference</span><strong>${fmt(circumference)}</strong></div>
      <div class="stat-row"><span>Area</span><strong>${fmt(area)}</strong></div>
    `;
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  calculate();
})();
