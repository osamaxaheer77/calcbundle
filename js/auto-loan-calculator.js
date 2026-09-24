'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('auto-form');
  if (!form) return;

  const currency = (v) => '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const currency0 = (v) => '$' + Math.round(v).toLocaleString('en-US');

  function num(id, fallback = 0) {
    const field = el(id);
    if (!field) return fallback;
    const v = parseFloat(field.value);
    return Number.isFinite(v) ? v : fallback;
  }

  function monthlyPIFactor(annualRatePct, termMonths) {
    const r = annualRatePct / 100 / 12;
    if (termMonths <= 0) return 0;
    if (r === 0) return 1 / termMonths;
    return r / (1 - Math.pow(1 + r, -termMonths));
  }

  function simulate(loanAmount, annualRatePct, payment, termMonths) {
    const monthlyRate = annualRatePct / 100 / 12;
    let bal = loanAmount;
    const months = [];
    let totalInterest = 0;
    for (let m = 1; m <= termMonths && bal > 0.005; m++) {
      const interest = bal * monthlyRate;
      let principal = payment - interest;
      if (principal > bal) principal = bal;
      bal -= principal;
      totalInterest += interest;
      months.push({ month: m, interest, principal, balance: Math.max(bal, 0) });
    }
    return { months, totalInterest, totalPaid: months.reduce((s, x) => s + x.interest + x.principal, 0) };
  }

  function donutChart(segments) {
    const total = segments.reduce((s, x) => s + x.value, 0) || 1;
    const r = 15.9155;
    let offset = 25;
    let circles = '';
    segments.forEach((seg) => {
      const p = (seg.value / total) * 100;
      circles += `<circle cx="21" cy="21" r="${r}" fill="transparent" stroke="${seg.color}" stroke-width="4" stroke-dasharray="${p} ${100 - p}" stroke-dashoffset="${offset}"></circle>`;
      offset -= p;
    });
    return `<svg viewBox="0 0 42 42" class="donut">${circles}</svg>`;
  }

  function lineChart(months, width = 560, height = 200) {
    if (!months.length) return '';
    const maxVal = Math.max(...months.map((m) => m.balance), months[0].balance);
    let cumInterest = 0, cumPayment = 0;
    const interestSeries = [], paymentSeries = [];
    months.forEach((m) => { cumInterest += m.interest; cumPayment += m.principal + m.interest; interestSeries.push(cumInterest); paymentSeries.push(cumPayment); });
    const maxY = Math.max(maxVal, ...interestSeries, ...paymentSeries) || 1;
    const stepX = width / (months.length - 1 || 1);
    const toPoints = (arr) => arr.map((v, i) => `${(i * stepX).toFixed(1)},${(height - (v / maxY) * height).toFixed(1)}`).join(' ');
    return `
      <svg viewBox="0 0 ${width} ${height}" class="line-chart" preserveAspectRatio="none">
        <polyline points="${toPoints(paymentSeries)}" fill="none" stroke="#dc2626" stroke-width="2" />
        <polyline points="${toPoints(interestSeries)}" fill="none" stroke="#10b981" stroke-width="2" />
        <polyline points="${toPoints(months.map((m) => m.balance))}" fill="none" stroke="var(--accent)" stroke-width="2.5" />
      </svg>`;
  }

  function toAnnualSchedule(months) {
    const years = [];
    let bucket = null;
    months.forEach((m, i) => {
      if (!bucket || (i % 12 === 0)) { bucket = { yearIndex: years.length + 1, interest: 0, principal: 0, endingBalance: 0 }; years.push(bucket); }
      bucket.interest += m.interest;
      bucket.principal += m.principal;
      bucket.endingBalance = m.balance;
    });
    return years;
  }

  function renderSchedule(bodyId, view, annualRows, monthlyRows) {
    const box = el(bodyId);
    let html = '';
    if (view === 'annual') {
      html += '<table class="schedule-table"><thead><tr><th>Year</th><th>Interest</th><th>Principal</th><th>Ending Balance</th></tr></thead><tbody>';
      annualRows.forEach((r) => { html += `<tr><td>${r.yearIndex}</td><td>${currency0(r.interest)}</td><td>${currency0(r.principal)}</td><td>${currency0(r.endingBalance)}</td></tr>`; });
    } else {
      html += '<table class="schedule-table"><thead><tr><th>Month</th><th>Interest</th><th>Principal</th><th>Ending Balance</th></tr></thead><tbody>';
      monthlyRows.forEach((r) => { html += `<tr><td>${r.month}</td><td>${currency0(r.interest)}</td><td>${currency0(r.principal)}</td><td>${currency0(r.balance)}</td></tr>`; });
    }
    html += '</tbody></table>';
    box.innerHTML = html;
  }

  let lastSim = null;
  let scheduleView = 'annual';

  function calculate() {
    const mode = form.querySelector('input[name="auto-mode"]:checked').value;
    const term = num('auto-term', 60);
    const rate = num('auto-rate', 0);
    const incentive = num('auto-incentive', 0);
    const down = num('auto-down', 0);
    const tradeInValue = num('auto-tradein-value', 0);
    const tradeInOwed = num('auto-tradein-owed', 0);
    const salesTaxPct = num('auto-tax', 0);
    const fees = num('auto-fees', 0);
    const includeInLoan = el('auto-include-loan').checked;
    const tradeInEquity = tradeInValue - tradeInOwed;

    let price, loanBase;
    if (mode === 'price') {
      price = num('auto-price', 0);
      if (!(price > 0)) { el('auto-result').innerHTML = '<p class="tool-result is-error">Enter the auto price.</p>'; return; }
      loanBase = price - incentive - down - tradeInEquity;
    } else {
      const monthlyPay = num('auto-monthly-pay', 0);
      if (!(monthlyPay > 0)) { el('auto-result').innerHTML = '<p class="tool-result is-error">Enter the desired monthly payment.</p>'; return; }
      const piFactor = monthlyPIFactor(rate, term);
      const salesTaxOnLoanFactor = includeInLoan ? salesTaxPct / 100 : 0;
      const feesOnLoan = includeInLoan ? fees : 0;
      // monthlyPay = (loanBase*(1+taxPctIfIncluded) + feesIfIncluded) * piFactor
      loanBase = piFactor > 0 ? (monthlyPay / piFactor - feesOnLoan) / (1 + salesTaxOnLoanFactor) : 0;
      price = loanBase + incentive + down + tradeInEquity;
    }

    if (!(loanBase > 0)) { el('auto-result').innerHTML = '<p class="tool-result is-error">Check your inputs — the resulting loan amount is not valid.</p>'; return; }

    const salesTax = price * salesTaxPct / 100;
    const loanAmount = includeInLoan ? loanBase + salesTax + fees : loanBase;
    const upfrontPayment = down + (includeInLoan ? 0 : salesTax + fees);

    const termMonths = Math.round(term);
    const payment = loanAmount * monthlyPIFactor(rate, termMonths);
    const sim = simulate(loanAmount, rate, payment, termMonths);
    const totalCost = price + sim.totalInterest + salesTax + fees;

    el('auto-result').innerHTML = `
      <div class="summary-payment-box">
        <div class="label">${mode === 'price' ? 'Monthly Pay' : 'Vehicle Price'}</div>
        <div class="value">${mode === 'price' ? currency(payment) : currency(price)}</div>
      </div>
      ${mode === 'monthly' ? `<div class="stat-row"><span>Monthly Pay</span><strong>${currency(payment)}</strong></div>` : ''}
      <div class="stat-row"><span>Total Loan Amount</span><strong>${currency0(loanAmount)}</strong></div>
      <div class="stat-row"><span>Sale Tax</span><strong>${currency0(salesTax)}</strong></div>
      <div class="stat-row"><span>Upfront Payment</span><strong>${currency0(upfrontPayment)}</strong></div>
      <div class="stat-row"><span>Total of ${termMonths} Loan Payments</span><strong>${currency(sim.totalPaid)}</strong></div>
      <div class="stat-row"><span>Total Loan Interest</span><strong>${currency(sim.totalInterest)}</strong></div>
      <div class="stat-row"><span>Total Cost (price, interest, tax, fees)</span><strong>${currency(totalCost)}</strong></div>
      <div class="donut-wrap" style="margin-top:16px;">
        ${donutChart([{ value: loanAmount, color: 'var(--accent)', label: 'Principal' }, { value: sim.totalInterest, color: '#10b981', label: 'Interest' }])}
        <div class="donut-legend">
          <span class="legend-item"><span class="legend-dot" style="background:var(--accent)"></span>Principal</span>
          <span class="legend-item"><span class="legend-dot" style="background:#10b981"></span>Interest</span>
        </div>
      </div>
    `;

    lastSim = sim;
    el('auto-chart-wrap').innerHTML = lineChart(sim.months);
    renderSchedule('auto-schedule-body', scheduleView, toAnnualSchedule(sim.months), sim.months);
    el('auto-schedule-section').hidden = false;
  }

  function updateModeVisibility() {
    const mode = form.querySelector('input[name="auto-mode"]:checked').value;
    el('auto-price-field').hidden = mode !== 'price';
    el('auto-monthly-field').hidden = mode !== 'monthly';
  }

  form.querySelectorAll('input[name="auto-mode"]').forEach((r) => r.addEventListener('change', () => { updateModeVisibility(); calculate(); }));
  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });

  el('auto-schedule-annual').addEventListener('click', () => {
    scheduleView = 'annual';
    el('auto-schedule-annual').classList.add('active');
    el('auto-schedule-monthly').classList.remove('active');
    if (lastSim) renderSchedule('auto-schedule-body', scheduleView, toAnnualSchedule(lastSim.months), lastSim.months);
  });
  el('auto-schedule-monthly').addEventListener('click', () => {
    scheduleView = 'monthly';
    el('auto-schedule-monthly').classList.add('active');
    el('auto-schedule-annual').classList.remove('active');
    if (lastSim) renderSchedule('auto-schedule-body', scheduleView, toAnnualSchedule(lastSim.months), lastSim.months);
  });

  updateModeVisibility();
  calculate();
})();
