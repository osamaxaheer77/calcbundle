'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('lease-form');
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

  function simulate(loanAmount, annualRatePct, payment, termMonths) {
    const monthlyRate = annualRatePct / 100 / 12;
    let bal = loanAmount;
    let totalInterest = 0;
    for (let m = 1; m <= termMonths && bal > 0.005; m++) {
      const interest = bal * monthlyRate;
      let principal = payment - interest;
      if (principal > bal) principal = bal;
      bal -= principal;
      totalInterest += interest;
    }
    return { totalInterest };
  }

  function calculate() {
    const price = num('lease-price', 0);
    const term = Math.round(num('lease-term', 36));
    const rateMode = el('lease-rate-mode').value;
    const rateVal = num('lease-rate', 0);
    const moneyFactor = rateMode === 'apr' ? rateVal / 100 / 24 : rateVal;
    const equivalentAPR = moneyFactor * 2400;
    const down = num('lease-down', 0);
    const tradeIn = num('lease-tradein', 0);
    const taxPct = num('lease-tax', 0);
    const residual = num('lease-residual', 0);

    if (!(price > 0) || !(term > 0)) {
      el('lease-result').innerHTML = '<p class="tool-result is-error">Enter the auto price and lease term.</p>';
      return;
    }

    const capCost = price - down - tradeIn;
    const monthlyDepreciation = (capCost - residual) / term;
    const monthlyInterest = (capCost + residual) * moneyFactor;
    const basePayment = monthlyDepreciation + monthlyInterest;
    const monthlyTax = basePayment * taxPct / 100;
    const monthlyLeasePayment = basePayment + monthlyTax;
    const upfrontTax = down * taxPct / 100;
    const totalLeasePayments = monthlyLeasePayment * term;
    const residualTax = residual * taxPct / 100;
    const totalCostToOwnAfterLease = down + upfrontTax + totalLeasePayments + residual + residualTax;

    // Purchase comparison, same conditions (no fees), using the money-factor-equivalent APR.
    const loanAmount = price - down - tradeIn;
    const purchaseTax = price * taxPct / 100;
    const purchasePayment = loanAmount * monthlyPIFactor(equivalentAPR, term);
    const purchaseSim = simulate(loanAmount, equivalentAPR, purchasePayment, term);
    const purchaseTotalPaid = purchasePayment * term;
    const purchaseUpfront = down + purchaseTax;
    const purchaseTotalCost = price + purchaseSim.totalInterest + purchaseTax;

    el('lease-result').innerHTML = `
      <div class="summary-payment-box">
        <div class="label">Monthly Lease Payment</div>
        <div class="value">${currency(monthlyLeasePayment)}</div>
      </div>
      <div class="stat-row"><span>Monthly Depreciation</span><strong>${currency(monthlyDepreciation)}</strong></div>
      <div class="stat-row"><span>Monthly Interest</span><strong>${currency(monthlyInterest)}</strong></div>
      <div class="stat-row"><span>Monthly Tax</span><strong>${currency(monthlyTax)}</strong></div>
      <div class="stat-row"><span>Money Factor Equivalent APR</span><strong>${equivalentAPR.toFixed(2)}%</strong></div>
      <div class="stat-row"><span>Down Payment</span><strong>${currency0(down)}</strong></div>
      <div class="stat-row"><span>Upfront Tax</span><strong>${currency0(upfrontTax)}</strong></div>
      <div class="stat-row"><span>Total ${term} Lease Payments</span><strong>${currency(totalLeasePayments)}</strong></div>
      <div class="stat-row"><span>Total Cost to Own After Lease Ends</span><strong>${currency(totalCostToOwnAfterLease)}</strong></div>

      <div class="subsection-title">If Purchased Under the Same Conditions</div>
      <div class="stat-row"><span>Monthly Payment</span><strong>${currency(purchasePayment)}</strong></div>
      <div class="stat-row"><span>Sale Tax</span><strong>${currency0(purchaseTax)}</strong></div>
      <div class="stat-row"><span>Upfront Payment</span><strong>${currency0(purchaseUpfront)}</strong></div>
      <div class="stat-row"><span>Total Loan Amount</span><strong>${currency0(loanAmount)}</strong></div>
      <div class="stat-row"><span>Total of ${term} Loan Payments</span><strong>${currency(purchaseTotalPaid)}</strong></div>
      <div class="stat-row"><span>Total Loan Interest</span><strong>${currency(purchaseSim.totalInterest)}</strong></div>
      <div class="stat-row"><span>Total Cost to Own</span><strong>${currency(purchaseTotalCost)}</strong></div>
      <p class="headline-sub">Documentation, tag, title, and registration fees apply equally to both leasing and buying and aren't included above. Leases often add acquisition, security deposit, and disposition fees that a purchase wouldn't have.</p>
    `;
  }

  el('lease-rate-mode').addEventListener('change', () => {
    const mode = el('lease-rate-mode').value;
    el('lease-rate-label').textContent = mode === 'apr' ? 'Interest Rate (%)' : 'Money Factor';
    el('lease-rate').step = mode === 'apr' ? '0.01' : '0.00001';
  });

  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  calculate();
})();
