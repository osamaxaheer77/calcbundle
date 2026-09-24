'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('fv-form');
  if (!form) return;

  const currency = (v) => '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function num(id, fallback = 0) {
    const field = el(id);
    if (!field) return fallback;
    const v = parseFloat(field.value);
    return Number.isFinite(v) ? v : fallback;
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

  function annuityFactorFV(r, n, due) {
    if (r === 0) return n;
    return ((Math.pow(1 + r, n) - 1) / r) * (due ? (1 + r) : 1);
  }
  function annuityFactorPV(r, n, due) {
    if (r === 0) return n;
    return ((1 - Math.pow(1 + r, -n)) / r) * (due ? (1 + r) : 1);
  }

  function schedule(n, r, pv, pmt, due) {
    const rows = [];
    let balance = pv;
    for (let p = 1; p <= n; p++) {
      const start = balance;
      let interest;
      if (due) {
        balance += pmt;
        interest = balance * r;
        balance += interest;
      } else {
        interest = balance * r;
        balance += interest + pmt;
      }
      rows.push({ period: p, start, deposit: pmt, interest, balance });
    }
    return rows;
  }

  function calculate() {
    const n = Math.round(num('fv-years', 0));
    const pv = num('fv-pv', 0);
    const rate = num('fv-rate', 0) / 100;
    const pmt = num('fv-pmt', 0);
    const due = el('fv-timing').value === 'begin';

    if (n <= 0) {
      el('fv-result').innerHTML = '<p class="tool-result is-error">Enter a number of periods.</p>';
      return;
    }

    const fv = pv * Math.pow(1 + rate, n) + pmt * annuityFactorFV(rate, n, due);
    const totalDeposits = pmt * n;
    const totalPV = pv + pmt * annuityFactorPV(rate, n, due);
    const totalInterest = fv - pv - totalDeposits;

    el('fv-result').innerHTML = `
      <div class="summary-payment-box">
        <div class="label">Future Value</div>
        <div class="value">${currency(fv)}</div>
      </div>
      <div class="stat-row"><span>PV (Present Value)</span><strong>${currency(totalPV)}</strong></div>
      <div class="stat-row"><span>Total Periodic Deposits</span><strong>${currency(totalDeposits)}</strong></div>
      <div class="stat-row"><span>Total Interest</span><strong>${currency(totalInterest)}</strong></div>
      <div class="donut-wrap" style="margin-top:16px;">
        ${donutChart([{ value: Math.max(pv, 0), color: 'var(--accent)' }, { value: Math.max(totalDeposits, 0), color: '#6366f1' }, { value: Math.max(totalInterest, 0), color: '#10b981' }])}
        <div class="donut-legend">
          <span class="legend-item"><span class="legend-dot" style="background:var(--accent)"></span>Starting amount</span>
          <span class="legend-item"><span class="legend-dot" style="background:#6366f1"></span>Periodic deposits</span>
          <span class="legend-item"><span class="legend-dot" style="background:#10b981"></span>Interest</span>
        </div>
      </div>
    `;

    const rows = schedule(n, rate, pv, pmt, due);
    let tableHtml = '<table class="schedule-table"><thead><tr><th>Period</th><th>Start Balance</th><th>Deposit</th><th>Interest</th><th>End Balance</th></tr></thead><tbody>';
    rows.forEach((r) => {
      tableHtml += `<tr><td>${r.period}</td><td>${currency(r.start)}</td><td>${currency(r.deposit)}</td><td>${currency(r.interest)}</td><td>${currency(r.balance)}</td></tr>`;
    });
    tableHtml += '</tbody></table>';
    el('fv-table-wrap').innerHTML = tableHtml;
    el('fv-results-section').hidden = false;
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  calculate();
})();
