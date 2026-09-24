'use strict';

/**
 * Payoff math engine: month-by-month simulation from a known starting
 * balance, used for both payoff panels. Extra payments here are not
 * calendar-anchored (unlike the Amortization Calculator) — per the
 * reference tool, monthly/yearly/one-time extras all start immediately.
 */
const PayoffMath = {
  monthlyPI(loanAmount, annualRatePct, termMonths) {
    const r = annualRatePct / 100 / 12;
    if (termMonths <= 0) return 0;
    if (r === 0) return loanAmount / termMonths;
    const factor = Math.pow(1 + r, termMonths);
    return (loanAmount * r * factor) / (factor - 1);
  },

  /**
   * Simulates paying down `balance` with a level `payment` each month,
   * plus optional extra.monthly / extra.yearly (every 12th month) /
   * extra.oneTime (month 1 only). Stops at payoff or capMonths.
   * Returns { error, months, totalInterest, totalPaid, actualMonths }.
   */
  simulate({ balance, annualRatePct, payment, extra, capMonths = 1200 }) {
    const monthlyRate = annualRatePct / 100 / 12;
    if (payment <= balance * monthlyRate) {
      return { error: 'payment-too-low', months: [], totalInterest: 0, totalPaid: 0, actualMonths: 0 };
    }

    let bal = balance;
    const months = [];
    let totalInterest = 0;

    for (let m = 1; m <= capMonths && bal > 0.005; m++) {
      const interest = bal * monthlyRate;
      let principal = payment - interest;

      let extraThisMonth = 0;
      if (extra && extra.monthly > 0) extraThisMonth += extra.monthly;
      if (extra && extra.yearly > 0 && m % 12 === 0) extraThisMonth += extra.yearly;
      if (extra && extra.oneTime > 0 && m === 1) extraThisMonth += extra.oneTime;

      let totalPrincipal = principal + extraThisMonth;
      if (totalPrincipal > bal) totalPrincipal = bal;
      if (principal > bal) principal = bal;

      bal -= totalPrincipal;
      totalInterest += interest;

      months.push({ month: m, interest, principal: totalPrincipal, balance: Math.max(bal, 0) });
    }

    const totalPaid = months.reduce((s, x) => s + x.interest + x.principal, 0);
    return { error: null, months, totalInterest, totalPaid, actualMonths: months.length };
  },

  toAnnualSchedule(months) {
    const years = [];
    let bucket = null;
    months.forEach((m, i) => {
      if (!bucket || (i % 12 === 0)) {
        bucket = { yearIndex: years.length + 1, interest: 0, principal: 0, endingBalance: 0 };
        years.push(bucket);
      }
      bucket.interest += m.interest;
      bucket.principal += m.principal;
      bucket.endingBalance = m.balance;
    });
    return years;
  },
};

