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

  /* ---------- Calculator 1: fixed recurring cash flow ---------- */
  const form1 = el('irr1-form');
  if (form1) {
    const FREQ_N = { a: 1, s: 2, q: 4, m: 12, sm: 24, bw: 26, w: 52 };

    function annuityFactor(r, n, due) {
      if (r === 0) return n;
      return ((Math.pow(1 + r, n) - 1) / r) * (due ? (1 + r) : 1);
    }

    function calc1() {
      const initial = num('irr1-initial', 0);
      const years = num('irr1-years', 0);
      const months = num('irr1-months', 0);
      const endingBalance = num('irr1-ending', 0);
      const activity = el('irr1-activity').value; // deposit | withdraw
      const amount = num('irr1-amount', 0);
      const freqKey = el('irr1-frequency').value;
      const due = el('irr1-timing').value === 'begin';

      const freqN = FREQ_N[freqKey];
      const n = Math.round((years + months / 12) * freqN);
      if (!(initial > 0) || n <= 0) {
        el('irr1-result').innerHTML = '<p class="tool-result is-error">Enter an initial investment and holding length.</p>';
        return;
      }

      // TVM convention (matches the Finance Calculator engine): PV*(1+r)^n + PMT*annuity + FV = 0.
      // Withdrawals behave like a negative PMT (cash leaving the account); the remaining
      // ending balance behaves like a negative FV, mirroring that same sign convention.
      const periodicFlow = activity === 'withdraw' ? -amount : amount;
      const fvSigned = -endingBalance;

      function eq(r) {
        return initial * Math.pow(1 + r, n) + periodicFlow * annuityFactor(r, n, due) + fvSigned;
      }
      let lo = -0.5, hi = 1;
      const decreasing = eq(lo) > eq(hi);
      for (let i = 0; i < 200; i++) {
        const mid = (lo + hi) / 2;
        if ((eq(mid) > 0) === decreasing) lo = mid; else hi = mid;
      }
      const rPeriodic = (lo + hi) / 2;
      const annualIRR = (Math.pow(1 + rPeriodic, freqN) - 1) * 100;

      const cumulative = amount * n;
      const cumLabel = activity === 'withdraw' ? 'Cumulative Withdrawals' : 'Cumulative Deposits';

      el('irr1-result').innerHTML = `
        <div class="summary-payment-box">
          <div class="label">IRR</div>
          <div class="value">${annualIRR.toFixed(3)}% per year</div>
        </div>
        <div class="stat-row"><span>${cumLabel}</span><strong>${currency(Math.abs(cumulative))}</strong></div>
        <div class="stat-row"><span>Ending Balance</span><strong>${currency(endingBalance)}</strong></div>
      `;
    }

    form1.addEventListener('submit', (e) => { e.preventDefault(); calc1(); });
    calc1();
  }

  /* ---------- Calculator 2: irregular annual cash flows ---------- */
  const form2 = el('irr2-form');
  if (form2) {
    const ROW_COUNT = 10;

    function irr(flows) {
      function npv(r) {
        return flows.reduce((s, cf, i) => s + cf / Math.pow(1 + r, i), 0);
      }
      let lo = -0.99, hi = 10;
      const decreasing = npv(lo) > npv(hi);
      for (let i = 0; i < 200; i++) {
        const mid = (lo + hi) / 2;
        if ((npv(mid) > 0) === decreasing) lo = mid; else hi = mid;
      }
      return (lo + hi) / 2;
    }

    function calc2() {
      const initial = num('irr2-initial', 0);
      if (!(initial > 0)) {
        el('irr2-result').innerHTML = '<p class="tool-result is-error">Enter an initial investment.</p>';
        return;
      }

      const flows = [-initial];
      for (let i = 1; i <= ROW_COUNT; i++) {
        const field = el(`irr2-year-${i}`);
        if (!field || field.value === '') break;
        flows.push(num(`irr2-year-${i}`, 0));
      }
      while (flows.length > 1 && flows[flows.length - 1] === 0) flows.pop();

      if (flows.length < 2) {
        el('irr2-result').innerHTML = '<p class="tool-result is-error">Enter at least one year of cash flow.</p>';
        return;
      }

      const rate = irr(flows) * 100;

      let furtherInvestments = 0, totalInflows = 0;
      for (let i = 1; i < flows.length; i++) {
        if (flows[i] < 0) furtherInvestments += -flows[i];
        else totalInflows += flows[i];
      }
      const totalInvested = initial + furtherInvestments;
      const totalReturn = totalInflows - totalInvested;
      const grossReturn = totalInvested > 0 ? totalReturn / totalInvested * 100 : 0;

      el('irr2-result').innerHTML = `
        <div class="summary-payment-box">
          <div class="label">IRR</div>
          <div class="value">${rate.toFixed(3)}% per year</div>
        </div>
        ${furtherInvestments > 0 ? `<div class="stat-row"><span>Further Investments</span><strong>${currency(furtherInvestments)}</strong></div>` : ''}
        <div class="stat-row"><span>Investment Length</span><strong>${flows.length - 1} year${flows.length - 1 === 1 ? '' : 's'}</strong></div>
        <div class="stat-row"><span>Total Return</span><strong>${currency(totalReturn)}</strong></div>
        <div class="stat-row"><span>Gross Return</span><strong>${grossReturn.toFixed(3)}%</strong></div>
      `;
    }

    function addRow(i) {
      const wrap = document.createElement('div');
      wrap.className = 'field-group';
      wrap.innerHTML = `<label for="irr2-year-${i}">Year ${i}</label><input type="number" id="irr2-year-${i}" step="100">`;
      return wrap;
    }
    const rowsContainer = el('irr2-rows');
    for (let i = 1; i <= ROW_COUNT; i++) rowsContainer.appendChild(addRow(i));

    const defaults2 = [-10000, 30000, 50000];
    defaults2.forEach((v, idx) => { el(`irr2-year-${idx + 1}`).value = v; });

    form2.addEventListener('submit', (e) => { e.preventDefault(); calc2(); });
    calc2();
  }
})();
