'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('ir-form');
  if (!form) return;

  const currency = (v) => '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const currency0 = (v) => '$' + Math.round(v).toLocaleString('en-US');

  function num(id, fallback = 0) {
    const v = parseFloat(el(id).value);
    return Number.isFinite(v) ? v : fallback;
  }

  function donutChart(segments) {
    const total = segments.reduce((s, x) => s + x.value, 0) || 1;
    const r = 15.9155;
    let offset = 25;
    let circles = '';
    segments.forEach((seg) => {
      const p = seg.value / total * 100;
      circles += `<circle cx="21" cy="21" r="${r}" fill="transparent" stroke="${seg.color}" stroke-width="4" stroke-dasharray="${p} ${100 - p}" stroke-dashoffset="${offset}"></circle>`;
      offset -= p;
    });
    return `<svg viewBox="0 0 42 42" class="donut">${circles}</svg>`;
  }

  function solveRate(loanAmount, payment, termMonths) {
    function pv(ratePct) {
      const r = ratePct / 100 / 12;
      if (r === 0) return payment * termMonths;
      return payment * (1 - Math.pow(1 + r, -termMonths)) / r;
    }
    let lo = 0, hi = 100;
    for (let i = 0; i < 100; i++) {
      const mid = (lo + hi) / 2;
      if (pv(mid) > loanAmount) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }

  function calculate() {
    const loanAmount = num('ir-amount', 0);
    const termYears = num('ir-term-years', 0);
    const termMonthsExtra = num('ir-term-months', 0);
    const payment = num('ir-payment', 0);
    const termMonths = Math.round(termYears * 12 + termMonthsExtra);

    if (!(loanAmount > 0) || !(termMonths > 0) || !(payment > 0)) {
      el('ir-result').innerHTML = '<p class="tool-result is-error">Enter the loan amount, term, and monthly payment.</p>';
      return;
    }
    if (payment * termMonths <= loanAmount) {
      el('ir-result').innerHTML = '<p class="tool-result is-error">This monthly payment is too low to pay off the loan over this term at any positive interest rate.</p>';
      return;
    }

    const rate = solveRate(loanAmount, payment, termMonths);
    const totalPaid = payment * termMonths;
    const totalInterest = totalPaid - loanAmount;

    el('ir-result').innerHTML = `
      <div class="summary-payment-box">
        <div class="label">Interest Rate</div>
        <div class="value">${rate.toFixed(3)}%</div>
      </div>
      <div class="stat-row"><span>Total of ${termMonths} Monthly Payments</span><strong>${currency0(totalPaid)}</strong></div>
      <div class="stat-row"><span>Total Interest Paid</span><strong>${currency0(totalInterest)}</strong></div>
      <div class="donut-wrap" style="margin-top:16px;">
        ${donutChart([{ value: loanAmount, color: 'var(--accent)', label: 'Principal' }, { value: totalInterest, color: '#10b981', label: 'Interest' }])}
        <div class="donut-legend">
          <span class="legend-item"><span class="legend-dot" style="background:var(--accent)"></span>Principal</span>
          <span class="legend-item"><span class="legend-dot" style="background:#10b981"></span>Interest</span>
        </div>
      </div>
    `;
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  calculate();
})();
