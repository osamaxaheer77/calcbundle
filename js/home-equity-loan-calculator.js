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

  function solveAPR(netFinanced, payment, termMonths) {
    function pv(ratePct) {
      const r = ratePct / 100 / 12;
      if (r === 0) return payment * termMonths;
      return payment * (1 - Math.pow(1 + r, -termMonths)) / r;
    }
    let lo = 0, hi = 100;
    for (let i = 0; i < 100; i++) {
      const mid = (lo + hi) / 2;
      if (pv(mid) > netFinanced) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
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

  /* ---------- Panel 1: payment calculator ---------- */
  const form1 = el('hel-form');
  if (form1) {
    let lastSim = null;
    let scheduleView = 'annual';

    function calc1() {
      const loanAmount = num('hel-amount', 0);
      const rate = num('hel-rate', 0);
      const termYears = num('hel-term', 0);
      const termMonths = Math.round(termYears * 12);
      const includeCosts = el('hel-include-costs').checked;
      const costMode = includeCosts ? el('hel-cost-mode').value : 'amt';
      const costVal = includeCosts ? num('hel-cost', 0) : 0;
      const closingCost = costMode === 'pct' ? loanAmount * costVal / 100 : costVal;
      const paidHow = form1.querySelector('input[name="hel-cost-paid"]:checked')?.value || 'deduct';

      if (!(loanAmount > 0) || !(termMonths > 0)) {
        el('hel-result').innerHTML = '<p class="tool-result is-error">Enter a loan amount and term.</p>';
        return;
      }

      const payment = loanAmount * monthlyPIFactor(rate, termMonths);
      const sim = simulate(loanAmount, rate, payment, termMonths);
      const cashReceived = paidHow === 'deduct' ? loanAmount - closingCost : loanAmount;

      let html = `
        <div class="summary-payment-box">
          <div class="label">Monthly Pay</div>
          <div class="value">${currency(payment)}</div>
        </div>`;

      if (includeCosts && closingCost > 0) {
        const costOfLoan = sim.totalInterest + closingCost;
        const apr = solveAPR(loanAmount - closingCost, payment, termMonths);
        html += `
          <div class="stat-row"><span>Cash Received</span><strong>${currency(cashReceived)}</strong></div>
          <div class="stat-row"><span>Total of ${termMonths} Loan Payments</span><strong>${currency(sim.totalPaid)}</strong></div>
          <div class="stat-row"><span>Total Interest</span><strong>${currency(sim.totalInterest)}</strong></div>
          <div class="stat-row"><span>Cost of Loan</span><strong>${currency(costOfLoan)}</strong></div>
          <div class="stat-row"><span>APR</span><strong>${apr.toFixed(3)}%</strong></div>`;
        const segments = [
          { value: cashReceived, color: 'var(--accent)', label: 'Cash Received' },
          { value: closingCost, color: '#f59e0b', label: 'Closing Costs' },
          { value: sim.totalInterest, color: '#10b981', label: 'Interest' },
        ];
        html += `<div class="donut-wrap" style="margin-top:16px;">${donutChart(segments)}<div class="donut-legend">${segments.map((s) => `<span class="legend-item"><span class="legend-dot" style="background:${s.color}"></span>${s.label}</span>`).join('')}</div></div>`;
      } else {
        html += `
          <div class="stat-row"><span>Total of ${termMonths} Loan Payments</span><strong>${currency(sim.totalPaid)}</strong></div>
          <div class="stat-row"><span>Total Interest</span><strong>${currency(sim.totalInterest)}</strong></div>`;
        const segments = [
          { value: loanAmount, color: 'var(--accent)', label: 'Loan Amount' },
          { value: sim.totalInterest, color: '#10b981', label: 'Interest' },
        ];
        html += `<div class="donut-wrap" style="margin-top:16px;">${donutChart(segments)}<div class="donut-legend">${segments.map((s) => `<span class="legend-item"><span class="legend-dot" style="background:${s.color}"></span>${s.label}</span>`).join('')}</div></div>`;
      }

      el('hel-result').innerHTML = html;

      lastSim = sim;
      el('hel-chart-wrap').innerHTML = lineChart(sim.months);
      renderSchedule('hel-schedule-body', scheduleView, toAnnualSchedule(sim.months), sim.months);
      el('hel-schedule-section').hidden = false;
    }

    form1.addEventListener('submit', (e) => { e.preventDefault(); calc1(); });
    el('hel-include-costs').addEventListener('change', () => { el('hel-cost-fields').hidden = !el('hel-include-costs').checked; });
    el('hel-schedule-annual').addEventListener('click', () => {
      scheduleView = 'annual';
      el('hel-schedule-annual').classList.add('active');
      el('hel-schedule-monthly').classList.remove('active');
      if (lastSim) renderSchedule('hel-schedule-body', scheduleView, toAnnualSchedule(lastSim.months), lastSim.months);
    });
    el('hel-schedule-monthly').addEventListener('click', () => {
      scheduleView = 'monthly';
      el('hel-schedule-monthly').classList.add('active');
      el('hel-schedule-annual').classList.remove('active');
      if (lastSim) renderSchedule('hel-schedule-body', scheduleView, toAnnualSchedule(lastSim.months), lastSim.months);
    });

    calc1();
  }

  /* ---------- Panel 2: borrowing capacity ---------- */
  const form2 = el('hel2-form');
  if (form2) {
    function calc2() {
      const houseValue = num('hel2-house-value', 0);
      const balance = num('hel2-balance', 0);
      const ltv = num('hel2-ltv', 80);

      if (!(houseValue > 0)) {
        el('hel2-result').innerHTML = '<p class="tool-result is-error">Enter your home\'s current value.</p>';
        return;
      }

      const maxTotalDebt = houseValue * ltv / 100;
      const maxLoan = Math.max(maxTotalDebt - balance, 0);
      const currentLTV = balance / houseValue * 100;

      el('hel2-result').innerHTML = `
        <div class="summary-payment-box">
          <div class="label">You May Borrow Up To</div>
          <div class="value">${currency0(maxLoan)}</div>
        </div>
        <div class="stat-row"><span>Current Loan-to-Value Ratio</span><strong>${currentLTV.toFixed(1)}%</strong></div>
        <p class="headline-sub">Other factors — credit history, debt-to-income ratio — can also affect your final qualified amount. Most lenders look for a credit score of at least 630 and a debt-to-income ratio under 43%.</p>
      `;
    }

    form2.addEventListener('submit', (e) => { e.preventDefault(); calc2(); });
    calc2();
  }
})();
