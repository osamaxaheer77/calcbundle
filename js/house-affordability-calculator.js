'use strict';

/**
 * House affordability math: the house price is the unknown, but every
 * cost (loan P&I, property tax, HOA, insurance, maintenance) is a linear
 * function of that price once the down payment and %/$ modes are fixed.
 * So we solve directly for price = (targetMonthlyCost - intercept) / slope
 * instead of iterating.
 */
const AffordMath = {
  monthlyPIFactor(annualRatePct, termYears) {
    const r = annualRatePct / 100 / 12;
    const n = termYears * 12;
    if (n <= 0) return 0;
    if (r === 0) return 1 / n;
    return r / (1 - Math.pow(1 + r, -n));
  },

  /**
   * costs: array of { mode: 'pct'|'amt', val } — 'pct' is %/year of price,
   * 'amt' is a fixed $/year. down: { mode, val }.
   * Returns { price, loanAmount, downAmt } or null if unsolvable.
   */
  solvePrice(targetMonthlyCost, piFactor, down, costs) {
    let a = 1, b = 0;
    if (down.mode === 'pct') { a = 1 - down.val / 100; } else { b = down.val; }

    let slope = a * piFactor;
    let intercept = -b * piFactor;
    costs.forEach((c) => {
      if (c.mode === 'pct') slope += c.val / 1200;
      else intercept += c.val / 12;
    });

    if (slope <= 0) return null;
    const price = (targetMonthlyCost - intercept) / slope;
    if (!(price > 0)) return null;

    const loanAmount = price * a - b;
    const downAmt = price - loanAmount;
    return { price, loanAmount: Math.max(loanAmount, 0), downAmt };
  },

  annualCost(mode, val, price) {
    return mode === 'pct' ? price * val / 100 : val;
  },
};

