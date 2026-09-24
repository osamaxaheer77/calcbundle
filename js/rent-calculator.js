'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('r-form');
  if (!form) return;

  const currency = (v) => '$' + Math.round(v).toLocaleString('en-US');

  function num(id, fallback = 0) {
    const v = parseFloat(el(id).value);
    return Number.isFinite(v) ? v : fallback;
  }

  function calculate() {
    const incomeRaw = num('r-income', 0);
    const mode = el('r-income-mode').value;
    const debt = num('r-debt', 0);

    if (!(incomeRaw > 0)) {
      el('r-result').innerHTML = '<p class="tool-result is-error">Enter your pre-tax income.</p>';
      return;
    }

    const monthlyIncome = mode === 'year' ? incomeRaw / 12 : incomeRaw;
    const maxRent = Math.max(monthlyIncome * 0.36 - debt, 0);
    const recommendedRent = Math.max(monthlyIncome * 0.28 - debt, 0);
    const oneThird = monthlyIncome / 3;

    const barMax = Math.max(maxRent, 1);
    const recPct = Math.min(recommendedRent / barMax * 100, 100);

    el('r-result').innerHTML = `
      <div class="summary-payment-box">
        <div class="label">You Can Afford Up To</div>
        <div class="value">${currency(maxRent)} / month</div>
      </div>
      <p class="headline-sub">It's recommended to keep your rent below ${currency(recommendedRent)} per month.</p>
      <div class="rent-bar">
        <div class="rent-bar-track">
          <div class="rent-bar-fill" style="width:${recPct}%;"></div>
        </div>
        <div class="rent-bar-labels">
          <span>${currency(recommendedRent)} recommended</span>
          <span>${currency(maxRent)} max</span>
        </div>
      </div>
      <div class="stat-row"><span>Monthly Income</span><strong>${currency(monthlyIncome)}</strong></div>
      <div class="stat-row"><span>Monthly Debt Payback</span><strong>${currency(debt)}</strong></div>
      ${maxRent > oneThird ? `<div class="callout">Some landlords won't accept applications with rent above one-third of gross income — for you, that's ${currency(oneThird)} per month.</div>` : ''}
    `;
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  calculate();
})();
