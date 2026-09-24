'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const currency = (v) => '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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

  function loanBalanceAfter(loanAmount, annualRatePct, payment, months) {
    const monthlyRate = annualRatePct / 100 / 12;
    let bal = loanAmount;
    for (let m = 1; m <= months && bal > 0.005; m++) {
      const interest = bal * monthlyRate;
      let principal = payment - interest;
      if (principal > bal) principal = bal;
      if (principal < 0) principal = 0;
      bal -= principal;
    }
    return Math.max(bal, 0);
  }

  function pmiMonthsUntil80(loanAmount, houseValue, annualRatePct, payment, cap = 480) {
    const threshold = houseValue * 0.8;
    if (loanAmount <= threshold) return 0;
    const monthlyRate = annualRatePct / 100 / 12;
    let bal = loanAmount;
    let months = 0;
    for (let m = 1; m <= cap; m++) {
      if (bal <= threshold) break;
      months = m;
      const interest = bal * monthlyRate;
      let principal = payment - interest;
      if (principal < 0) principal = 0;
      bal -= principal;
    }
    return months;
  }

  // Solve for the periodic rate r (per `periodsPerYear`) such that the sum of
  // discounted cash-flow streams equals netFinanced. Each stream: {amount, count}.
  function solveAPR(netFinanced, streams, periodsPerYear) {
    function pv(ratePerPeriod) {
      return streams.reduce((sum, s) => {
        if (ratePerPeriod === 0) return sum + s.amount * s.count;
        return sum + s.amount * (1 - Math.pow(1 + ratePerPeriod, -s.count)) / ratePerPeriod;
      }, 0);
    }
    let lo = 0, hi = 2; // periodic rate bounds (0% to 200% per period, generous)
    for (let i = 0; i < 100; i++) {
      const mid = (lo + hi) / 2;
      if (pv(mid) > netFinanced) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2 * periodsPerYear * 100;
  }

  function donut(segments) {
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

  /* ---------- General APR Calculator ---------- */
  const genForm = el('apr-gen-form');
  if (genForm) {
    const COMPOUND_N = { annually: 1, semiannually: 2, quarterly: 4, monthly: 12, semimonthly: 24, biweekly: 26, weekly: 52, daily: 365 };
    const PAYBACK_N = { day: 365, week: 52, twoweeks: 26, halfmonth: 24, month: 12, quarter: 4, sixmonths: 2, year: 1 };

    function calcGeneral() {
      const loanAmount = num('apr-gen-amount', 0);
      const termYears = num('apr-gen-term-years', 0);
      const termMonths = num('apr-gen-term-months', 0);
      const rate = num('apr-gen-rate', 0);
      const compound = el('apr-gen-compound').value;
      const payback = el('apr-gen-payback').value;
      const loanedFees = num('apr-gen-loaned-fees', 0);
      const upfrontFees = num('apr-gen-upfront-fees', 0);

      if (!(loanAmount > 0) || !(termYears > 0 || termMonths > 0)) {
        el('apr-gen-result').innerHTML = '<p class="tool-result is-error">Enter a loan amount and term.</p>';
        return;
      }

      const totalYears = termYears + termMonths / 12;
      const paybackN = PAYBACK_N[payback];
      const n = Math.round(paybackN * totalYears);

      let effectiveAnnualRate;
      if (compound === 'continuously') {
        effectiveAnnualRate = Math.exp(rate / 100) - 1;
      } else {
        const cN = COMPOUND_N[compound];
        effectiveAnnualRate = Math.pow(1 + rate / 100 / cN, cN) - 1;
      }
      const periodicRate = Math.pow(1 + effectiveAnnualRate, 1 / paybackN) - 1;

      const financedAmount = loanAmount + loanedFees;
      const payment = periodicRate === 0 ? financedAmount / n : financedAmount * periodicRate / (1 - Math.pow(1 + periodicRate, -n));

      const netFinanced = financedAmount - upfrontFees;
      const apr = solveAPR(netFinanced, [{ amount: payment, count: n }], paybackN);

      const totalPaid = payment * n;
      const totalInterest = totalPaid - financedAmount;
      const allPaymentsAndFees = totalPaid + upfrontFees;

      const PAYBACK_LABEL = { day: 'Day', week: 'Week', twoweeks: '2 Weeks', halfmonth: 'Half Month', month: 'Month', quarter: 'Quarter', sixmonths: '6 Months', year: 'Year' };

      const segments = [
        { value: financedAmount, color: 'var(--accent)', label: 'Principal' },
        { value: totalInterest, color: '#10b981', label: 'Interest' },
      ];
      if (upfrontFees > 0) segments.push({ value: upfrontFees, color: '#f59e0b', label: 'Fees' });

      el('apr-gen-result').innerHTML = `
        <div class="summary-payment-box">
          <div class="label">Real APR</div>
          <div class="value">${apr.toFixed(3)}%</div>
        </div>
        <div class="stat-row"><span>Amount Financed</span><strong>${currency(financedAmount)}</strong></div>
        <div class="stat-row"><span>Upfront Out-of-Pocket Fees</span><strong>${currency(upfrontFees)}</strong></div>
        <div class="stat-row"><span>Payment Every ${PAYBACK_LABEL[payback]}</span><strong>${currency(payment)}</strong></div>
        <div class="stat-row"><span>Total of ${n} Payments</span><strong>${currency(totalPaid)}</strong></div>
        <div class="stat-row"><span>Total Interest</span><strong>${currency(totalInterest)}</strong></div>
        <div class="stat-row"><span>All Payments and Fees</span><strong>${currency(allPaymentsAndFees)}</strong></div>
        <div class="donut-wrap" style="margin-top:16px;">
          ${donut(segments)}
          <div class="donut-legend">${segments.map((s) => `<span class="legend-item"><span class="legend-dot" style="background:${s.color}"></span>${s.label}</span>`).join('')}</div>
        </div>
      `;
    }

    genForm.addEventListener('submit', (e) => { e.preventDefault(); calcGeneral(); });
    calcGeneral();
  }

  /* ---------- Mortgage APR Calculator ---------- */
  const mortForm = el('apr-mort-form');
  if (mortForm) {
    function calcMortgage() {
      const houseValue = num('apr-mort-house', 0);
      const downPct = num('apr-mort-down', 0);
      const termYears = num('apr-mort-term', 30);
      const rate = num('apr-mort-rate', 0);
      const loanFees = num('apr-mort-fees', 0);
      const pointsPct = num('apr-mort-points', 0);
      const pmiAnnual = num('apr-mort-pmi', 0);

      if (!(houseValue > 0) || !(termYears > 0)) {
        el('apr-mort-result').innerHTML = '<p class="tool-result is-error">Enter a house value and loan term.</p>';
        return;
      }

      const downAmt = houseValue * downPct / 100;
      const loanAmount = houseValue - downAmt;
      const termMonths = Math.round(termYears * 12);
      const payment = loanAmount * monthlyPIFactor(rate, termMonths);
      const pointsCost = loanAmount * pointsPct / 100;

      const pmiMonthly = pmiAnnual / 12;
      const pmiMonths = downPct < 20 && pmiMonthly > 0 ? pmiMonthsUntil80(loanAmount, houseValue, rate, payment) : 0;
      const totalPMI = pmiMonthly * pmiMonths;

      const netFinanced = loanAmount - loanFees - pointsCost;
      const streams = [{ amount: payment, count: termMonths }];
      if (pmiMonths > 0) streams.push({ amount: pmiMonthly, count: pmiMonths });
      const apr = solveAPR(netFinanced, streams, 12);

      const totalPaid = payment * termMonths;
      const totalInterest = totalPaid - loanAmount;
      const allPaymentsAndFees = totalPaid + loanFees + totalPMI;

      const segments = [
        { value: loanAmount, color: 'var(--accent)', label: 'Principal' },
        { value: totalInterest, color: '#10b981', label: 'Interest' },
      ];
      if (loanFees + totalPMI > 0) segments.push({ value: loanFees + totalPMI, color: '#f59e0b', label: 'Fees' });

      el('apr-mort-result').innerHTML = `
        <div class="summary-payment-box">
          <div class="label">Real APR</div>
          <div class="value">${apr.toFixed(3)}%</div>
        </div>
        <div class="stat-row"><span>Loan Amount</span><strong>${currency(loanAmount)}</strong></div>
        <div class="stat-row"><span>Down Payment</span><strong>${currency(downAmt)}</strong></div>
        <div class="stat-row"><span>Monthly Pay</span><strong>${currency(payment)}</strong></div>
        <div class="stat-row"><span>Total of ${termMonths} Payments</span><strong>${currency(totalPaid)}</strong></div>
        <div class="stat-row"><span>Total Interest</span><strong>${currency(totalInterest)}</strong></div>
        ${pmiMonths > 0 ? `<div class="stat-row"><span>PMI Insurance (${pmiMonths} months)</span><strong>${currency(pmiMonthly)}/month</strong></div>
        <div class="stat-row"><span>Total PMI Insurance Payments</span><strong>${currency(totalPMI)}</strong></div>` : ''}
        <div class="stat-row"><span>All Payments and Fees</span><strong>${currency(allPaymentsAndFees)}</strong></div>
        <div class="donut-wrap" style="margin-top:16px;">
          ${donut(segments)}
          <div class="donut-legend">${segments.map((s) => `<span class="legend-item"><span class="legend-dot" style="background:${s.color}"></span>${s.label}</span>`).join('')}</div>
        </div>
      `;
    }

    mortForm.addEventListener('submit', (e) => { e.preventDefault(); calcMortgage(); });
    calcMortgage();
  }
})();
