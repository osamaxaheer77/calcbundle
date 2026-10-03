'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('bt-form');
  if (!form) return;

  const GREEN = '#10b981';
  const AMBER = '#f59e0b';
  const money = (v) => (v < -0.005 ? '-$' : '$') + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  let sim = null;
  let view = 'annual';

  function num(id) {
    const raw = el(id).value.trim();
    if (raw === '') return NaN;
    const v = Number(raw);
    return Number.isFinite(v) ? v : NaN;
  }

  function showError(msg) {
    el('bt-result').innerHTML = `<p class="tool-result is-error">${msg}</p>`;
    el('bt-results-section').hidden = true;
    sim = null;
  }

  function donutChart(segments) {
    const total = segments.reduce((s, x) => s + Math.max(x.value, 0), 0) || 1;
    const r = 15.9155;
    let offset = 25;
    let circles = '';
    segments.forEach((seg) => {
      const p = Math.max(seg.value, 0) / total * 100;
      circles += `<circle cx="21" cy="21" r="${r}" fill="transparent" stroke="${seg.color}" stroke-width="4" stroke-dasharray="${p} ${100 - p}" stroke-dashoffset="${offset}"></circle>`;
      offset -= p;
    });
    return `<svg viewBox="0 0 42 42" class="donut">${circles}</svg>`;
  }

  const factor = (ratePct, n) => {
    const i = ratePct / 100 / 12;
    return i === 0 ? 1 / n : i / (1 - Math.pow(1 + i, -n));
  };

  function calculate() {
    const mode = el('bt-mode').value;
    const rate = num('bt-rate');
    const termRaw = num('bt-term');
    const termMonths = Math.round(el('bt-term-unit').value === 'y' ? termRaw * 12 : termRaw);
    const downVal = num('bt-down');
    const downPct = el('bt-down-unit').value === 'p';
    const trade = num('bt-trade');
    const taxPct = num('bt-tax');
    const fees = num('bt-fees');
    const include = el('bt-include').checked;

    if (!Number.isFinite(rate) || rate < 0 || rate > 100) return showError('Enter an interest rate between 0% and 100%.');
    if (!Number.isFinite(termMonths) || termMonths < 1 || termMonths > 600) return showError('Enter a loan term between 1 month and 50 years.');
    if ([downVal, trade, taxPct, fees].some((v) => !Number.isFinite(v) || v < 0)) return showError('Enter the down payment, trade-in, tax and fees as numbers, 0 or more.');
    if (downPct && downVal > 100) return showError('A down payment percentage cannot be more than 100%.');
    if (taxPct > 50) return showError('Enter a sales tax rate of 50% or less.');
    const d = downPct ? downVal / 100 : 0;      // down payment as a share of the price
    const dFixed = downPct ? 0 : downVal;       // down payment as a fixed amount
    const t = taxPct / 100;
    const pi = factor(rate, termMonths);

    let price, loan, payment;
    if (mode === 'price') {
      price = num('bt-price');
      if (!Number.isFinite(price) || price <= 0) return showError('Enter the boat price.');
      const down = downPct ? price * d : dFixed;
      const base = price - down - trade;
      if (base <= 0) return showError('The down payment and trade-in cover the whole price, so there is nothing to borrow.');
      loan = include ? base + price * t + fees : base;
      payment = loan * pi;
    } else {
      payment = num('bt-payment');
      if (!Number.isFinite(payment) || payment <= 0) return showError('Enter the monthly payment you can afford.');
      loan = payment / pi;
      // loan = price - down - trade (+ tax + fees when they are part of the loan)
      price = include
        ? (loan + dFixed + trade - fees) / (1 - d + t)
        : (loan + dFixed + trade) / (1 - d);
      if (!(price > 0)) return showError('Check your inputs. They do not leave room for a boat price at that payment.');
    }
    const down = downPct ? price * d : dFixed;
    const tax = price * t;
    const upfront = down + (include ? 0 : tax + fees);

    const rows = [];
    const i = rate / 100 / 12;
    let bal = loan;
    for (let k = 1; k <= termMonths; k++) {
      const interest = bal * i;
      let principal = payment - interest;
      if (k === termMonths || principal > bal) principal = bal;
      bal -= principal;
      rows.push({ k, interest, principal, end: bal < 0.005 ? 0 : bal });
    }
    const totalPaid = payment * termMonths;
    const interestTotal = totalPaid - loan;
    const totalCost = price + interestTotal + tax + fees;
    sim = { rows, annual: toYears(rows) };

    const stat = (l, v, c) => `<div class="stat-row"><span>${l}</span><strong${c ? ` style="color:${c}"` : ''}>${v}</strong></div>`;
    el('bt-result').innerHTML =
      `<div class="summary-payment-box"><div class="label">${mode === 'price' ? 'Monthly Pay' : 'Boat Price'}</div><div class="value">${money(mode === 'price' ? payment : price)}</div>` +
      `<div class="label" style="margin-top:6px;">${mode === 'price' ? `For ${termMonths} months on a ${money(price)} boat` : `You can afford this price with ${money(payment)} a month`}</div></div>` +
      (mode === 'payment' ? stat('Monthly pay', money(payment)) : stat('Boat price', money(price))) +
      stat('Total loan amount', money(loan)) +
      stat(`Sales tax${trade > 0 ? '*' : ''}`, money(tax)) +
      stat('Upfront payment', money(upfront)) +
      stat(`Total of ${termMonths} loan payments`, money(totalPaid)) +
      stat('Total loan interest', money(interestTotal), GREEN) +
      stat('Total cost (price, interest, tax, fees)', money(totalCost)) +
      (trade > 0 ? '<p style="font-size:12px;color:var(--text-secondary);margin:12px 0 0;">* Sales tax is worked out on the full price. Some states tax only the price after the trade-in, so check the rule where you live.</p>' : '') +
      `<div class="donut-wrap" style="margin-top:16px;">${donutChart([{ value: loan, color: 'var(--accent)' }, { value: interestTotal, color: GREEN }, { value: down + trade + (include ? 0 : tax + fees), color: AMBER }])}` +
      '<div class="donut-legend"><span class="legend-item"><span class="legend-dot" style="background:var(--accent)"></span>Amount borrowed</span>' +
      `<span class="legend-item"><span class="legend-dot" style="background:${GREEN}"></span>Interest</span>` +
      `<span class="legend-item"><span class="legend-dot" style="background:${AMBER}"></span>Paid up front</span></div></div>`;
    renderSchedule();
    el('bt-results-section').hidden = false;
  }

  function toYears(rows) {
    const out = [];
    for (let y = 0; y * 12 < rows.length; y++) {
      const part = rows.slice(y * 12, y * 12 + 12);
      out.push({ year: y + 1, interest: part.reduce((s, r) => s + r.interest, 0), principal: part.reduce((s, r) => s + r.principal, 0), end: part[part.length - 1].end });
    }
    return out;
  }

  function renderSchedule() {
    if (!sim) return;
    let html;
    if (view === 'annual') {
      html = '<table class="schedule-table"><thead><tr><th>Year</th><th>Interest</th><th>Principal</th><th>Ending Balance</th></tr></thead><tbody>';
      sim.annual.forEach((r) => { html += `<tr><td>${r.year}</td><td>${money(r.interest)}</td><td>${money(r.principal)}</td><td>${money(r.end)}</td></tr>`; });
    } else {
      html = '<table class="schedule-table"><thead><tr><th>Month</th><th>Interest</th><th>Principal</th><th>Ending Balance</th></tr></thead><tbody>';
      sim.rows.forEach((r) => {
        html += `<tr><td>${r.k}</td><td>${money(r.interest)}</td><td>${money(r.principal)}</td><td>${money(r.end)}</td></tr>`;
        if (r.k % 12 === 0 && r.k < sim.rows.length) html += `<tr><td colspan="4" style="text-align:center;font-weight:600;">End of year ${r.k / 12}</td></tr>`;
      });
    }
    el('bt-schedule-body').innerHTML = html + '</tbody></table>';
  }

  function applyMode() {
    const mode = el('bt-mode').value;
    form.querySelectorAll('[data-modes]').forEach((n) => { n.hidden = !n.dataset.modes.split(' ').includes(mode); });
  }

  function setView(v) {
    view = v;
    el('bt-toggle-annual').classList.toggle('active', v === 'annual');
    el('bt-toggle-monthly').classList.toggle('active', v === 'monthly');
    renderSchedule();
  }

  el('bt-mode').addEventListener('change', () => { applyMode(); calculate(); });
  el('bt-toggle-annual').addEventListener('click', () => setView('annual'));
  el('bt-toggle-monthly').addEventListener('click', () => setView('monthly'));
  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  applyMode();
  calculate();
})();
