'use strict';

// Shared helpers for the crypto futures and forex calculators.
window.TradeCommon = (function () {
  const el = (id) => document.getElementById(id);

  // Reads a number field. Empty gives null, anything that is not a number gives NaN.
  function num(id) {
    const node = el(id);
    if (!node) return null;
    const raw = node.value.trim().replace(/,/g, '');
    if (raw === '') return null;
    const v = Number(raw);
    return Number.isFinite(v) ? v : NaN;
  }
  const group = (s) => s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  function fixed(v, d) {
    const s = Math.abs(v).toFixed(d);
    const [i, f] = s.split('.');
    return (v < 0 && Number(s) !== 0 ? '-' : '') + group(i) + (f ? '.' + f : '');
  }
  // Money with 2 decimals, for example 2,500.00
  const usd = (v) => fixed(v, 2);
  // A price with enough decimals for its size, trailing zeros trimmed to at least 2 places.
  function price(v) {
    const d = Math.abs(v) >= 1000 ? 2 : Math.abs(v) >= 1 ? 4 : Math.abs(v) >= 0.01 ? 6 : 8;
    let s = fixed(v, d);
    if (s.includes('.')) {
      s = s.replace(/0+$/, '');
      const dec = s.split('.')[1] || '';
      if (dec.length < 2) s += '0'.repeat(2 - dec.length);
    }
    return s;
  }
  // A coin or lot amount with up to `max` decimals, trailing zeros trimmed.
  function amount(v, max) {
    let s = fixed(v, max === undefined ? 8 : max);
    if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
    return s;
  }
  const pct = (v, d) => fixed(v, d === undefined ? 2 : d) + '%';
  const error = (id, msg) => { el(id).innerHTML = `<p class="tool-result is-error">${msg}</p>`; };
  const row = (label, value, color) => `<div class="stat-row"><span>${label}</span><strong${color ? ` style="color:${color}"` : ''}>${value}</strong></div>`;
  const big = (label, value, sub, color) => `<div class="summary-payment-box"><div class="label">${label}</div><div class="value"${color ? ` style="color:${color}"` : ''}>${value}</div>${sub ? `<div class="label" style="margin-top:6px;">${sub}</div>` : ''}</div>`;
  const GREEN = '#10b981', RED = '#ef4444';
  const side = (name) => document.querySelector(`input[name="${name}"]:checked`).value;
  // Runs `fn` on submit and whenever any input or select inside the form changes.
  function wire(formId, fn) {
    const form = el(formId);
    form.addEventListener('submit', (e) => { e.preventDefault(); fn(); });
    form.querySelectorAll('select, input[type="radio"], input[type="checkbox"]').forEach((n) => n.addEventListener('change', fn));
    fn();
  }
  return { el, num, fixed, usd, price, amount, pct, error, row, big, GREEN, RED, side, wire, group };
})();
