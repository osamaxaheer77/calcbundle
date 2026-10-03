'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('pl-form');
  if (!form) return;

  const GREEN = '#10b981';
  const MONTHS = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.'];
  const money = (v) => (v < -0.005 ? '-$' : '$') + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  let sim = null;
  let view = 'year';

  function num(id) {
    const raw = el(id).value.trim();
    if (raw === '') return NaN;
    const v = Number(raw);
    return Number.isFinite(v) ? v : NaN;
  }

  function showError(msg) {
    el('pl-result').innerHTML = `<p class="tool-result is-error">${msg}</p>`;
    el('pl-results-section').hidden = true;
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

  // Annual percentage rate: the yearly rate (monthly rate times 12) at which the payments, including any
  // monthly insurance, repay the cash the borrower actually receives after the origination fee.
  function aprFor(cash, payment, n) {
    if (cash <= 0 || payment <= 0) return NaN;
    if (Math.abs(payment * n - cash) < 1e-6) return 0;
    let lo = 0, hi = 1;
    for (let k = 0; k < 200; k++) {
      const m = (lo + hi) / 2;
      const pv = (payment * (1 - Math.pow(1 + m, -n))) / m;
      if (pv > cash) lo = m; else hi = m;
    }
    return ((lo + hi) / 2) * 12;
  }

  const dateText = (idx) => `${MONTHS[idx % 12]} ${Math.floor(idx / 12)}`;
  const dateShort = (idx) => `${(idx % 12) + 1}/${Math.floor(idx / 12)}`;

  function calculate() {
    const amount = num('pl-amount'), rate = num('pl-rate');
    const years = num('pl-years'), months = num('pl-months');
    const startMonth = parseInt(el('pl-start-month').value, 10), startYear = num('pl-start-year');
    const optional = el('pl-optional').checked;
    const feeValue = optional ? num('pl-fee') : 0;
    const feeIsPct = el('pl-fee-type').value === 'percentage';
    const feeDeducted = form.querySelector('input[name="pl-fee-paid"]:checked').value === 'deduct';
    const insurance = optional ? num('pl-insurance') : 0;

    if (!Number.isFinite(amount) || amount <= 0) return showError('Enter the loan amount.');
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) return showError('Enter an interest rate between 0% and 100%.');
    if (!Number.isFinite(years) || !Number.isFinite(months) || years < 0 || months < 0) return showError('Enter the loan term in years and months.');
    const n = Math.round(years * 12 + months);
    if (n < 1 || n > 600) return showError('Enter a loan term between 1 month and 50 years.');
    if (!Number.isFinite(startYear) || startYear < 1900 || startYear > 2200) return showError('Enter a valid start year.');
    if (optional && (!Number.isFinite(feeValue) || feeValue < 0 || !Number.isFinite(insurance) || insurance < 0)) return showError('Enter the fee and insurance as numbers, 0 or more.');
    const fee = optional ? (feeIsPct ? (amount * feeValue) / 100 : feeValue) : 0;
    if (fee >= amount) return showError('The origination fee must be less than the loan amount.');

    const i = rate / 100 / 12;
    const payment = i === 0 ? amount / n : (amount * i) / (1 - Math.pow(1 + i, -n));
    const startIdx = startYear * 12 + (startMonth - 1);

    const rows = [];
    let bal = amount;
    for (let k = 1; k <= n; k++) {
      const interest = bal * i;
      let principal = payment - interest;
      if (k === n) principal = bal;
      const end = bal - principal;
      rows.push({ k, idx: startIdx + k - 1, interest, principal, end: Math.abs(end) < 0.005 ? 0 : end });
      bal = Math.abs(end) < 0.005 ? 0 : end;
    }
    const total = payment * n;
    const interestTotal = total - amount;
    const insuranceTotal = insurance * n;
    const cash = feeDeducted ? amount - fee : amount;
    const apr = aprFor(amount - fee, payment + insurance, n);
    const costOfLoan = interestTotal + fee + insuranceTotal;
    const payoff = dateText(startIdx + n);

    sim = { rows, startIdx };
    const stat = (l, v, c) => `<div class="stat-row"><span>${l}</span><strong${c ? ` style="color:${c}"` : ''}>${v}</strong></div>`;
    el('pl-result').innerHTML =
      `<div class="summary-payment-box"><div class="label">Monthly Pay</div><div class="value">${money(payment)}</div><div class="label" style="margin-top:6px;">${n} payments, paid off by ${payoff}</div></div>` +
      (optional && feeDeducted ? stat('Cash received', money(cash)) : '') +
      (insurance > 0 ? stat('Monthly pay + insurance', money(payment + insurance)) : '') +
      stat(`Total of ${n} loan payments`, money(total)) +
      stat('Total interest', money(interestTotal), GREEN) +
      (insurance > 0 ? stat('Total insurance', money(insuranceTotal)) : '') +
      (fee > 0 ? stat('Origination fee', money(fee)) : '') +
      (optional && (fee > 0 || insurance > 0) ? stat('Cost of loan', money(costOfLoan)) + stat('APR', (apr * 100).toFixed(3) + '%') : '') +
      stat('Payoff date', payoff) +
      `<div class="donut-wrap" style="margin-top:16px;">${donutChart([{ value: amount, color: 'var(--accent)' }, { value: interestTotal, color: GREEN }, { value: fee + insuranceTotal, color: '#f59e0b' }])}` +
      '<div class="donut-legend"><span class="legend-item"><span class="legend-dot" style="background:var(--accent)"></span>Principal</span>' +
      `<span class="legend-item"><span class="legend-dot" style="background:${GREEN}"></span>Interest</span>` +
      (fee + insuranceTotal > 0 ? '<span class="legend-item"><span class="legend-dot" style="background:#f59e0b"></span>Fee and insurance</span>' : '') + '</div></div>';
    renderSchedule();
    el('pl-results-section').hidden = false;
  }

  function renderSchedule() {
    if (!sim) return;
    let html;
    if (view === 'year') {
      html = '<table class="schedule-table"><thead><tr><th>Year</th><th>Date</th><th>Interest</th><th>Principal</th><th>Ending Balance</th></tr></thead><tbody>';
      const groups = [];
      sim.rows.forEach((r) => { const y = Math.floor(r.idx / 12); let g = groups[groups.length - 1]; if (!g || g.y !== y) { g = { y, rows: [] }; groups.push(g); } g.rows.push(r); });
      groups.forEach((g, k) => {
        const a = g.rows[0], b = g.rows[g.rows.length - 1];
        html += `<tr><td>${k + 1}</td><td>${dateShort(a.idx)} to ${dateShort(b.idx)}</td><td>${money(g.rows.reduce((s, r) => s + r.interest, 0))}</td><td>${money(g.rows.reduce((s, r) => s + r.principal, 0))}</td><td>${money(b.end)}</td></tr>`;
      });
    } else {
      html = '<table class="schedule-table"><thead><tr><th>Month</th><th>Date</th><th>Interest</th><th>Principal</th><th>Ending Balance</th></tr></thead><tbody>';
      sim.rows.forEach((r) => {
        html += `<tr><td>${r.k}</td><td>${dateShort(r.idx)}</td><td>${money(r.interest)}</td><td>${money(r.principal)}</td><td>${money(r.end)}</td></tr>`;
        if (r.idx % 12 === 11 && r.k < sim.rows.length) html += `<tr><td colspan="5" style="text-align:center;font-weight:600;">End of ${Math.floor(r.idx / 12)}</td></tr>`;
      });
    }
    el('pl-table-wrap').innerHTML = html + '</tbody></table>';
  }

  function applyOptional() { el('pl-optional-box').hidden = !el('pl-optional').checked; }

  function setView(v) {
    view = v;
    el('pl-toggle-year').classList.toggle('active', v === 'year');
    el('pl-toggle-month').classList.toggle('active', v === 'month');
    renderSchedule();
  }

  // Month list and default start date (this month).
  (function init() {
    const sel = el('pl-start-month');
    MONTHS.forEach((m, k) => { const o = document.createElement('option'); o.value = k + 1; o.textContent = m.replace('.', ''); sel.appendChild(o); });
    const now = new Date();
    sel.value = now.getMonth() + 1;
    el('pl-start-year').value = now.getFullYear();
  })();

  el('pl-optional').addEventListener('change', () => { applyOptional(); calculate(); });
  el('pl-toggle-year').addEventListener('click', () => setView('year'));
  el('pl-toggle-month').addEventListener('click', () => setView('month'));
  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  applyOptional();
  calculate();
})();
