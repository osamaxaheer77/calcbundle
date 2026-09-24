'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('cbli-form');
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

  function scenario(price, taxBasisPrice, term, rate, down, tradeIn, taxPct, fees, includeInLoan) {
    const loanBase = price - down - tradeIn;
    const salesTax = taxBasisPrice * taxPct / 100;
    const loanAmount = includeInLoan ? loanBase + salesTax + fees : loanBase;
    const upfrontPayment = down + (includeInLoan ? 0 : salesTax + fees);
    const payment = loanAmount * monthlyPIFactor(rate, term);
    const sim = simulate(loanAmount, rate, payment, term);
    const totalPaid = payment * term;
    const totalCost = price + sim.totalInterest + salesTax + fees;
    return { loanAmount, salesTax, upfrontPayment, payment, totalPaid, totalInterest: sim.totalInterest, totalCost };
  }

  function renderScenario(title, s, term) {
    return `
      <div class="subsection-title">${title}</div>
      <div class="stat-row"><span>Total Loan Amount</span><strong>${currency0(s.loanAmount)}</strong></div>
      <div class="stat-row"><span>Sale Tax</span><strong>${currency0(s.salesTax)}</strong></div>
      <div class="stat-row"><span>Upfront Payment</span><strong>${currency0(s.upfrontPayment)}</strong></div>
      <div class="stat-row"><span>Monthly Pay</span><strong>${currency(s.payment)}</strong></div>
      <div class="stat-row"><span>Total of ${term} Loan Payments</span><strong>${currency(s.totalPaid)}</strong></div>
      <div class="stat-row"><span>Total Loan Interest</span><strong>${currency(s.totalInterest)}</strong></div>
      <div class="stat-row"><span>Total Cost (price, interest, tax, fees)</span><strong>${currency(s.totalCost)}</strong></div>
    `;
  }

  function calculate() {
    const cashBack = num('cbli-cashback', 0);
    const rateHigh = num('cbli-rate-high', 0);
    const rateLow = num('cbli-rate-low', 0);
    const price = num('cbli-price', 0);
    const term = Math.round(num('cbli-term', 60));
    const down = num('cbli-down', 0);
    const tradeIn = num('cbli-tradein', 0);
    const taxPct = num('cbli-tax', 0);
    const fees = num('cbli-fees', 0);
    const includeInLoan = el('cbli-include-loan').checked;

    if (!(price > 0) || !(term > 0)) {
      el('cbli-result').innerHTML = '<p class="tool-result is-error">Enter the auto price and loan term.</p>';
      return;
    }

    const withCashBack = scenario(price - cashBack, price, term, rateHigh, down, tradeIn, taxPct, fees, includeInLoan);
    const withLowRate = scenario(price, price, term, rateLow, down, tradeIn, taxPct, fees, includeInLoan);

    const interestSavings = withCashBack.totalInterest - withLowRate.totalInterest;
    const lowRateBetter = interestSavings > cashBack;
    const diff = Math.abs(interestSavings - cashBack);

    const headline = interestSavings === cashBack
      ? `Both offers cost about the same.`
      : lowRateBetter
        ? `The Low Interest Rate Offer is Better!`
        : `The Cash Back Offer is Better!`;
    const sub = lowRateBetter
      ? `The low rate will save you ${currency0(interestSavings)} in interest, which is larger than the cash back of ${currency0(cashBack)}.`
      : `The cash back of ${currency0(cashBack)} is larger than the ${currency0(interestSavings)} you'd save in interest with the low rate.`;

    el('cbli-result').innerHTML = `
      <div class="summary-payment-box">
        <div class="label">Result</div>
        <div class="value" style="font-size:22px;">${headline}</div>
      </div>
      <p class="headline-sub">${sub}</p>
      ${renderScenario('With Cash Back Offer', withCashBack, term)}
      ${renderScenario('With Low Interest Rate Offer', withLowRate, term)}
    `;
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  calculate();
})();
