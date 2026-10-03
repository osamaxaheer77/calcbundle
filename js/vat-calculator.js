'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('vat-form');
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

  const error = (msg) => { el('vat-result').innerHTML = `<p class="tool-result is-error">${msg}</p>`; };

  function calculate() {
    const rate = read('vat-rate'), net = read('vat-net'), gross = read('vat-gross'), tax = read('vat-tax');
    const given = { rate, net, gross, tax };
    if (Object.values(given).some((v) => Number.isNaN(v))) return error('Enter numbers only in the boxes you fill in.');
    if (Object.values(given).filter((v) => v !== null).length < 2) return error('Fill in any two of the four boxes, and the calculator finds the other two.');
    if ([net, gross, tax].some((v) => v !== null && v < 0)) return error('Prices and the tax amount cannot be negative.');
    if (rate !== null && (rate < 0 || rate > 1000)) return error('Enter a VAT rate between 0% and 1000%.');

    let r, n, g, t, note = '';
    const has = (v) => v !== null;
    if (has(rate) && has(net)) { r = rate; n = net; t = n * r / 100; g = n + t; }
    else if (has(rate) && has(gross)) { r = rate; g = gross; n = g / (1 + r / 100); t = g - n; }
    else if (has(rate) && has(tax)) {
      if (rate === 0) return error('A VAT rate of 0% means no tax, so a tax amount cannot be used to find the price. Enter a rate above 0.');
      r = rate; t = tax; n = t / (r / 100); g = n + t;
    }
    else if (has(net) && has(gross)) {
      if (gross < net) return error('The gross price cannot be lower than the net price.');
      if (net === 0) return error('The net price must be more than 0 to find a rate.');
      n = net; g = gross; t = g - n; r = (t / n) * 100;
    }
    else if (has(net) && has(tax)) {
      if (net === 0) return error('The net price must be more than 0 to find a rate.');
      n = net; t = tax; g = n + t; r = (t / n) * 100;
    }
    else {
      if (tax > gross) return error('The tax amount cannot be more than the gross price.');
      g = gross; t = tax; n = g - t;
      if (n === 0) return error('The gross price and the tax amount leave a net price of 0, so no rate can be found.');
      r = (t / n) * 100;
    }
    if (Object.values(given).filter((v) => v !== null).length > 2) note = 'You filled in more than two boxes, so the others were worked out again from the first two it could use. Clear a box to solve for it instead.';

    const row = (label, v, c) => `<div class="stat-row"><span>${label}</span><strong${c ? ` style="color:${c}"` : ''}>${v}</strong></div>`;
    el('vat-result').innerHTML =
      `<div class="summary-payment-box"><div class="label">Gross price (with VAT)</div><div class="value">${money(g)}</div><div class="label" style="margin-top:6px;">${pct(r)}% VAT on a net price of ${money(n)}</div></div>` +
      row('VAT rate', `${pct(r)}%`) + row('Net price (before VAT)', money(n)) + row('VAT amount', money(t), '#10b981') + row('Gross price (after VAT)', money(g)) +
      (note ? `<p style="font-size:12px;color:var(--text-secondary);margin:12px 0 0;">${note}</p>` : '');
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  el('vat-clear').addEventListener('click', () => { ['vat-rate', 'vat-net', 'vat-gross', 'vat-tax'].forEach((id) => { el(id).value = ''; }); el('vat-result').innerHTML = ''; });
  calculate();
})();
