'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('ref-form');
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

  function remainingTermFloor(balance, annualRatePct, payment) {
    const r = annualRatePct / 100 / 12;
    if (r === 0) return Math.floor(balance / payment);
    if (payment <= balance * r) return null;
    const n = -Math.log(1 - (r * balance) / payment) / Math.log(1 + r);
    return Math.max(Math.floor(n), 1);
  }

  function simulate(balance, annualRatePct, payment, capMonths = 1200) {
    const monthlyRate = annualRatePct / 100 / 12;
    let bal = balance;
    const months = [];
    let totalInterest = 0;
    for (let m = 1; m <= capMonths && bal > 0.005; m++) {
      const interest = bal * monthlyRate;
      let principal = payment - interest;
      if (principal > bal) principal = bal;
      if (principal < 0) return { error: true, months: [], totalInterest: 0 };
      bal -= principal;
      totalInterest += interest;
      months.push({ interest, principal, balance: Math.max(bal, 0) });
    }
    const totalPaid = months.reduce((s, x) => s + x.interest + x.principal, 0);
    return { error: false, months, totalInterest, totalPaid, actualMonths: months.length };
  }

  // Bisection solve for APR given the amount actually financed (loan - upfront costs)
  // must equal the present value of `payment` over `termMonths` at rate r/12.
  function solveAPR(loanAmount, upfrontCost, payment, termMonths) {
    const netFinanced = loanAmount - upfrontCost;
    if (netFinanced <= 0 || payment <= 0) return null;

    function pv(ratePct) {
      const r = ratePct / 100 / 12;
      if (r === 0) return payment * termMonths;
      return payment * (1 - Math.pow(1 + r, -termMonths)) / r;
    }

    let lo = 0, hi = 100;
    // pv(rate) decreases as rate increases; find rate where pv(rate) = netFinanced
    for (let i = 0; i < 100; i++) {
      const mid = (lo + hi) / 2;
      if (pv(mid) > netFinanced) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }

  function calculate() {
    const mode = el('ref-cur-mode').value;
    const curRate = num('ref-cur-rate', 0);
    let balance, curPayment;

    let curTermCap = null;
    if (mode === 'balance') {
      balance = num('ref-cur-balance', 0);
      curPayment = num('ref-cur-payment', 0);
      if (!(balance > 0) || !(curPayment > 0)) {
        el('ref-result').innerHTML = '<p class="tool-result is-error">Enter the remaining balance and monthly payment.</p>';
        return;
      }
      curTermCap = remainingTermFloor(balance, curRate, curPayment);
      if (curTermCap === null) {
        el('ref-result').innerHTML = '<p class="tool-result is-error">This monthly payment does not cover the interest on this balance.</p>';
        return;
      }
    } else {
      const origAmount = num('ref-cur-orig-amount', 0);
      const origTerm = num('ref-cur-orig-term', 0);
      const remYears = num('ref-cur-rem-years', 0);
      const remMonthsExtra = num('ref-cur-rem-months', 0);
      if (!(origAmount > 0) || !(origTerm > 0)) {
        el('ref-result').innerHTML = '<p class="tool-result is-error">Enter the original loan amount and term.</p>';
        return;
      }
      const origTermMonths = Math.round(origTerm * 12);
      const remainingMonths = Math.round(remYears * 12 + remMonthsExtra);
      curPayment = origAmount * monthlyPIFactor(curRate, origTermMonths);
      const elapsedMonths = origTermMonths - remainingMonths;
      const fullSim = simulate(origAmount, curRate, curPayment, origTermMonths + 2);
      if (fullSim.error || elapsedMonths < 0 || elapsedMonths > fullSim.months.length) {
        el('ref-result').innerHTML = '<p class="tool-result is-error">Check the loan term and remaining time entered.</p>';
        return;
      }
      balance = elapsedMonths > 0 ? fullSim.months[elapsedMonths - 1].balance : origAmount;
    }

    const newTermYears = num('ref-new-term', 0);
    const newRate = num('ref-new-rate', 0);
    const points = num('ref-new-points', 0);
    const costs = num('ref-new-costs', 0);
    const cashOut = num('ref-new-cashout', 0);
    const newTermMonths = Math.round(newTermYears * 12);
    if (!(newTermMonths > 0) || !(newRate >= 0)) {
      el('ref-result').innerHTML = '<p class="tool-result is-error">Enter the new loan term and interest rate.</p>';
      return;
    }

    const newLoanAmount = balance + cashOut;
    const pointsCost = newLoanAmount * points / 100;
    const upfrontCost = pointsCost + costs;
    const newPayment = newLoanAmount * monthlyPIFactor(newRate, newTermMonths);

    const curSim = simulate(balance, curRate, curPayment, curTermCap || 1200);
    const newSim = simulate(newLoanAmount, newRate, newPayment, newTermMonths + 2);
    if (curSim.error || newSim.error) {
      el('ref-result').innerHTML = '<p class="tool-result is-error">This payment does not cover the interest on this loan.</p>';
      return;
    }

    const apr = solveAPR(newLoanAmount, upfrontCost, newPayment, newTermMonths);

    // Break-even: month where cumulative interest saved (current sim vs new sim) covers upfront cost.
    let breakEvenMonths = null;
    let cumCur = 0, cumNew = 0;
    const maxLen = Math.max(curSim.months.length, newSim.months.length);
    for (let i = 0; i < maxLen; i++) {
      cumCur += curSim.months[i] ? curSim.months[i].interest : 0;
      cumNew += newSim.months[i] ? newSim.months[i].interest : 0;
      if (cumCur - cumNew >= upfrontCost) { breakEvenMonths = i + 1; break; }
    }

    const monthlySavings = curPayment - newPayment;
    const monthsFasterRaw = curSim.actualMonths - newSim.actualMonths;
    const lifetimeSavings = (curSim.totalPaid) - (newSim.totalPaid + upfrontCost);
    const rateDiff = curRate - apr;
    const cheaper = lifetimeSavings > 0;

    el('ref-result').innerHTML = `
      <div class="summary-payment-box">
        <div class="label">New Monthly Payment</div>
        <div class="value">${currency(newPayment)}</div>
      </div>
      <p class="headline-sub">The APR for the new loan is <strong>${apr.toFixed(3)}%</strong>, which is ${Math.abs(rateDiff).toFixed(3)}% ${rateDiff > 0 ? 'lower' : 'higher'} than the ${curRate}% interest rate of the current loan. Refinancing would be financially ${cheaper ? '<strong style="color:#10b981;">less expensive</strong>' : '<strong style="color:#dc2626;">more expensive</strong>'}.</p>
      <div class="stat-row"><span>Monthly Pay Savings</span><strong>${currency(Math.abs(monthlySavings))}${monthlySavings < 0 ? ' more' : ''}</strong></div>
      ${monthsFasterRaw !== 0 ? `<div class="stat-row"><span>${monthsFasterRaw > 0 ? 'Faster Payoff' : 'Slower Payoff'}</span><strong>${Math.abs(monthsFasterRaw)} months</strong></div>` : ''}
      <div class="stat-row"><span>Lifetime ${cheaper ? 'Savings' : 'Cost'}</span><strong>${currency(Math.abs(lifetimeSavings))}</strong></div>
      <div class="stat-row"><span>Upfront Cost</span><strong>${currency(upfrontCost)}</strong></div>
      <div class="stat-row"><span>Break-even Point</span><strong>${breakEvenMonths ? breakEvenMonths + ' months' : 'Never'}</strong></div>

      <div class="subsection-title">Current vs. New Loan</div>
      <table class="breakdown-table">
        <thead><tr><th></th><th>Current (remaining)</th><th>New Loan</th></tr></thead>
        <tbody>
          <tr><td>Principal / Loan Amount</td><td>${currency(balance)}</td><td>${currency(newLoanAmount)}</td></tr>
          <tr><td>Monthly Pay</td><td>${currency(curPayment)}</td><td>${currency(newPayment)}</td></tr>
          <tr><td>Length</td><td>${curSim.actualMonths} months</td><td>${newSim.actualMonths} months</td></tr>
          <tr><td>Interest Rate / APR</td><td>${curRate}%</td><td>${apr.toFixed(3)}%</td></tr>
          <tr><td>Total Payments</td><td>${currency0(curSim.totalPaid)}</td><td>${currency0(newSim.totalPaid)}</td></tr>
          <tr><td>Total Interest</td><td>${currency0(curSim.totalPaid - balance)}</td><td>${currency0(newSim.totalInterest)}</td></tr>
          <tr><td>Cost + Points (upfront)</td><td>$0</td><td>${currency(upfrontCost)}</td></tr>
        </tbody>
      </table>
    `;
  }

  function updateModeVisibility() {
    const mode = el('ref-cur-mode').value;
    el('ref-balance-fields').hidden = mode !== 'balance';
    el('ref-original-fields').hidden = mode !== 'original';
  }

  el('ref-cur-mode').addEventListener('change', () => { updateModeVisibility(); calculate(); });
  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });

  updateModeVisibility();
  calculate();
})();