/* ===================== UI wiring (shared across both panels) ===================== */
(function () {
  const el = (id) => document.getElementById(id);
  const currency = (v) => '$' + Math.round(v).toLocaleString('en-US');
  const currency2 = (v) => '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const termText = (months) => {
    const y = Math.floor(months / 12);
    const m = months % 12;
    if (y === 0) return `${m} month${m === 1 ? '' : 's'}`;
    if (m === 0) return `${y} year${y === 1 ? '' : 's'}`;
    return `${y} year${y === 1 ? '' : 's'} and ${m} month${m === 1 ? '' : 's'}`;
  };

  function num(id, fallback = 0) {
    const field = el(id);
    if (!field) return fallback;
    const v = parseFloat(field.value);
    return Number.isFinite(v) ? v : fallback;
  }

  function lineChart(oldMonths, newMonths, width = 560, height = 200) {
    if (!oldMonths.length && !newMonths.length) return '';
    let oldCumInterest = 0, newCumInterest = 0;
    const oldBal = [], oldInt = [], newBal = [], newInt = [];
    oldMonths.forEach((m) => { oldCumInterest += m.interest; oldBal.push(m.balance); oldInt.push(oldCumInterest); });
    newMonths.forEach((m) => { newCumInterest += m.interest; newBal.push(m.balance); newInt.push(newCumInterest); });

    const maxLen = Math.max(oldMonths.length, newMonths.length, 1);
    const maxY = Math.max(...oldBal, ...oldInt, ...newBal, ...newInt, 1);
    const stepX = width / (maxLen - 1 || 1);
    const toPoints = (arr) => arr.map((v, i) => `${(i * stepX).toFixed(1)},${(height - (v / maxY) * height).toFixed(1)}`).join(' ');

    return `
      <svg viewBox="0 0 ${width} ${height}" class="line-chart" preserveAspectRatio="none">
        <polyline points="${toPoints(oldBal)}" fill="none" stroke="#94a3b8" stroke-width="2" stroke-dasharray="4 3" />
        <polyline points="${toPoints(oldInt)}" fill="none" stroke="#dc2626" stroke-width="2" stroke-dasharray="4 3" />
        <polyline points="${toPoints(newBal)}" fill="none" stroke="var(--accent)" stroke-width="2.5" />
        <polyline points="${toPoints(newInt)}" fill="none" stroke="#10b981" stroke-width="2.5" />
      </svg>`;
  }

  function renderSchedule(bodyId, view, annualRows, monthlyRows) {
    const box = el(bodyId);
    let html = '';
    if (view === 'annual') {
      html += '<table class="schedule-table"><thead><tr><th>Year</th><th>Interest</th><th>Principal</th><th>Ending Balance</th></tr></thead><tbody>';
      annualRows.forEach((r) => {
        html += `<tr><td>${r.yearIndex}</td><td>${currency(r.interest)}</td><td>${currency(r.principal)}</td><td>${currency(r.endingBalance)}</td></tr>`;
      });
    } else {
      html += '<table class="schedule-table"><thead><tr><th>Month</th><th>Interest</th><th>Principal</th><th>Ending Balance</th></tr></thead><tbody>';
      monthlyRows.forEach((r) => {
        html += `<tr><td>${r.month}</td><td>${currency(r.interest)}</td><td>${currency(r.principal)}</td><td>${currency(r.balance)}</td></tr>`;
      });
    }
    html += '</tbody></table>';
    box.innerHTML = html;
  }

  function compareRow(label, originalVal, payoffVal) {
    return `<tr><td>${label}</td><td>${originalVal}</td><td>${payoffVal}</td></tr>`;
  }

  function setupPanel(p) {
    const form = el(`${p}-form`);
    if (!form) return;

    let lastSchedule = null; // { annualRows, monthlyRows }
    let scheduleView = 'annual';

    function getMode() {
      const checked = form.querySelector(`input[name="${p}-mode"]:checked`);
      return checked ? checked.value : 'extra';
    }

    function readExtra() {
      return {
        monthly: num(`${p}-extra-monthly`, 0),
        yearly: num(`${p}-extra-yearly`, 0),
        oneTime: num(`${p}-extra-onetime`, 0),
      };
    }

    function renderError(msg) {
      el(`${p}-results`).hidden = true;
      if (el(`${p}-schedule-section`)) el(`${p}-schedule-section`).hidden = true;
      el(`${p}-result`).querySelector('.tool-result-slot') && (el(`${p}-result`).querySelector('.tool-result-slot').innerHTML = `<p class="tool-result is-error">${msg}</p>`);
    }

    function clearError() {
      const slot = el(`${p}-result`).querySelector('.tool-result-slot');
      if (slot) slot.innerHTML = '';
    }

    function calculate() {
      const mode = getMode();
      const rate = num(`${p}-interest-rate`, 0);
      if (!(rate >= 0)) { renderError('Enter a valid interest rate.'); return; }

      let balance, standardPayment, pastInterest = 0, pastPaid = 0, hasPast = false;
      let originalRemainingInterest, originalRemainingPaid, originalRemainingMonths;

      if (p === 'p1') {
        const loanAmount = num('p1-loan-amount', 0);
        const originalTermYears = num('p1-loan-term', 0);
        const remainingYears = num('p1-remaining-years', 0);
        const remainingMonthsExtra = num('p1-remaining-months', 0);
        if (!(loanAmount > 0) || !(originalTermYears > 0)) { renderError('Enter the original loan amount and term.'); return; }

        const originalTermMonths = Math.round(originalTermYears * 12);
        const remainingTermMonths = Math.round(remainingYears * 12 + remainingMonthsExtra);
        if (!(remainingTermMonths > 0) || remainingTermMonths > originalTermMonths) {
          renderError('Remaining term must be greater than 0 and no longer than the original term.');
          return;
        }

        standardPayment = PayoffMath.monthlyPI(loanAmount, rate, originalTermMonths);
        const fullSim = PayoffMath.simulate({ balance: loanAmount, annualRatePct: rate, payment: standardPayment, extra: null, capMonths: originalTermMonths + 2 });
        if (fullSim.error) { renderError('This payment does not cover the interest on this loan.'); return; }

        const elapsedMonths = originalTermMonths - remainingTermMonths;
        const pastMonths = fullSim.months.slice(0, elapsedMonths);
        const remainingMonthsOriginal = fullSim.months.slice(elapsedMonths);
        pastInterest = pastMonths.reduce((s, x) => s + x.interest, 0);
        pastPaid = pastMonths.reduce((s, x) => s + x.interest + x.principal, 0);
        hasPast = true;
        balance = pastMonths.length ? pastMonths[pastMonths.length - 1].balance : loanAmount;
        originalRemainingInterest = remainingMonthsOriginal.reduce((s, x) => s + x.interest, 0);
        originalRemainingPaid = remainingMonthsOriginal.reduce((s, x) => s + x.interest + x.principal, 0);
        originalRemainingMonths = remainingMonthsOriginal.length;
        lastSchedule = { __originalMonths: remainingMonthsOriginal };
      } else {
        balance = num('p2-balance', 0);
        standardPayment = num('p2-payment', 0);
        if (!(balance > 0) || !(standardPayment > 0)) { renderError('Enter the unpaid balance and monthly payment.'); return; }

        const baseSim = PayoffMath.simulate({ balance, annualRatePct: rate, payment: standardPayment, extra: null });
        if (baseSim.error) { renderError('This monthly payment does not cover the interest on this balance.'); return; }
        originalRemainingInterest = baseSim.totalInterest;
        originalRemainingPaid = baseSim.totalPaid;
        originalRemainingMonths = baseSim.actualMonths;
        lastSchedule = { __originalMonths: baseSim.months };
      }

      clearError();

      if (mode === 'altogether') {
        el(`${p}-schedule-section`) && (el(`${p}-schedule-section`).hidden = true);
        const totalInterestAltogether = hasPast ? pastInterest : 0;
        const totalPaidAltogether = hasPast ? pastPaid + balance : balance;
        const totalInterestOriginal = hasPast ? pastInterest + originalRemainingInterest : originalRemainingInterest;
        const totalPaidOriginal = hasPast ? pastPaid + originalRemainingPaid : originalRemainingPaid;

        el(`${p}-headline-label`).textContent = 'Payoff Amount';
        el(`${p}-headline-value`).textContent = currency2(balance);
        el(`${p}-headline-sub`).textContent = `Paying off the remaining balance of ${currency(balance)} today, instead of continuing the standard schedule, saves ${currency(totalInterestOriginal - totalInterestAltogether)} in interest.`;
        el(`${p}-savings-box`).hidden = true;
        el(`${p}-compare-table`).innerHTML = `
          <table class="breakdown-table">
            <thead><tr><th></th><th>Original Schedule</th><th>Pay Off Today</th></tr></thead>
            <tbody>
              ${compareRow('Total Payments', currency(totalPaidOriginal), currency(totalPaidAltogether))}
              ${compareRow('Total Interest', currency(totalInterestOriginal), currency(totalInterestAltogether))}
            </tbody>
          </table>`;
        el(`${p}-results`).hidden = false;
        return;
      }

      let extra = null;
      if (mode === 'extra') {
        extra = readExtra();
      } else if (mode === 'biweekly') {
        extra = { monthly: 0, yearly: standardPayment, oneTime: 0 };
      }

      const newSim = PayoffMath.simulate({ balance, annualRatePct: rate, payment: standardPayment, extra });
      if (newSim.error) { renderError('This payment does not cover the interest on this loan.'); return; }

      if (mode === 'normal') {
        el(`${p}-schedule-section`) && (el(`${p}-schedule-section`).hidden = true);
        el(`${p}-headline-label`).textContent = 'Monthly Pay';
        el(`${p}-headline-value`).textContent = currency2(standardPayment);
        el(`${p}-headline-sub`).textContent = `Normal repayment with no extra payments — payoff in ${termText(originalRemainingMonths)}.`;
        el(`${p}-savings-box`).hidden = true;
        el(`${p}-compare-table`).innerHTML = `
          <div class="stat-row"><span>${hasPast ? 'Monthly Pay' : 'Monthly Payment'}</span><strong>${currency2(standardPayment)}</strong></div>
          ${hasPast ? `<div class="stat-row"><span>Total Payments (life of loan)</span><strong>${currency(pastPaid + originalRemainingPaid)}</strong></div>` : ''}
          ${hasPast ? `<div class="stat-row"><span>Total Interest (life of loan)</span><strong>${currency(pastInterest + originalRemainingInterest)}</strong></div>` : ''}
          <div class="stat-row"><span>Remaining Payments</span><strong>${currency(originalRemainingPaid)}</strong></div>
          <div class="stat-row"><span>Remaining Interest</span><strong>${currency(originalRemainingInterest)}</strong></div>
          <div class="stat-row"><span>Remaining Term</span><strong>${termText(originalRemainingMonths)}</strong></div>
        `;
        el(`${p}-results`).hidden = false;
        return;
      }

      // extra or biweekly
      const interestSavings = originalRemainingInterest - newSim.totalInterest;
      const timeSavingsMonths = originalRemainingMonths - newSim.actualMonths;
      const newMonthlyPay = mode === 'extra' ? standardPayment + (extra.monthly || 0) : standardPayment / 2;

      el(`${p}-headline-label`).textContent = 'Payoff In';
      el(`${p}-headline-value`).textContent = termText(newSim.actualMonths);
      el(`${p}-headline-sub`).textContent = mode === 'biweekly'
        ? `Paying ${currency2(standardPayment / 2)} every two weeks instead of ${currency2(standardPayment)} monthly pays this off ${termText(Math.max(timeSavingsMonths, 0))} earlier, saving ${currency(interestSavings)} in interest.`
        : `Adding extra payments pays this off ${termText(Math.max(timeSavingsMonths, 0))} earlier than the ${termText(originalRemainingMonths)} standard schedule, saving ${currency(interestSavings)} in interest.`;

      el(`${p}-savings-box`).hidden = false;
      el(`${p}-savings-interest`).textContent = currency(interestSavings);
      el(`${p}-savings-time`).textContent = termText(Math.max(timeSavingsMonths, 0));

      const totalInterestOriginal = hasPast ? pastInterest + originalRemainingInterest : originalRemainingInterest;
      const totalPaidOriginal = hasPast ? pastPaid + originalRemainingPaid : originalRemainingPaid;
      const totalInterestNew = hasPast ? pastInterest + newSim.totalInterest : newSim.totalInterest;
      const totalPaidNew = hasPast ? pastPaid + newSim.totalPaid : newSim.totalPaid;

      el(`${p}-compare-table`).innerHTML = `
        <table class="breakdown-table">
          <thead><tr><th></th><th>Original</th><th>With Payoff</th></tr></thead>
          <tbody>
            ${hasPast ? compareRow('Monthly Pay', currency2(standardPayment), currency2(newMonthlyPay)) : ''}
            ${hasPast ? compareRow('Total Payments (life of loan)', currency(totalPaidOriginal), currency(totalPaidNew)) : ''}
            ${hasPast ? compareRow('Total Interest (life of loan)', currency(totalInterestOriginal), currency(totalInterestNew)) : ''}
            ${compareRow('Remaining Payments', currency(originalRemainingPaid), currency(newSim.totalPaid))}
            ${compareRow('Remaining Interest', currency(originalRemainingInterest), currency(newSim.totalInterest))}
            ${compareRow('Remaining Term', termText(originalRemainingMonths), termText(newSim.actualMonths))}
          </tbody>
        </table>`;

      el(`${p}-results`).hidden = false;

      if (el(`${p}-schedule-section`)) {
        const originalMonths = lastSchedule.__originalMonths;
        lastSchedule = {
          annualRows: PayoffMath.toAnnualSchedule(newSim.months),
          monthlyRows: newSim.months,
          originalMonths,
          newMonths: newSim.months,
        };
        el(`${p}-chart-wrap`).innerHTML = lineChart(originalMonths, newSim.months);
        renderSchedule(`${p}-schedule-body`, scheduleView, lastSchedule.annualRows, lastSchedule.monthlyRows);
        el(`${p}-schedule-section`).hidden = false;
      }
    }

    form.querySelectorAll(`input[name="${p}-mode"]`).forEach((radio) => {
      radio.addEventListener('change', () => {
        const mode = getMode();
        el(`${p}-extra-fields`).hidden = mode !== 'extra';
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      calculate();
    });

    if (el(`${p}-schedule-annual`)) {
      el(`${p}-schedule-annual`).addEventListener('click', () => {
        scheduleView = 'annual';
        el(`${p}-schedule-annual`).classList.add('active');
        el(`${p}-schedule-monthly`).classList.remove('active');
        if (lastSchedule && lastSchedule.annualRows) renderSchedule(`${p}-schedule-body`, scheduleView, lastSchedule.annualRows, lastSchedule.monthlyRows);
      });
      el(`${p}-schedule-monthly`).addEventListener('click', () => {
        scheduleView = 'monthly';
        el(`${p}-schedule-monthly`).classList.add('active');
        el(`${p}-schedule-annual`).classList.remove('active');
        if (lastSchedule && lastSchedule.annualRows) renderSchedule(`${p}-schedule-body`, scheduleView, lastSchedule.annualRows, lastSchedule.monthlyRows);
      });
    }

    calculate();
  }

  setupPanel('p1');
  setupPanel('p2');
})();
