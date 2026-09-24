'use strict';

const VAMath = {
  monthlyPIFactor(annualRatePct, termMonths) {
    const r = annualRatePct / 100 / 12;
    if (termMonths <= 0) return 0;
    if (r === 0) return 1 / termMonths;
    return r / (1 - Math.pow(1 + r, -termMonths));
  },

  addMonths(year, month, count) {
    const total = (year * 12 + (month - 1)) + count;
    return { year: Math.floor(total / 12), month: (total % 12) + 1 };
  },

  fundingFeePct(downPct, usedBefore, disabled, eligibility) {
    if (disabled || eligibility === 'spouse') return 0;
    if (downPct < 5) return usedBefore ? 3.3 : 2.15;
    if (downPct < 10) return 1.5;
    return 1.25;
  },

  simulate(input) {
    const { loanAmount, annualRatePct, termMonths, startMonth, startYear, propertyTaxAnnual, insuranceAnnual, hoaAnnual, otherAnnual } = input;
    const monthlyRate = annualRatePct / 100 / 12;
    const basePI = loanAmount * this.monthlyPIFactor(annualRatePct, termMonths);
    let balance = loanAmount;
    const months = [];
    let totalInterest = 0;
    for (let m = 1; m <= termMonths && balance > 0.005; m++) {
      const cursor = this.addMonths(startYear, startMonth, m - 1);
      const interest = balance * monthlyRate;
      let principal = basePI - interest;
      if (principal > balance) principal = balance;
      balance -= principal;
      totalInterest += interest;
      months.push({ month: cursor.month, year: cursor.year, interest, principal, balance: Math.max(balance, 0) });
    }
    return { basePI, months, totalInterest, actualMonths: months.length };
  },

  toAnnualSchedule(months) {
    const years = [];
    let bucket = null;
    months.forEach((m, i) => {
      if (!bucket || (i % 12 === 0)) { bucket = { yearIndex: years.length + 1, interest: 0, principal: 0, endingBalance: 0 }; years.push(bucket); }
      bucket.interest += m.interest;
      bucket.principal += m.principal;
      bucket.endingBalance = m.balance;
    });
    return years;
  },
};

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('va-form');
  if (!form) return;

  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currency = (v) => '$' + Math.round(v).toLocaleString('en-US');
  const currency2 = (v) => '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  let lastResult = null;
  let scheduleView = 'annual';

  function num(id, fallback = 0) {
    const v = parseFloat(el(id).value);
    return Number.isFinite(v) ? v : fallback;
  }
  function radioVal(name) {
    const checked = form.querySelector(`input[name="${name}"]:checked`);
    return checked ? checked.value : null;
  }

  function donutChart(segments) {
    const total = segments.reduce((s, x) => s + x.value, 0) || 1;
    const r = 15.9155;
    let offset = 25;
    let circles = '';
    segments.forEach((seg) => {
      const pct = (seg.value / total) * 100;
      circles += `<circle cx="21" cy="21" r="${r}" fill="transparent" stroke="${seg.color}" stroke-width="4" stroke-dasharray="${pct} ${100 - pct}" stroke-dashoffset="${offset}"></circle>`;
      offset -= pct;
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

  function renderSchedule(annualRows, monthlyRows) {
    const box = el('va-schedule-body');
    const rows = scheduleView === 'annual' ? annualRows : monthlyRows;
    let html = '';
    if (scheduleView === 'annual') {
      html += '<table class="schedule-table"><thead><tr><th>Year</th><th>Interest</th><th>Principal</th><th>Ending Balance</th></tr></thead><tbody>';
      rows.forEach((r) => { html += `<tr><td>${r.yearIndex}</td><td>${currency(r.interest)}</td><td>${currency(r.principal)}</td><td>${currency(r.endingBalance)}</td></tr>`; });
    } else {
      html += '<table class="schedule-table"><thead><tr><th>Date</th><th>Interest</th><th>Principal</th><th>Ending Balance</th></tr></thead><tbody>';
      rows.forEach((r) => { html += `<tr><td>${MONTH_NAMES[r.month - 1]} ${r.year}</td><td>${currency(r.interest)}</td><td>${currency(r.principal)}</td><td>${currency(r.balance)}</td></tr>`; });
    }
    html += '</tbody></table>';
    box.innerHTML = html;
  }

  function calculate() {
    const housePrice = num('va-price', 0);
    const downMode = el('va-down-mode').value;
    const downVal = num('va-down', 0);
    const downAmt = downMode === 'pct' ? housePrice * downVal / 100 : downVal;
    const downPct = housePrice > 0 ? downAmt / housePrice * 100 : 0;
    const termYears = num('va-term', 30);
    const rate = num('va-rate', 0);

    const eligibility = radioVal('va-eligibility');
    const usedBefore = radioVal('va-used-before') === 'yes';
    const disabled = radioVal('va-disability') === 'yes';
    const feeOption = radioVal('va-fee-option');

    const includeCosts = el('va-include-costs').checked;
    const taxMode = includeCosts ? el('va-tax-mode').value : 'pct';
    const taxVal = includeCosts ? num('va-tax', 0) : 0;
    const propertyTaxAnnual = includeCosts ? (taxMode === 'pct' ? housePrice * taxVal / 100 : taxVal) : 0;
    const insuranceAnnual = includeCosts ? num('va-insurance', 0) : 0;
    const hoaAnnual = includeCosts ? num('va-hoa', 0) : 0;
    const otherAnnual = includeCosts ? num('va-other', 0) : 0;

    const startMonth = parseInt(el('va-start-month').value, 10);
    const startYear = num('va-start-year', new Date().getFullYear());

    if (!(housePrice > 0) || !(termYears > 0)) {
      el('va-result').innerHTML = '<p class="tool-result is-error">Enter a home price and loan term.</p>';
      return;
    }

    const feePct = VAMath.fundingFeePct(downPct, usedBefore, disabled, eligibility);
    const baseLoan = housePrice - downAmt;
    const fundingFeeAmt = baseLoan * feePct / 100;
    const loanAmount = feeOption === 'financed' ? baseLoan + fundingFeeAmt : baseLoan;
    const termMonths = Math.round(termYears * 12);

    const sim = VAMath.simulate({ loanAmount, annualRatePct: rate, termMonths, startMonth, startYear, propertyTaxAnnual, insuranceAnnual, hoaAnnual, otherAnnual });

    const monthlyTax = propertyTaxAnnual / 12, monthlyIns = insuranceAnnual / 12, monthlyHoa = hoaAnnual / 12, monthlyOther = otherAnnual / 12;
    const totalOutOfPocket = sim.basePI + monthlyTax + monthlyIns + monthlyHoa + monthlyOther;
    const totalPI = loanAmount + sim.totalInterest;
    const payoffCursor = VAMath.addMonths(startYear, startMonth, sim.actualMonths);

    lastResult = { sim };

    el('va-summary-payment').textContent = currency2(sim.basePI);

    el('va-breakdown').innerHTML = includeCosts ? `
      <table class="breakdown-table">
        <thead><tr><th></th><th>Monthly</th><th>Total</th></tr></thead>
        <tbody>
          <tr><td>Mortgage Payment</td><td>${currency2(sim.basePI)}</td><td>${currency(totalPI)}</td></tr>
          ${propertyTaxAnnual > 0 ? `<tr><td>Property Tax</td><td>${currency2(monthlyTax)}</td><td>${currency(monthlyTax * sim.actualMonths)}</td></tr>` : ''}
          ${insuranceAnnual > 0 ? `<tr><td>Home Insurance</td><td>${currency2(monthlyIns)}</td><td>${currency(monthlyIns * sim.actualMonths)}</td></tr>` : ''}
          ${hoaAnnual > 0 ? `<tr><td>HOA Fee</td><td>${currency2(monthlyHoa)}</td><td>${currency(monthlyHoa * sim.actualMonths)}</td></tr>` : ''}
          ${otherAnnual > 0 ? `<tr><td>Other Costs</td><td>${currency2(monthlyOther)}</td><td>${currency(monthlyOther * sim.actualMonths)}</td></tr>` : ''}
          <tr class="total-row"><td>Total Out-of-Pocket</td><td>${currency2(totalOutOfPocket)}</td><td>${currency(totalOutOfPocket * sim.actualMonths)}</td></tr>
        </tbody>
      </table>` : '';

    const segments = [{ value: loanAmount, color: 'var(--accent)', label: 'Principal' }, { value: sim.totalInterest, color: '#10b981', label: 'Interest' }];
    if (propertyTaxAnnual > 0) segments.push({ value: propertyTaxAnnual * sim.actualMonths / 12, color: '#f34469', label: 'Property Taxes' });
    if (insuranceAnnual + hoaAnnual + otherAnnual > 0) segments.push({ value: (insuranceAnnual + hoaAnnual + otherAnnual) * sim.actualMonths / 12, color: '#d97706', label: 'Other Costs' });

    el('va-donut-wrap').innerHTML = donutChart(segments) + '<div class="donut-legend">' +
      segments.map((s) => `<span class="legend-item"><span class="legend-dot" style="background:${s.color}"></span>${s.label}</span>`).join('') + '</div>';

    el('va-summary-stats').innerHTML = `
      <div class="stat-row"><span>House Price</span><strong>${currency(housePrice)}</strong></div>
      <div class="stat-row"><span>VA Funding Fee (${feePct}%)</span><strong>${currency(fundingFeeAmt)}${feePct === 0 ? ' (waived)' : feeOption === 'financed' ? ' (financed)' : ' (paid upfront)'}</strong></div>
      <div class="stat-row"><span>Down Payment</span><strong>${currency(downAmt)}</strong></div>
      <div class="stat-row"><span>Loan Amount</span><strong>${currency(loanAmount)}</strong></div>
      <div class="stat-row"><span>Total of ${sim.actualMonths} Mortgage Payments</span><strong>${currency(totalPI)}</strong></div>
      <div class="stat-row"><span>Total Interest</span><strong>${currency(sim.totalInterest)}</strong></div>
      <div class="stat-row"><span>Mortgage Payoff Date</span><strong>${MONTH_NAMES[payoffCursor.month - 1]} ${payoffCursor.year}</strong></div>
    `;

    const annualRows = VAMath.toAnnualSchedule(sim.months);
    el('va-chart-wrap').innerHTML = lineChart(sim.months);
    renderSchedule(annualRows, sim.months);
    el('va-results').hidden = false;
    el('va-schedule-section').hidden = false;
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  el('va-include-costs').addEventListener('change', () => { el('va-costs-fields').hidden = !el('va-include-costs').checked; });

  el('va-schedule-annual').addEventListener('click', () => {
    scheduleView = 'annual';
    el('va-schedule-annual').classList.add('active');
    el('va-schedule-monthly').classList.remove('active');
    if (lastResult) renderSchedule(VAMath.toAnnualSchedule(lastResult.sim.months), lastResult.sim.months);
  });
  el('va-schedule-monthly').addEventListener('click', () => {
    scheduleView = 'monthly';
    el('va-schedule-monthly').classList.add('active');
    el('va-schedule-annual').classList.remove('active');
    if (lastResult) renderSchedule(VAMath.toAnnualSchedule(lastResult.sim.months), lastResult.sim.months);
  });

  function populateYearSelect(id) {
    const select = el(id);
    const thisYear = new Date().getFullYear();
    for (let y = thisYear; y <= thisYear + 10; y++) {
      const opt = document.createElement('option');
      opt.value = y; opt.textContent = y;
      if (y === thisYear) opt.selected = true;
      select.appendChild(opt);
    }
  }
  populateYearSelect('va-start-year');

  calculate();
})();
