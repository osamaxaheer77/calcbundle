'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('ds-form');
  if (!form) return;

  const money = (v) => (v < 0 ? '-$' : '$') + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pct = (v) => String(Math.round(v * 100) / 100);

  function read(id) {
    const raw = el(id).value.trim();
    if (raw === '') return null;
    const v = Number(raw);
    return Number.isFinite(v) ? v : NaN;
  }
  const error = (msg) => { el('ds-result').innerHTML = `<p class="tool-result is-error">${msg}</p>`; };
  const fixedMode = () => form.querySelector('input[name="ds-format"]:checked').value === 'f';

  function calculate() {
    const fixed = fixedMode();
    const before = read('ds-before'), disc = read('ds-discount'), after = read('ds-after');
    const saved = fixed ? null : read('ds-saved');
    const vals = [before, disc, after, saved];
    if (vals.some((v) => Number.isNaN(v))) return error('Enter numbers only in the boxes you fill in.');
    if (vals.filter((v) => v !== null).length < 2) return error('Fill in any two values, and the calculator finds the rest.');
    if (vals.some((v) => v !== null && v < 0)) return error('Prices, discounts and savings cannot be negative.');
    if (!fixed && disc !== null && disc > 100) return error('A percentage discount cannot be more than 100%.');

    let b, a, s, d; // before, after, saved, discount (percent)
    const has = (v) => v !== null;
    if (fixed) {
      // discount box is a dollar amount
      if (has(before) && has(disc)) { if (disc > before) return error('The discount cannot be more than the original price.'); b = before; s = disc; a = b - s; }
      else if (has(before) && has(after)) { if (after > before) return error('The price after the discount cannot be higher than the original price.'); b = before; a = after; s = b - a; }
      else if (has(disc) && has(after)) { s = disc; a = after; b = a + s; }
      else return error('In fixed amount mode, fill in two of the original price, the discount and the price after discount.');
      d = b > 0 ? (s / b) * 100 : 0;
    } else if (has(before) && has(disc)) { b = before; d = disc; s = b * d / 100; a = b - s; }
    else if (has(before) && has(after)) { if (after > before) return error('The price after the discount cannot be higher than the original price.'); b = before; a = after; s = b - a; d = b > 0 ? (s / b) * 100 : 0; }
    else if (has(disc) && has(after)) { if (disc >= 100) return error('A 100% discount leaves nothing to pay, so the original price cannot be found from the price after discount.'); d = disc; a = after; b = a / (1 - d / 100); s = b - a; }
    else if (has(before) && has(saved)) { if (saved > before) return error('The amount saved cannot be more than the original price.'); b = before; s = saved; a = b - s; d = b > 0 ? (s / b) * 100 : 0; }
    else if (has(disc) && has(saved)) { if (disc === 0) return error('A 0% discount saves nothing, so the original price cannot be found. Enter a discount above 0.'); d = disc; s = saved; b = s / (d / 100); a = b - s; }
    else { a = after; s = saved; b = a + s; d = b > 0 ? (s / b) * 100 : 0; }

    const row = (label, v, c) => `<div class="stat-row"><span>${label}</span><strong${c ? ` style="color:${c}"` : ''}>${v}</strong></div>`;
    el('ds-result').innerHTML =
      `<div class="summary-payment-box"><div class="label">Price after discount</div><div class="value">${money(a)}</div><div class="label" style="margin-top:6px;">You save ${money(s)} (${pct(d)}% off)</div></div>` +
      row('Price before discount', money(b)) + row('Discount', `${pct(d)}%`) + row('Amount you save', money(s), '#10b981') + row('Price after discount', money(a));
  }

  function applyFormat() {
    const fixed = fixedMode();
    el('ds-discount-label').textContent = fixed ? 'Discount ($ off)' : 'Discount (% off)';
    el('ds-saved-box').style.display = fixed ? 'none' : '';
  }

  form.querySelectorAll('input[name="ds-format"]').forEach((n) => n.addEventListener('change', () => { applyFormat(); calculate(); }));
  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  el('ds-clear').addEventListener('click', () => { ['ds-before', 'ds-discount', 'ds-after', 'ds-saved'].forEach((id) => { el(id).value = ''; }); el('ds-result').innerHTML = ''; });
  applyFormat();
  calculate();
})();
