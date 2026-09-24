'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const currency = (v) => '$' + Math.round(v).toLocaleString('en-US');
  const currency2 = (v) => '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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

  function statRow(label, value) {
    return `<div class="stat-row"><span>${label}</span><strong>${value}</strong></div>`;
  }

  function closingCostAmt(price, includeCosts, mode, val) {
    if (!includeCosts) return 0;
    return mode === 'pct' ? price * val / 100 : val;
  }

  function monthlyPayment(loanAmount, rate, termYears) {
    return loanAmount * monthlyPIFactor(rate, Math.round(termYears * 12));
  }

  /* ---------- Panel 1: solve for home price ---------- */
  const form1 = el('dp1-form');
  if (form1) {
    function calc1() {
      const cash = num('dp1-cash', 0);
      const downPct = num('dp1-down', 0);
      const includeCosts = el('dp1-include-costs').checked;
      const closingMode = el('dp1-closing-mode').value;
      const closingVal = num('dp1-closing', 0);
      const rate = num('dp1-rate', 0);
      const termYears = num('dp1-term', 30);

      if (!(cash > 0) || !(downPct > 0)) {
        el('dp1-result').innerHTML = '<p class="tool-result is-error">Enter your available cash and down payment percentage.</p>';
        return;
      }

      let price;
      if (closingMode === 'pct') {
        const denom = downPct / 100 + (includeCosts ? closingVal / 100 : 0);
        price = denom > 0 ? cash / denom : 0;
      } else {
        const closingFixed = includeCosts ? closingVal : 0;
        price = (downPct / 100) > 0 ? (cash - closingFixed) / (downPct / 100) : 0;
      }
      if (!(price > 0)) { el('dp1-result').innerHTML = '<p class="tool-result is-error">Enter valid values.</p>'; return; }

      const downAmt = price * downPct / 100;
      const closing = closingCostAmt(price, includeCosts, closingMode, closingVal);
      const loanAmount = price - downAmt;
      const payment = monthlyPayment(loanAmount, rate, termYears);

      el('dp1-result').innerHTML = `
        <div class="summary-payment-box">
          <div class="label">Home Price</div>
          <div class="value">${currency(price)}</div>
        </div>
        ${statRow('Home Price', currency(price))}
        ${statRow('Down Payment', currency(downAmt))}
        ${includeCosts ? statRow('Closing Costs', currency(closing)) : ''}
        ${statRow('Loan Amount', currency(loanAmount))}
        ${statRow('Monthly Payment', currency(payment))}
      `;
    }
    form1.addEventListener('submit', (e) => { e.preventDefault(); calc1(); });
    el('dp1-include-costs').addEventListener('change', () => { el('dp1-closing-fields').hidden = !el('dp1-include-costs').checked; });
    calc1();
  }

  /* ---------- Panel 2: solve for cash needed ---------- */
  const form2 = el('dp2-form');
  if (form2) {
    function calc2() {
      const price = num('dp2-price', 0);
      const downPct = num('dp2-down', 0);
      const includeCosts = el('dp2-include-costs').checked;
      const closingMode = el('dp2-closing-mode').value;
      const closingVal = num('dp2-closing', 0);
      const rate = num('dp2-rate', 0);
      const termYears = num('dp2-term', 30);

      if (!(price > 0)) { el('dp2-result').innerHTML = '<p class="tool-result is-error">Enter a home price.</p>'; return; }

      const downAmt = price * downPct / 100;
      const closing = closingCostAmt(price, includeCosts, closingMode, closingVal);
      const cashNeeded = downAmt + closing;
      const loanAmount = price - downAmt;
      const payment = monthlyPayment(loanAmount, rate, termYears);

      el('dp2-result').innerHTML = `
        <div class="summary-payment-box">
          <div class="label">Cash Needed</div>
          <div class="value">${currency(cashNeeded)}</div>
        </div>
        ${statRow('Down Payment', currency(downAmt))}
        ${includeCosts ? statRow('Closing Costs', currency(closing)) : ''}
        ${statRow('Down Payment + Closing Costs', currency(cashNeeded))}
        ${statRow('Loan Amount', currency(loanAmount))}
        ${statRow('Monthly Payment', currency(payment))}
      `;
    }
    form2.addEventListener('submit', (e) => { e.preventDefault(); calc2(); });
    el('dp2-include-costs').addEventListener('change', () => { el('dp2-closing-fields').hidden = !el('dp2-include-costs').checked; });
    calc2();
  }

  /* ---------- Panel 3: solve for down payment % ---------- */
  const form3 = el('dp3-form');
  if (form3) {
    function calc3() {
      const price = num('dp3-price', 0);
      const cash = num('dp3-cash', 0);
      const includeCosts = el('dp3-include-costs').checked;
      const closingMode = el('dp3-closing-mode').value;
      const closingVal = num('dp3-closing', 0);
      const rate = num('dp3-rate', 0);
      const termYears = num('dp3-term', 30);

      if (!(price > 0) || !(cash > 0)) { el('dp3-result').innerHTML = '<p class="tool-result is-error">Enter a home price and available cash.</p>'; return; }

      const closing = closingCostAmt(price, includeCosts, closingMode, closingVal);
      const downAmt = Math.max(cash - closing, 0);
      const downPct = downAmt / price * 100;
      const loanAmount = price - downAmt;
      const payment = monthlyPayment(loanAmount, rate, termYears);

      el('dp3-result').innerHTML = `
        <div class="summary-payment-box">
          <div class="label">Down Payment</div>
          <div class="value">${downPct.toFixed(1)}%</div>
        </div>
        ${statRow('Down Payment', currency(downAmt))}
        ${statRow('Down Payment Percentage', downPct.toFixed(1) + '%')}
        ${includeCosts ? statRow('Closing Costs', currency(closing)) : ''}
        ${statRow('Loan Amount', currency(loanAmount))}
        ${statRow('Monthly Payment', currency(payment))}
        ${downPct < 20 ? '<p class="headline-sub">Since the down payment is less than 20%, you\'ll likely be asked to pay PMI (mortgage insurance).</p>' : ''}
      `;
    }
    form3.addEventListener('submit', (e) => { e.preventDefault(); calc3(); });
    el('dp3-include-costs').addEventListener('change', () => { el('dp3-closing-fields').hidden = !el('dp3-include-costs').checked; });
    calc3();
  }
})();
