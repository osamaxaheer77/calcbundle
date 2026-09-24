'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('rp-form');
  if (!form) return;

  const currency = (v) => '$' + Math.round(v).toLocaleString('en-US');
  const currency2 = (v) => '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pct = (v) => v.toFixed(2) + '%';

  function num(id, fallback = 0) {
    const field = el(id);
    if (!field) return fallback;
    const v = parseFloat(field.value);
    return Number.isFinite(v) ? v : fallback;
  }

  function radioVal(name) {
    const checked = form.querySelector(`input[name="${name}"]:checked`);
    return checked ? checked.value : null;
  }

  function monthlyPIFactor(annualRatePct, termMonths) {
    const r = annualRatePct / 100 / 12;
    if (termMonths <= 0) return 0;
    if (r === 0) return 1 / termMonths;
    return r / (1 - Math.pow(1 + r, -termMonths));
  }

  // Loan balance after `months` payments of a level `payment` amount.
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

  function irr(cashflows) {
    function npv(r) {
      return cashflows.reduce((s, cf, i) => s + cf / Math.pow(1 + r, i), 0);
    }
    let lo = -0.99, hi = 10;
    if (npv(lo) < 0 || npv(hi) > 0) {
      // fall back: widen search or give up gracefully
      hi = 100;
    }
    for (let i = 0; i < 200; i++) {
      const mid = (lo + hi) / 2;
      if (npv(mid) > 0) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }

  function calculate() {
    const price = num('rp-price', 0);
    const useLoan = radioVal('rp-use-loan') === 'yes';
    const downPct = num('rp-down', 20);
    const rate = num('rp-rate', 0);
    const loanTermYears = num('rp-loan-term', 30);
    const closingCost = num('rp-closing', 0);
    const needRepairs = radioVal('rp-need-repairs') === 'yes';
    const repairCost = needRepairs ? num('rp-repair-cost', 0) : 0;
    const afterRepairValue = needRepairs ? num('rp-arv', 0) : price;

    if (!(price > 0)) {
      el('rp-result').innerHTML = '<p class="tool-result is-error">Enter a purchase price.</p>';
      return;
    }

    const downAmt = useLoan ? price * downPct / 100 : price;
    const loanAmount = useLoan ? price - downAmt : 0;
    const loanTermMonths = Math.round(loanTermYears * 12);
    const mortgagePayment = useLoan ? loanAmount * monthlyPIFactor(rate, loanTermMonths) : 0;
    const initialInvestment = downAmt + closingCost + repairCost;

    const taxBase = num('rp-tax', 0), taxInc = num('rp-tax-inc', 0) / 100;
    const insBase = num('rp-ins', 0), insInc = num('rp-ins-inc', 0) / 100;
    const hoaBase = num('rp-hoa', 0), hoaInc = num('rp-hoa-inc', 0) / 100;
    const maintBase = num('rp-maint', 0), maintInc = num('rp-maint-inc', 0) / 100;
    const otherBase = num('rp-other', 0), otherInc = num('rp-other-inc', 0) / 100;

    const rentBase = num('rp-rent', 0) * 12, rentInc = num('rp-rent-inc', 0) / 100;
    const otherIncBase = num('rp-other-income', 0) * 12, otherIncInc = num('rp-other-income-inc', 0) / 100;
    const vacancyPct = num('rp-vacancy', 0) / 100;
    const managementPct = num('rp-management', 0) / 100;

    const knowSellPrice = radioVal('rp-know-sell') === 'yes';
    const holdingYears = Math.max(Math.round(num('rp-holding', 1)), 1);
    const sellCostPct = num('rp-sell-cost', 0) / 100;
    let appreciationRate;
    const startValue = needRepairs ? afterRepairValue : price;
    if (knowSellPrice) {
      const sellPrice = num('rp-sell-price', 0);
      appreciationRate = startValue > 0 ? Math.pow(sellPrice / startValue, 1 / holdingYears) - 1 : 0;
    } else {
      appreciationRate = num('rp-appreciation', 0) / 100;
    }

    const rows = [];
    let cumOperatingCF = [];
    for (let year = 1; year <= holdingYears; year++) {
      const g = (base, r) => base * Math.pow(1 + r, year - 1);
      const incomeGross = g(rentBase, rentInc) + g(otherIncBase, otherIncInc);
      const vacancy = incomeGross * vacancyPct;
      const effectiveIncome = incomeGross - vacancy;
      const management = effectiveIncome * managementPct;
      const tax = g(taxBase, taxInc), ins = g(insBase, insInc), hoa = g(hoaBase, hoaInc), maint = g(maintBase, maintInc), other = g(otherBase, otherInc);
      const operatingExpenses = tax + ins + hoa + maint + other + management;
      const noi = effectiveIncome - operatingExpenses;
      const monthsElapsed = Math.min(year * 12, loanTermMonths);
      const monthsElapsedPrev = Math.min((year - 1) * 12, loanTermMonths);
      const loanActive = useLoan && monthsElapsedPrev < loanTermMonths;
      const mortgagePaidThisYear = loanActive ? mortgagePayment * (monthsElapsed - monthsElapsedPrev) : 0;
      const cashFlow = noi - mortgagePaidThisYear;

      const loanBalance = useLoan ? loanBalanceAfter(loanAmount, rate, mortgagePayment, monthsElapsed) : 0;
      const propertyValue = startValue * Math.pow(1 + appreciationRate, year);
      const equity = propertyValue - loanBalance;
      const cashToReceive = propertyValue * (1 - sellCostPct) - loanBalance;

      cumOperatingCF.push(cashFlow);

      rows.push({
        year, incomeGross, effectiveIncome, mortgagePaidThisYear, operatingExpenses, vacancy, tax, ins, hoa, maint, other, management,
        cashFlow, noi, coc: initialInvestment > 0 ? cashFlow / initialInvestment * 100 : 0,
        equity, cashToReceive,
        isLast: year === holdingYears,
      });
    }

    // Year-by-year IRR: sell at end of that year.
    rows.forEach((row, idx) => {
      const flows = [-initialInvestment];
      for (let i = 0; i <= idx; i++) {
        flows.push(i === idx ? rows[i].cashFlow + row.cashToReceive : rows[i].cashFlow);
      }
      row.irr = irr(flows) * 100;
    });

    const lastRow = rows[rows.length - 1];
    const totalProfit = -initialInvestment + rows.reduce((s, r) => s + r.cashFlow, 0) + lastRow.cashToReceive;
    const totalRentalIncome = rows.reduce((s, r) => s + r.effectiveIncome, 0);
    const totalMortgagePaid = rows.reduce((s, r) => s + r.mortgagePaidThisYear, 0);
    const totalExpenses = rows.reduce((s, r) => s + r.operatingExpenses, 0);
    const totalNOI = rows.reduce((s, r) => s + r.noi, 0);
    const totalCoC = initialInvestment > 0 ? totalProfit / initialInvestment * 100 : 0;
    const finalIRR = lastRow.irr;
    const year1 = rows[0];
    const capRate = price > 0 ? year1.noi / price * 100 : 0;

    let html = `
      <div class="summary-payment-box">
        <div class="label">Return (IRR) over ${holdingYears} Year${holdingYears === 1 ? '' : 's'}</div>
        <div class="value">${pct(finalIRR)} / year</div>
      </div>
      <div class="stat-row"><span>Total Profit When Sold</span><strong>${currency2(totalProfit)}</strong></div>
      <div class="stat-row"><span>Cash on Cash Return</span><strong>${pct(totalCoC)}</strong></div>
      <div class="stat-row"><span>Capitalization Rate (Year 1)</span><strong>${pct(capRate)}</strong></div>
      <div class="stat-row"><span>Total Rental Income</span><strong>${currency2(totalRentalIncome)}</strong></div>
      ${useLoan ? `<div class="stat-row"><span>Total Mortgage Payments</span><strong>${currency2(totalMortgagePaid)}</strong></div>` : ''}
      <div class="stat-row"><span>Total Expenses</span><strong>${currency2(totalExpenses)}</strong></div>
      <div class="stat-row"><span>Total Net Operating Income</span><strong>${currency2(totalNOI)}</strong></div>

      <div class="subsection-title">First Year Income &amp; Expense</div>
      <table class="breakdown-table">
        <thead><tr><th></th><th>Monthly</th><th>Annual</th></tr></thead>
        <tbody>
          <tr><td>Income</td><td>${currency2(year1.incomeGross / 12)}</td><td>${currency2(year1.incomeGross)}</td></tr>
          ${useLoan ? `<tr><td>Mortgage Pay</td><td>${currency2(mortgagePayment)}</td><td>${currency2(year1.mortgagePaidThisYear)}</td></tr>` : ''}
          <tr><td>Vacancy (${(vacancyPct * 100).toFixed(0)}%)</td><td>${currency2(year1.vacancy / 12)}</td><td>${currency2(year1.vacancy)}</td></tr>
          <tr><td>Property Tax</td><td>${currency2(year1.tax / 12)}</td><td>${currency2(year1.tax)}</td></tr>
          <tr><td>Total Insurance</td><td>${currency2(year1.ins / 12)}</td><td>${currency2(year1.ins)}</td></tr>
          ${hoaBase > 0 ? `<tr><td>HOA Fee</td><td>${currency2(year1.hoa / 12)}</td><td>${currency2(year1.hoa)}</td></tr>` : ''}
          <tr><td>Maintenance Cost</td><td>${currency2(year1.maint / 12)}</td><td>${currency2(year1.maint)}</td></tr>
          <tr><td>Other Cost</td><td>${currency2(year1.other / 12)}</td><td>${currency2(year1.other)}</td></tr>
          ${managementPct > 0 ? `<tr><td>Management Fee</td><td>${currency2(year1.management / 12)}</td><td>${currency2(year1.management)}</td></tr>` : ''}
          <tr class="total-row"><td>Cash Flow</td><td>${currency2(year1.cashFlow / 12)}</td><td>${currency2(year1.cashFlow)}</td></tr>
          <tr><td>Net Operating Income (NOI)</td><td>${currency2(year1.noi / 12)}</td><td>${currency2(year1.noi)}</td></tr>
        </tbody>
      </table>

      <div class="subsection-title">Breakdown Over Time</div>
      <div class="schedule-table-wrap" style="max-height:420px;">
        <table class="schedule-table">
          <thead><tr><th>Year</th><th>Income</th>${useLoan ? '<th>Mortgage</th>' : ''}<th>Expenses</th><th>Cash Flow</th><th>CoC Return</th><th>Equity</th><th>Cash if Sold</th><th>IRR</th></tr></thead>
          <tbody>`;

    rows.forEach((r) => {
      const displayCashFlow = r.isLast ? r.cashFlow + r.cashToReceive : r.cashFlow;
      html += `<tr><td>${r.year}</td><td>${currency(r.effectiveIncome)}</td>${useLoan ? `<td>${currency(r.mortgagePaidThisYear)}</td>` : ''}<td>${currency(r.operatingExpenses)}</td><td>${currency(displayCashFlow)}</td><td>${pct(r.coc)}</td><td>${currency(r.equity)}</td><td>${currency(r.cashToReceive)}</td><td>${pct(r.irr)}</td></tr>`;
    });

    html += `</tbody></table></div>`;

    el('rp-result').innerHTML = html;
  }

  function updateVisibility() {
    const useLoan = radioVal('rp-use-loan') === 'yes';
    el('rp-loan-fields').hidden = !useLoan;
    const needRepairs = radioVal('rp-need-repairs') === 'yes';
    el('rp-repair-fields').hidden = !needRepairs;
    const knowSell = radioVal('rp-know-sell') === 'yes';
    el('rp-sell-price-field').hidden = !knowSell;
    el('rp-appreciation-field').hidden = knowSell;
  }

  form.querySelectorAll('input[type="radio"]').forEach((r) => {
    r.addEventListener('change', () => { updateVisibility(); calculate(); });
  });
  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });

  updateVisibility();
  calculate();
})();