/* ===================== UI wiring ===================== */
(function () {
  const el = (id) => document.getElementById(id);
  const currency = (v) => '$' + Math.round(v).toLocaleString('en-US');
  const currency2 = (v) => '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pct = (v) => v.toFixed(0) + '%';

  function num(id, fallback = 0) {
    const field = el(id);
    if (!field) return fallback;
    const v = parseFloat(field.value);
    return Number.isFinite(v) ? v : fallback;
  }

  function toggle(valId, modeId) {
    return { val: num(valId, 0), mode: el(modeId).value };
  }

  function statRow(label, value) {
    return `<div class="stat-row"><span>${label}</span><strong>${value}</strong></div>`;
  }

  function renderError(resultId, msg) {
    el(resultId).innerHTML = `<p class="tool-result is-error">${msg}</p>`;
  }

  /* ---------- Panel D: income / DTI based ---------- */
  const dForm = el('d-form');
  if (dForm) {
    function calcD() {
      const income = num('d-income', 0);
      const term = num('d-term', 30);
      const rate = num('d-rate', 0);
      const debt = num('d-debt', 0);
      const down = toggle('d-down', 'd-down-mode');
      const tax = toggle('d-tax', 'd-tax-mode');
      const hoa = toggle('d-hoa', 'd-hoa-mode');
      const ins = toggle('d-ins', 'd-ins-mode');
      const dtiChoice = el('d-dti').value;

      if (!(income > 0) || !(term > 0) || !(rate >= 0)) {
        renderError('d-result', 'Enter your annual income, loan term, and interest rate.');
        return;
      }

      const monthlyIncome = income / 12;
      let frontCap = null, backCap = null, singleCap = null, ruleLabel = '';
      if (dtiChoice === 'cv') { frontCap = 28; backCap = 36; ruleLabel = 'the 28/36 rule (conventional loan)'; }
      else if (dtiChoice === 'fha') { frontCap = 31; backCap = 43; ruleLabel = 'the FHA 31/43 rule'; }
      else if (dtiChoice === 'va') { singleCap = 41; ruleLabel = 'a VA loan (41% DTI)'; }
      else { singleCap = parseFloat(dtiChoice); ruleLabel = `a ${singleCap}% debt-to-income ratio`; }

      let maxHousing;
      if (frontCap !== null) {
        maxHousing = Math.min(frontCap / 100 * monthlyIncome, backCap / 100 * monthlyIncome - debt);
      } else {
        maxHousing = singleCap / 100 * monthlyIncome - debt;
      }

      if (!(maxHousing > 0)) {
        renderError('d-result', 'Monthly debt is too high relative to income for this DTI ratio to allow any housing budget.');
        return;
      }

      const piFactor = AffordMath.monthlyPIFactor(rate, term);
      const solved = AffordMath.solvePrice(maxHousing, piFactor, down, [tax, hoa, ins]);
      if (!solved) { renderError('d-result', 'Enter a valid down payment and cost inputs.'); return; }

      const { price, loanAmount, downAmt } = solved;
      const PI = loanAmount * piFactor;
      const taxAnnual = AffordMath.annualCost(tax.mode, tax.val, price);
      const hoaAnnual = AffordMath.annualCost(hoa.mode, hoa.val, price);
      const insAnnual = AffordMath.annualCost(ins.mode, ins.val, price);
      const maintAnnual = price * 0.015;
      const closingCost = price * 0.03;
      const totalClosing = downAmt + closingCost;
      const housingMonthly = PI + taxAnnual / 12 + hoaAnnual / 12 + insAnnual / 12;
      const totalMonthly = housingMonthly + maintAnnual / 12;
      const frontEndPct = housingMonthly / monthlyIncome * 100;
      const backEndPct = (housingMonthly + debt) / monthlyIncome * 100;

      el('d-result').innerHTML = `
        <div class="summary-payment-box">
          <div class="label">You Can Afford a House Up To</div>
          <div class="value">${currency(price)}</div>
        </div>
        <p class="headline-sub">According to ${ruleLabel}, within which ${currency(loanAmount)} is the loan and ${currency(downAmt)} is the down payment.</p>
        <div id="d-stats">
          ${statRow('You Can Borrow', currency(loanAmount))}
          ${statRow('Total Price of the House', currency(price))}
          ${statRow('Down Payment', currency(downAmt))}
          ${statRow('Estimated Closing Cost (one-time, assume 3%)', currency(closingCost))}
          ${frontCap !== null ? statRow('Front-end Debt-to-Income Ratio', pct(frontEndPct)) : statRow('Debt-to-Income Ratio', pct(backEndPct))}
          ${frontCap !== null ? statRow('Back-end Debt-to-Income Ratio', pct(backEndPct)) : ''}
          ${statRow('Total One-time Payment at Closing', currency(totalClosing))}
        </div>
        <div class="subsection-title">Monthly Costs</div>
        <div>
          ${statRow('Monthly Mortgage Payment', currency2(PI))}
          ${statRow('Annual Property Tax', currency(taxAnnual))}
          ${statRow('Annual HOA / Co-op Fee', currency(hoaAnnual))}
          ${statRow('Annual Insurance Cost', currency(insAnnual))}
          ${statRow('Estimated Annual Maintenance (assume 1.5%)', currency(maintAnnual))}
          ${statRow('Total Monthly Cost on the House', currency(totalMonthly))}
        </div>
      `;
    }

    dForm.addEventListener('submit', (e) => { e.preventDefault(); calcD(); });
    calcD();
  }

  /* ---------- Panel B: fixed monthly budget based ---------- */
  const bForm = el('b-form');
  if (bForm) {
    function calcB() {
      const budget = num('b-budget', 0);
      const term = num('b-term', 30);
      const rate = num('b-rate', 0);
      const down = toggle('b-down', 'b-down-mode');
      const includeFees = el('b-include-fees').checked;
      const tax = toggle('b-tax', 'b-tax-mode');
      const hoa = toggle('b-hoa', 'b-hoa-mode');
      const ins = toggle('b-ins', 'b-ins-mode');
      const maint = toggle('b-maint', 'b-maint-mode');

      if (!(budget > 0) || !(term > 0) || !(rate >= 0)) {
        renderError('b-result', 'Enter your monthly budget, loan term, and interest rate.');
        return;
      }

      const piFactor = AffordMath.monthlyPIFactor(rate, term);
      const solved = AffordMath.solvePrice(budget, piFactor, down, includeFees ? [tax, hoa, ins, maint] : []);
      if (!solved) { renderError('b-result', 'Enter a valid down payment and cost inputs.'); return; }

      const { price, loanAmount, downAmt } = solved;
      const PI = loanAmount * piFactor;
      const taxAnnual = AffordMath.annualCost(tax.mode, tax.val, price);
      const hoaAnnual = AffordMath.annualCost(hoa.mode, hoa.val, price);
      const insAnnual = AffordMath.annualCost(ins.mode, ins.val, price);
      const maintAnnual = AffordMath.annualCost(maint.mode, maint.val, price);
      const closingCost = price * 0.03;
      const totalClosing = downAmt + closingCost;
      const totalMonthly = PI + taxAnnual / 12 + hoaAnnual / 12 + insAnnual / 12 + maintAnnual / 12;

      el('b-result').innerHTML = `
        <div class="summary-payment-box">
          <div class="label">You Can Afford a House Up To</div>
          <div class="value">${currency(price)}</div>
        </div>
        <p class="headline-sub">Based on a ${currency(budget)}/month budget, within which ${currency(loanAmount)} is the loan and ${currency(downAmt)} is the down payment.</p>
        <div id="b-stats">
          ${statRow('You Can Borrow', currency(loanAmount))}
          ${statRow('Total Price of the House', currency(price))}
          ${statRow('Down Payment', currency(downAmt))}
          ${statRow('Estimated Closing Cost (one-time, assume 3%)', currency(closingCost))}
          ${statRow('Total One-time Payment at Closing', currency(totalClosing))}
        </div>
        <div class="subsection-title">Monthly Costs</div>
        <div>
          ${statRow('Monthly Mortgage Payment', currency2(PI))}
          ${statRow('Annual Property Tax', currency(taxAnnual))}
          ${statRow('Annual HOA / Co-op Fee', currency(hoaAnnual))}
          ${statRow('Annual Insurance Cost', currency(insAnnual))}
          ${statRow('Annual Maintenance Cost', currency(maintAnnual))}
          ${statRow('Total Monthly Cost on the House', currency(totalMonthly))}
        </div>
      `;
    }

    bForm.addEventListener('submit', (e) => { e.preventDefault(); calcB(); });
    calcB();
  }
})();
