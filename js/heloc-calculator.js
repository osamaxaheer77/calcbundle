'use strict';

(function () {
  const el = (id) => document.getElementById(id);
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

  function solveAPR(netFinanced, streams) {
    function pv(ratePct) {
      const r = ratePct / 100 / 12;
      return streams.reduce((sum, s) => {
        const annuity = r === 0 ? s.count : (1 - Math.pow(1 + r, -s.count)) / r;
        return sum + s.amount * annuity / Math.pow(1 + r, s.offset);
      }, 0);
    }
    let lo = 0, hi = 100;
    for (let i = 0; i < 100; i++) {
      const mid = (lo + hi) / 2;
      if (pv(mid) > netFinanced) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }

  const form = el('heloc-form');
  if (form) {
    let lastSim = null;
    let scheduleView = 'annual';

    function calculate() {
      const loanAmount = num('heloc-amount', 0);
      const rate = num('heloc-rate', 0);
      const drawYears = num('heloc-draw', 0);
      const repayYears = num('heloc-repay', 0);
      const drawMonths = Math.round(drawYears * 12);
      const repayMonths = Math.round(repayYears * 12);
      const totalMonths = drawMonths + repayMonths;

      const includeCosts = el('heloc-include-costs').checked;
      const costMode = includeCosts ? el('heloc-cost-mode').value : 'amt';
      const costVal = includeCosts ? num('heloc-cost', 0) : 0;
      const closingCost = costMode === 'pct' ? loanAmount * costVal / 100 : costVal;
      const paidHow = form.querySelector('input[name="heloc-cost-paid"]:checked')?.value || 'upfront';
      const annualFee = includeCosts ? num('heloc-annual-fee', 0) : 0;

      if (!(loanAmount > 0) || !(totalMonths > 0)) {
        el('heloc-result').innerHTML = '<p class="tool-result is-error">Enter a loan amount, draw period, and repayment period.</p>';
        return;
      }

      const drawPayment = loanAmount * rate / 100 / 12;
      const repayFactor = monthlyPIFactor(rate, repayMonths);
      const repayPayment = loanAmount * repayFactor;
      const monthlyRate = rate / 100 / 12;

      const months = [];
      let bal = loanAmount;
      let totalInterest = 0;
      for (let m = 1; m <= drawMonths; m++) {
        const interest = bal * monthlyRate;
        totalInterest += interest;
        months.push({ month: m, interest, principal: 0, balance: bal });
      }
      for (let m = 1; m <= repayMonths && bal > 0.005; m++) {
        const interest = bal * monthlyRate;
        let principal = repayPayment - interest;
        if (principal > bal) principal = bal;
        bal -= principal;
        totalInterest += interest;
        months.push({ month: drawMonths + m, interest, principal, balance: Math.max(bal, 0) });
      }

      const totalPaid = months.reduce((s, m) => s + m.interest + m.principal, 0);
      const totalAnnualFees = annualFee * drawYears;

      let html = `
        <div class="stat-row"><span>Draw Period Monthly Pay</span><strong>${currency(drawPayment)}</strong></div>
        <div class="stat-row"><span>Repayment Period Monthly Pay</span><strong>${currency(repayPayment)}</strong></div>
        <div class="stat-row"><span>Total of ${totalMonths} Payments</span><strong>${currency(totalPaid)}</strong></div>
        <div class="stat-row"><span>Total Interest</span><strong>${currency(totalInterest)}</strong></div>`;

      const segments = [{ value: loanAmount, color: 'var(--accent)', label: 'Loan Amount' }];

      if (includeCosts && (closingCost > 0 || annualFee > 0)) {
        const costOfLoan = totalInterest + closingCost + totalAnnualFees;
        const streams = [
          { amount: drawPayment, count: drawMonths, offset: 0 },
          { amount: repayPayment, count: repayMonths, offset: drawMonths },
        ];
        if (annualFee > 0) {
          for (let y = 1; y <= drawYears; y++) streams.push({ amount: annualFee, count: 1, offset: y * 12 - 1 });
        }
        const netFinanced = loanAmount - closingCost;
        const apr = solveAPR(netFinanced, streams);

        html += `
          <div class="stat-row"><span>Total Annual Fees</span><strong>${currency(totalAnnualFees)}</strong></div>
          <div class="stat-row"><span>Cost of Loan</span><strong>${currency(costOfLoan)}</strong></div>
          <div class="stat-row"><span>APR</span><strong>${apr.toFixed(3)}%</strong></div>`;
        if (closingCost > 0) segments.push({ value: closingCost, color: '#f59e0b', label: 'Closing Costs' });
        if (totalAnnualFees > 0) segments.push({ value: totalAnnualFees, color: '#8b5cf6', label: 'Annual Fee' });
      }
      segments.push({ value: totalInterest, color: '#10b981', label: 'Interest' });

      html += `<div class="donut-wrap" style="margin-top:16px;">${donutChart(segments)}<div class="donut-legend">${segments.map((s) => `<span class="legend-item"><span class="legend-dot" style="background:${s.color}"></span>${s.label}</span>`).join('')}</div></div>`;

      el('heloc-result').innerHTML = html;

      lastSim = { months };
      el('heloc-chart-wrap').innerHTML = lineChart(months);
      renderSchedule('heloc-schedule-body', scheduleView, toAnnualSchedule(months), months);
      el('heloc-schedule-section').hidden = false;
    }

    form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
    el('heloc-include-costs').addEventListener('change', () => { el('heloc-cost-fields').hidden = !el('heloc-include-costs').checked; });
    el('heloc-schedule-annual').addEventListener('click', () => {
      scheduleView = 'annual';
      el('heloc-schedule-annual').classList.add('active');
      el('heloc-schedule-monthly').classList.remove('active');
      if (lastSim) renderSchedule('heloc-schedule-body', scheduleView, toAnnualSchedule(lastSim.months), lastSim.months);
    });
    el('heloc-schedule-monthly').addEventListener('click', () => {
      scheduleView = 'monthly';
      el('heloc-schedule-monthly').classList.add('active');
      el('heloc-schedule-annual').classList.remove('active');
      if (lastSim) renderSchedule('heloc-schedule-body', scheduleView, toAnnualSchedule(lastSim.months), lastSim.months);
    });

    calculate();
  }

  /* ---------- Borrowing capacity panel ---------- */
  const form2 = el('heloc2-form');
  if (form2) {
    function calc2() {
      const houseValue = num('heloc2-house-value', 0);
      const balance = num('heloc2-balance', 0);
      const ltv = num('heloc2-ltv', 80);
      if (!(houseValue > 0)) {
        el('heloc2-result').innerHTML = '<p class="tool-result is-error">Enter your home\'s current value.</p>';
        return;
      }
      const maxTotalDebt = houseValue * ltv / 100;
      const maxLoan = Math.max(maxTotalDebt - balance, 0);
      const currentLTV = balance / houseValue * 100;
      el('heloc2-result').innerHTML = `
        <div class="summary-payment-box">
          <div class="label">You May Borrow Up To</div>
          <div class="value">${currency0(maxLoan)}</div>
        </div>
        <div class="stat-row"><span>Current Loan-to-Value Ratio</span><strong>${currentLTV.toFixed(1)}%</strong></div>
        <p class="headline-sub">Credit history and debt-to-income ratio can also affect your final qualified amount. Most lenders look for a credit score of at least 630 and a debt-to-income ratio under 43%.</p>
      `;
    }
    form2.addEventListener('submit', (e) => { e.preventDefault(); calc2(); });
    calc2();
  }
})();
