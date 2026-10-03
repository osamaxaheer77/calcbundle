'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  if (!el('mg1-form')) return;

  const money = (v) => (v < 0 ? '-$' : '$') + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pct = (v) => (v < 0 ? '-' : '') + Math.abs(v).toFixed(2) + '%';
  const read = (id) => { const raw = el(id).value.trim(); if (raw === '') return null; const v = Number(raw); return Number.isFinite(v) ? v : NaN; };
  const error = (id, msg) => { el(id).innerHTML = `<p class="tool-result is-error">${msg}</p>`; };
  const row = (label, v, c) => `<div class="stat-row"><span>${label}</span><strong${c ? ` style="color:${c}"` : ''}>${v}</strong></div>`;

  // ---------- Profit margin: any two of cost, revenue, margin, profit ----------
  function profit() {
    const cost = read('mg1-cost'), sale = read('mg1-sale'), margin = read('mg1-margin'), prof = read('mg1-profit');
    const v = [cost, sale, margin, prof];
    if (v.some((x) => Number.isNaN(x))) return error('mg1-result', 'Enter numbers only in the boxes you fill in.');
    if (v.filter((x) => x !== null).length < 2) return error('mg1-result', 'Fill in any two of the four boxes, and the calculator finds the rest.');
    if ((cost !== null && cost < 0) || (sale !== null && sale < 0)) return error('mg1-result', 'Cost and revenue cannot be negative.');
    if (margin !== null && margin >= 100) return error('mg1-result', 'A margin must be below 100%, because it is the share of revenue that is profit.');
    const has = (x) => x !== null;
    let c, r, p;
    if (has(cost) && has(sale)) { c = cost; r = sale; p = r - c; }
    else if (has(cost) && has(margin)) { c = cost; r = c / (1 - margin / 100); p = r - c; }
    else if (has(cost) && has(prof)) { c = cost; p = prof; r = c + p; }
    else if (has(sale) && has(margin)) { r = sale; p = r * margin / 100; c = r - p; }
    else if (has(sale) && has(prof)) { r = sale; p = prof; c = r - p; }
    else {
      if (margin === 0) return error('mg1-result', 'With a margin of 0% there is no profit, so revenue and cost cannot be found from a profit amount. Enter a margin above 0.');
      p = prof; r = p / (margin / 100); c = r - p;
    }
    if (r === 0) return error('mg1-result', 'Revenue must be more than 0 to work out a margin.');
    const m = (p / r) * 100;
    const mk = c !== 0 ? (p / c) * 100 : NaN;
    el('mg1-result').innerHTML =
      `<div class="summary-payment-box"><div class="label">Profit margin</div><div class="value">${pct(m)}</div><div class="label" style="margin-top:6px;">${money(p)} profit on ${money(r)} of revenue</div></div>` +
      row('Cost', money(c)) + row('Revenue', money(r)) + row('Profit', money(p), p >= 0 ? '#10b981' : '#dc2626') + row('Margin', pct(m)) + row('Markup', Number.isNaN(mk) ? 'n/a' : pct(mk)) +
      (Object.values({ cost, sale, margin, prof }).filter((x) => x !== null).length > 2 ? '<p style="font-size:12px;color:var(--text-secondary);margin:12px 0 0;">You filled in more than two boxes, so the calculator used the first pair it could. Clear a box to solve for it instead.</p>' : '');
  }

  // ---------- Stock margin ----------
  function stock() {
    const price = read('mg2-price'), shares = read('mg2-shares'), ratio = read('mg2-ratio');
    if ([price, shares, ratio].some((x) => x === null || Number.isNaN(x) || x < 0)) return error('mg2-result', 'Enter the stock price, number of shares and margin requirement as numbers, 0 or more.');
    if (ratio > 100) return error('mg2-result', 'Enter a margin requirement of 100% or less.');
    const total = price * shares, need = total * ratio / 100;
    el('mg2-result').innerHTML =
      `<div class="summary-payment-box"><div class="label">Amount required</div><div class="value">${money(need)}</div><div class="label" style="margin-top:6px;">Minimum cash needed in the account</div></div>` +
      row('Value of the shares', money(total)) + row('Margin requirement', `${Math.round(ratio * 1000) / 1000}%`) + row('Borrowed from the broker', money(total - need));
  }

  // ---------- Currency margin ----------
  function currency() {
    const rate = read('mg3-rate'), units = read('mg3-units'), lev = Number(el('mg3-ratio').value);
    if ([rate, units].some((x) => x === null || Number.isNaN(x) || x < 0)) return error('mg3-result', 'Enter the exchange rate and the units as numbers, 0 or more.');
    const value = rate * units, need = value / lev;
    el('mg3-result').innerHTML =
      `<div class="summary-payment-box"><div class="label">Amount required</div><div class="value">${need.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 3 })}</div><div class="label" style="margin-top:6px;">In your home currency</div></div>` +
      row('Value of the position', value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })) + row('Margin ratio', `${lev}:1`) + row('Margin percentage', `${Math.round((100 / lev) * 1000) / 1000}%`);
  }

  const hook = (id, fn) => { el(id).addEventListener('submit', (e) => { e.preventDefault(); fn(); }); fn(); };
  hook('mg1-form', profit);
  hook('mg2-form', stock);
  hook('mg3-form', currency);
  el('mg1-clear').addEventListener('click', () => { ['mg1-cost', 'mg1-sale', 'mg1-margin', 'mg1-profit'].forEach((id) => { el(id).value = ''; }); el('mg1-result').innerHTML = ''; });
})();
