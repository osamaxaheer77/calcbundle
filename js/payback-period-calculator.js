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

  function computePayback(cashFlows) {
    // cashFlows[0] is the (negative) initial investment.
    let cum = cashFlows[0];
    for (let y = 1; y < cashFlows.length; y++) {
      const prevCum = cum;
      cum += cashFlows[y];
      if (cum >= 0) {
        return (y - 1) + Math.abs(prevCum) / cashFlows[y];
      }
    }
    return null; // never pays back within the given horizon
  }

  function buildTable(cashFlows, discountRate) {
    let netCF = 0, netDCF = 0;
    const rows = [];
    cashFlows.forEach((cf, y) => {
      const dcf = cf / Math.pow(1 + discountRate / 100, y);
      netCF += cf;
      netDCF += dcf;
      rows.push({ year: y, cf, netCF, dcf, netDCF });
    });
    return rows;
  }

  function renderTable(rows) {
    let html = '<table class="schedule-table"><thead><tr><th>Year</th><th>Cash Flow</th><th>Net Cash Flow</th><th>Discounted CF</th><th>Net Discounted CF</th></tr></thead><tbody>';
    rows.forEach((r) => {
      html += `<tr><td>Year ${r.year}</td><td>${currency(r.cf)}</td><td>${currency(r.netCF)}</td><td>${currency(r.dcf)}</td><td>${currency(r.netDCF)}</td></tr>`;
    });
    html += '</tbody></table>';
    return html;
  }

  function renderResult(resultId, tableWrapId, resultsSectionId, cashFlows, discountRate) {
    const rows = buildTable(cashFlows, discountRate);
    const payback = computePayback(cashFlows.map((cf) => cf));
    const discountedFlows = rows.map((r) => r.dcf);
    const discountedPayback = computePayback(discountedFlows);
    const rate = irr(cashFlows) * 100;

    el(resultId).innerHTML = `
      <div class="summary-payment-box">
        <div class="label">Payback Period</div>
        <div class="value">${payback !== null ? payback.toFixed(3) + ' years' : 'Never'}</div>
      </div>
      <div class="stat-row"><span>Discounted Payback Period</span><strong>${discountedPayback !== null ? discountedPayback.toFixed(3) + ' years' : 'Never'}</strong></div>
      <div class="stat-row"><span>Cash Flow Return Rate</span><strong>${rate.toFixed(2)}% per year</strong></div>
    `;
    el(tableWrapId).innerHTML = renderTable(rows);
    el(resultsSectionId).hidden = false;
  }

  /* ---------- Calculator 1: fixed (growing/shrinking) cash flow ---------- */
  const form1 = el('pp1-form');
  if (form1) {
    function calc1() {
      const initial = num('pp1-initial', 0);
      const baseCashFlow = num('pp1-cashflow', 0);
      const changeDir = el('pp1-change-dir').value === 'decrease' ? -1 : 1;
      const changeRate = num('pp1-change-rate', 0) / 100 * changeDir;
      const years = Math.round(num('pp1-years', 0));
      const discountRate = num('pp1-discount', 0);

      if (!(initial > 0) || years <= 0) {
        el('pp1-result').innerHTML = '<p class="tool-result is-error">Enter an initial investment and number of years.</p>';
        return;
      }

      const cashFlows = [-initial];
      for (let y = 1; y <= years; y++) cashFlows.push(baseCashFlow * Math.pow(1 + changeRate, y - 1));

      renderResult('pp1-result', 'pp1-table-wrap', 'pp1-results-section', cashFlows, discountRate);
    }
    form1.addEventListener('submit', (e) => { e.preventDefault(); calc1(); });
    calc1();
  }

  /* ---------- Calculator 2: irregular cash flow ---------- */
  const form2 = el('pp2-form');
  if (form2) {
    const ROW_COUNT = 10;

    function calc2() {
      const initial = num('pp2-initial', 0);
      const discountRate = num('pp2-discount', 0);
      if (!(initial > 0)) {
        el('pp2-result').innerHTML = '<p class="tool-result is-error">Enter an initial investment.</p>';
        return;
      }

      const cashFlows = [-initial];
      for (let i = 1; i <= ROW_COUNT; i++) {
        const field = el(`pp2-year-${i}`);
        if (!field || field.value === '') break;
        cashFlows.push(num(`pp2-year-${i}`, 0));
      }
      if (cashFlows.length < 2) {
        el('pp2-result').innerHTML = '<p class="tool-result is-error">Enter at least one year of cash flow.</p>';
        return;
      }

      renderResult('pp2-result', 'pp2-table-wrap', 'pp2-results-section', cashFlows, discountRate);
    }

    function addRow(i) {
      const wrap = document.createElement('div');
      wrap.className = 'field-group';
      wrap.innerHTML = `<label for="pp2-year-${i}">Year ${i}</label><input type="number" id="pp2-year-${i}" step="100">`;
      return wrap;
    }
    const rowsContainer = el('pp2-rows');
    for (let i = 1; i <= ROW_COUNT; i++) rowsContainer.appendChild(addRow(i));

    const defaults2 = [5000, 25000, 35000, 40000, 30000, 10000];
    defaults2.forEach((v, idx) => { el(`pp2-year-${idx + 1}`).value = v; });

    form2.addEventListener('submit', (e) => { e.preventDefault(); calc2(); });
    calc2();
  }
})();
