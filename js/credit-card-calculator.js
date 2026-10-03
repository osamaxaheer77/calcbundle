'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('cc-form');
  if (!form) return;

  const GREEN = '#10b981';
  const money = (v) => (v < -0.005 ? '-$' : '$') + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  let sim = null;
  let view = 'year';

  function num(id) {
    const raw = el(id).value.trim();
    if (raw === '') return NaN;
    const v = Number(raw);
    return Number.isFinite(v) ? v : NaN;
  }

  const showError = (msg) => { el('cc-result').innerHTML = `<p class="tool-result is-error">${msg}</p>`; el('cc-results-section').hidden = true; sim = null; };

  function donut(principal, interest) {
    const total = principal + interest || 1, p1 = (principal / total) * 100, r = 15.9155;
    return '<div class="donut-wrap" style="margin-top:16px;"><svg viewBox="0 0 42 42" class="donut">' +
      `<circle cx="21" cy="21" r="${r}" fill="transparent" stroke="var(--accent)" stroke-width="4" stroke-dasharray="${p1} ${100 - p1}" stroke-dashoffset="25"></circle>` +
      `<circle cx="21" cy="21" r="${r}" fill="transparent" stroke="${GREEN}" stroke-width="4" stroke-dasharray="${100 - p1} ${p1}" stroke-dashoffset="${25 - p1}"></circle></svg>` +
      '<div class="donut-legend"><span class="legend-item"><span class="legend-dot" style="background:var(--accent)"></span>Principal</span>' +
      `<span class="legend-item"><span class="legend-dot" style="background:${GREEN}"></span>Interest</span></div></div>`;
  }

  function monthsText(n) {
    const y = Math.floor(n / 12), m = n - y * 12;
    const parts = [];
    if (y) parts.push(`${y} ${y === 1 ? 'year' : 'years'}`);
    if (m || !y) parts.push(`${m} ${m === 1 ? 'month' : 'months'}`);
    return parts.join(' and ');
  }

  function schedule(balance, i, payment) {
    const rows = [];
    let bal = balance;
    for (let k = 1; k <= 1200 && bal > 0.005; k++) {
      const interest = bal * i;
      let pay = payment;
      if (bal + interest <= payment + 0.005) pay = bal + interest;
      const end = bal + interest - pay;
      rows.push({ k, interest, principal: pay - interest, pay, end: end < 0.005 ? 0 : end });
      bal = end < 0.005 ? 0 : end;
    }
    return rows;
  }

  function calculate() {
    const balance = num('cc-balance'), rate = num('cc-rate');
    const way = form.querySelector('input[name="cc-way"]:checked').value;
    if (!Number.isFinite(balance) || balance <= 0) return showError('Enter your credit card balance.');
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) return showError('Enter an interest rate between 0% and 100%.');
    const i = rate / 1200;
    let payment, rows, lead;
    if (way === 'pay') {
      payment = num('cc-payment');
      if (!Number.isFinite(payment) || payment <= 0) return showError('Enter the amount you will pay each month.');
      if (payment <= balance * i + 1e-9) return showError(`It is unlikely that you can pay off the balance with a monthly payment of ${money(payment)}. You will need to pay more than ${money(balance * i)} a month, because that is the interest charged in the first month.`);
      rows = schedule(balance, i, payment);
      lead = { label: 'Time to pay off the balance', value: monthsText(rows.length), sub: `Paying ${money(payment)} every month` };
    } else {
      const years = num('cc-years'), months = num('cc-months');
      if (!Number.isFinite(years) || !Number.isFinite(months) || years < 0 || months < 0) return showError('Enter the time in years and months.');
      const n = Math.round(years * 12 + months);
      if (n < 1 || n > 600) return showError('Enter a payoff time between 1 month and 50 years.');
      payment = i === 0 ? balance / n : (balance * i) / (1 - Math.pow(1 + i, -n));
      rows = schedule(balance, i, payment);
      lead = { label: 'Monthly payment needed', value: money(payment), sub: `To pay off the balance in ${monthsText(n)}` };
    }
    const total = rows.reduce((s, r) => s + r.pay, 0);
    const interest = total - balance;
    sim = { rows };
    const stat = (l, v, c) => `<div class="stat-row"><span>${l}</span><strong${c ? ` style="color:${c}"` : ''}>${v}</strong></div>`;
    el('cc-result').innerHTML =
      `<div class="summary-payment-box"><div class="label">${lead.label}</div><div class="value">${lead.value}</div><div class="label" style="margin-top:6px;">${lead.sub}</div></div>` +
      stat('Total interest', money(interest), GREEN) + stat('Total of all payments', money(total)) + stat('Starting balance', money(balance)) + donut(balance, interest);
    renderSchedule();
    el('cc-results-section').hidden = false;
  }

  function renderSchedule() {
    if (!sim) return;
    let html;
    if (view === 'month') {
      html = '<table class="schedule-table"><thead><tr><th>Month</th><th>Interest</th><th>Principal</th><th>Ending Balance</th></tr></thead><tbody>';
      sim.rows.forEach((r) => { html += `<tr><td>${r.k}</td><td>${money(r.interest)}</td><td>${money(r.principal)}</td><td>${money(r.end)}</td></tr>`; });
    } else {
      html = '<table class="schedule-table"><thead><tr><th>Year</th><th>Interest</th><th>Principal</th><th>Ending Balance</th></tr></thead><tbody>';
      for (let y = 0; y * 12 < sim.rows.length; y++) {
        const part = sim.rows.slice(y * 12, y * 12 + 12);
        html += `<tr><td>${y + 1}</td><td>${money(part.reduce((s, r) => s + r.interest, 0))}</td><td>${money(part.reduce((s, r) => s + r.principal, 0))}</td><td>${money(part[part.length - 1].end)}</td></tr>`;
      }
    }
    el('cc-table-wrap').innerHTML = html + '</tbody></table>';
  }

  function applyWay() {
    const way = form.querySelector('input[name="cc-way"]:checked').value;
    form.querySelectorAll('[data-modes]').forEach((n) => { n.hidden = n.dataset.modes !== way; });
  }

  // Quick payment choices: interest plus 1% of the balance, or 2% to 5% of the balance (never below $15).
  document.querySelectorAll('[data-quick]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const balance = num('cc-balance'), rate = num('cc-rate');
      if (!Number.isFinite(balance) || !Number.isFinite(rate)) return;
      const k = Number(btn.dataset.quick);
      let v = k === 1 ? balance * 0.01 + (balance * rate) / 1200 : balance * 0.01 * k;
      if (v < 15) v = balance < 15 ? balance : 15;
      el('cc-payment').value = v.toFixed(2);
      form.querySelector('input[name="cc-way"][value="pay"]').checked = true;
      applyWay();
      calculate();
    });
  });

  function setView(v) { view = v; el('cc-toggle-year').classList.toggle('active', v === 'year'); el('cc-toggle-month').classList.toggle('active', v === 'month'); renderSchedule(); }

  form.querySelectorAll('input[name="cc-way"]').forEach((n) => n.addEventListener('change', () => { applyWay(); calculate(); }));
  el('cc-toggle-year').addEventListener('click', () => setView('year'));
  el('cc-toggle-month').addEventListener('click', () => setView('month'));
  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  applyWay();
  calculate();
})();
