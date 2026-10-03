'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('st-form');
  if (!form) return;

  const money = (v) => '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pct = (v) => String(Math.round(v * 1000) / 1000);

  // An empty box is "unknown". Anything else must be a valid number.
  function read(id) {
    const raw = el(id).value.trim();
    if (raw === '') return null;
    const v = Number(raw);
    return Number.isFinite(v) ? v : NaN;
  }

  function showError(msg) {
    el('st-result').innerHTML = `<p class="tool-result is-error">${msg}</p>`;
  }

  function calculate() {
    const before = read('st-before');
    const rate = read('st-rate');
    const final = read('st-final');
    if ([before, rate, final].some((v) => Number.isNaN(v))) return showError('Enter numbers only in the boxes you fill in.');
    const filled = [before, rate, final].filter((v) => v !== null).length;
    if (filled < 2) return showError('Fill in any two of the three boxes, and leave the one you want to find empty.');
    if ((before !== null && before < 0) || (final !== null && final < 0)) return showError('Prices cannot be negative.');
    if (rate !== null && (rate < 0 || rate > 100)) return showError('Enter a sales tax rate between 0% and 100%.');

    let b, r, f, note = '';
    if (before !== null && rate !== null) {
      b = before; r = rate; f = b * (1 + r / 100);
      if (final !== null) note = 'You filled in all three boxes, so the after-tax price was worked out again from the first two. Clear one box to solve for it instead.';
    } else if (before !== null && final !== null) {
      if (before === 0) return showError('The before-tax price must be more than 0 to find a rate.');
      if (final < before) return showError('The after-tax price cannot be lower than the before-tax price.');
      b = before; f = final; r = (f / b - 1) * 100;
    } else {
      b = final / (1 + rate / 100); r = rate; f = final;
    }

    el('st-result').innerHTML =
      `<div class="summary-payment-box"><div class="label">After Tax Price</div><div class="value">${money(f)}</div><div class="label" style="margin-top:6px;">${pct(r)}% sales tax on ${money(b)}</div></div>` +
      `<div class="stat-row"><span>Before tax price</span><strong>${money(b)}</strong></div>` +
      `<div class="stat-row"><span>Sales tax rate</span><strong>${pct(r)}%</strong></div>` +
      `<div class="stat-row"><span>Sales tax</span><strong style="color:#10b981">${money(f - b)}</strong></div>` +
      `<div class="stat-row"><span>After tax price</span><strong>${money(f)}</strong></div>` +
      (note ? `<p style="font-size:12px;color:var(--text-secondary);margin:12px 0 0;">${note}</p>` : '');
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });

  // Clicking a state in the table puts its general state rate into the rate box.
  document.querySelectorAll('[data-state-rate]').forEach((btn) => {
    btn.addEventListener('click', () => {
      el('st-rate').value = btn.dataset.stateRate;
      el('st-final').value = '';
      if (el('st-before').value.trim() === '') el('st-before').value = '100';
      calculate();
      el('st-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  el('st-clear').addEventListener('click', () => {
    ['st-before', 'st-rate', 'st-final'].forEach((id) => { el(id).value = ''; });
    el('st-result').innerHTML = '';
  });

  calculate();
})();
