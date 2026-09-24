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

  /* ---------- Calculator 1: XIRR from dated cash flows ---------- */
  const form1 = el('ar1-form');
  if (form1) {
    const ROW_COUNT = 10;

    function yearsBetween(d0, d1) {
      return (d1 - d0) / (1000 * 60 * 60 * 24 * 365);
    }

    function solveXIRR(flows) {
      // flows: [{ amount, years }] amounts signed (deposits/start negative, withdrawals/end positive)
      function npv(r) {
        return flows.reduce((s, f) => s + f.amount / Math.pow(1 + r, f.years), 0);
      }
      let lo = -0.9, hi = 10;
      const decreasing = npv(lo) > npv(hi);
      for (let i = 0; i < 200; i++) {
        const mid = (lo + hi) / 2;
        if ((npv(mid) > 0) === decreasing) lo = mid; else hi = mid;
      }
      return (lo + hi) / 2;
    }

    function calc1() {
      const startBalance = num('ar1-start-balance', 0);
      const startDate = new Date(el('ar1-start-date').value);
      const endBalance = num('ar1-end-balance', 0);
      const endDate = new Date(el('ar1-end-date').value);

      if (!(startBalance >= 0) || isNaN(startDate) || isNaN(endDate) || endDate <= startDate) {
        el('ar1-result').innerHTML = '<p class="tool-result is-error">Enter valid starting/ending balances and dates.</p>';
        return;
      }

      const flows = [{ amount: -startBalance, years: 0 }];
      for (let i = 1; i <= ROW_COUNT; i++) {
        const amtField = el(`ar1-amt-${i}`);
        if (!amtField || !amtField.value) continue;
        const amt = num(`ar1-amt-${i}`, 0);
        if (!(amt > 0)) continue;
        const activity = el(`ar1-activity-${i}`).value;
        const dateVal = el(`ar1-date-${i}`).value;
        if (!dateVal) continue;
        const d = new Date(dateVal);
        if (isNaN(d) || d < startDate || d > endDate) continue;
        const signedAmt = activity === 'deposit' ? -amt : amt;
        flows.push({ amount: signedAmt, years: yearsBetween(startDate, d) });
      }
      flows.push({ amount: endBalance, years: yearsBetween(startDate, endDate) });

      const rate = solveXIRR(flows);

      el('ar1-result').innerHTML = `
        <div class="summary-payment-box">
          <div class="label">Average Return</div>
          <div class="value">${(rate * 100).toFixed(2)}% per year</div>
        </div>
      `;
    }

    function addRow(i) {
      const wrap = document.createElement('div');
      wrap.className = 'field-row';
      wrap.style.alignItems = 'flex-end';
      wrap.innerHTML = `
        <div class="field-group" style="flex:0 0 110px;">
          <label>${i}.</label>
          <select id="ar1-activity-${i}">
            <option value="deposit">Deposit</option>
            <option value="withdraw">Withdraw</option>
          </select>
        </div>
        <div class="field-group">
          <label for="ar1-amt-${i}">Amount</label>
          <input type="number" id="ar1-amt-${i}" step="10">
        </div>
        <div class="field-group">
          <label for="ar1-date-${i}">Date</label>
          <input type="date" id="ar1-date-${i}">
        </div>
      `;
      return wrap;
    }

    const rowsContainer = el('ar1-rows');
    for (let i = 1; i <= ROW_COUNT; i++) rowsContainer.appendChild(addRow(i));

    const defaults1 = [
      { activity: 'deposit', amt: 5000, date: '2024-01-15' },
      { activity: 'withdraw', amt: 1500, date: '2024-06-01' },
      { activity: 'deposit', amt: 3800, date: '2025-01-18' },
    ];
    defaults1.forEach((d, idx) => {
      const i = idx + 1;
      el(`ar1-activity-${i}`).value = d.activity;
      el(`ar1-amt-${i}`).value = d.amt;
      el(`ar1-date-${i}`).value = d.date;
    });

    form1.addEventListener('submit', (e) => { e.preventDefault(); calc1(); });
    calc1();
  }

  /* ---------- Calculator 2: average & cumulative return ---------- */
  const form2 = el('ar2-form');
  if (form2) {
    const ROW_COUNT = 10;

    function calc2() {
      let cumulativeFactor = 1;
      let totalYears = 0;
      const rows = [];

      for (let i = 1; i <= ROW_COUNT; i++) {
        const rField = el(`ar2-return-${i}`);
        if (!rField || rField.value === '') continue;
        const returnPct = num(`ar2-return-${i}`, 0);
        const years = num(`ar2-years-${i}`, 0);
        const months = num(`ar2-months-${i}`, 0);
        const periodYears = years + months / 12;
        if (periodYears <= 0) continue;
        const factor = Math.pow(1 + returnPct / 100, periodYears);
        cumulativeFactor *= factor;
        totalYears += periodYears;
        rows.push({ i, returnPct, periodYears, factor });
      }

      if (rows.length === 0 || totalYears <= 0) {
        el('ar2-result').innerHTML = '<p class="tool-result is-error">Enter at least one return and holding period.</p>';
        return;
      }

      const cumulativeReturn = (cumulativeFactor - 1) * 100;
      const avgReturn = (Math.pow(cumulativeFactor, 1 / totalYears) - 1) * 100;
      const totalY = Math.floor(totalYears);
      const totalM = Math.round((totalYears - totalY) * 12);

      el('ar2-result').innerHTML = `
        <div class="summary-payment-box">
          <div class="label">Average Return</div>
          <div class="value">${avgReturn.toFixed(2)}% / year</div>
        </div>
        <div class="stat-row"><span>Cumulative Return</span><strong>${cumulativeReturn.toFixed(2)}%</strong></div>
        <div class="stat-row"><span>Total Holding Period</span><strong>${totalY} years, ${totalM} months</strong></div>
      `;

      let balance = 100;
      let tableHtml = '<table class="schedule-table"><thead><tr><th>Holding Period</th><th>Return</th><th>Ending Balance</th></tr></thead><tbody>';
      rows.forEach((r) => {
        balance *= r.factor;
        const y = Math.floor(r.periodYears);
        const m = Math.round((r.periodYears - y) * 12);
        tableHtml += `<tr><td>${y} years, ${m} months</td><td>${r.returnPct}%</td><td>${currency(balance)}</td></tr>`;
      });
      tableHtml += '</tbody></table>';
      el('ar2-table-wrap').innerHTML = tableHtml;
      el('ar2-results-section').hidden = false;
    }

    function addRow(i) {
      const wrap = document.createElement('div');
      wrap.className = 'field-row';
      wrap.style.alignItems = 'flex-end';
      wrap.innerHTML = `
        <div class="field-group" style="flex:0 0 30px;"><label>${i}.</label></div>
        <div class="field-group">
          <label for="ar2-return-${i}">Return (%)</label>
          <input type="number" id="ar2-return-${i}" step="0.1">
        </div>
        <div class="field-group">
          <label for="ar2-years-${i}">Years</label>
          <input type="number" id="ar2-years-${i}" min="0" step="1">
        </div>
        <div class="field-group">
          <label for="ar2-months-${i}">Months</label>
          <input type="number" id="ar2-months-${i}" min="0" max="11" step="1">
        </div>
      `;
      return wrap;
    }

    const rowsContainer2 = el('ar2-rows');
    for (let i = 1; i <= ROW_COUNT; i++) rowsContainer2.appendChild(addRow(i));

    const defaults2 = [
      { ret: 10, years: 1, months: 2 },
      { ret: -2, years: 0, months: 5 },
      { ret: 15, years: 2, months: 3 },
    ];
    defaults2.forEach((d, idx) => {
      const i = idx + 1;
      el(`ar2-return-${i}`).value = d.ret;
      el(`ar2-years-${i}`).value = d.years;
      el(`ar2-months-${i}`).value = d.months;
    });

    form2.addEventListener('submit', (e) => { e.preventDefault(); calc2(); });
    calc2();
  }
})();
