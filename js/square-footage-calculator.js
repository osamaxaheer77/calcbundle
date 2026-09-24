'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('sqft-form');
  if (!form) return;

  const fmt = (n) => n.toLocaleString('en-US', { maximumFractionDigits: 2 });
  const money = (n) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  const TO_FEET = { foot: 1, inch: 1 / 12, yard: 3, meter: 3.28084, centimeter: 0.0328084 };
  const SQFT_TO_SQYD = 1 / 9;
  const SQFT_TO_SQM = 0.092903;

  function calculate() {
    const length = (parseFloat(el('sqft-length').value) || 0) * TO_FEET[el('sqft-length-unit').value];
    const width = (parseFloat(el('sqft-width').value) || 0) * TO_FEET[el('sqft-width-unit').value];
    const qty = parseFloat(el('sqft-qty').value) || 0;
    const price = parseFloat(el('sqft-price').value) || 0;
    const resultEl = el('sqft-result');

    const totalArea = length * width * qty;
    const totalCost = totalArea * price;

    resultEl.innerHTML = `
      <div class="summary-payment-box">
        <div class="label">Total Area</div>
        <div class="value">${fmt(totalArea)} sq ft</div>
      </div>
      <div class="stat-row"><span>Or</span><strong>${fmt(totalArea * SQFT_TO_SQYD)} sq yards</strong></div>
      <div class="stat-row"><span>Or</span><strong>${fmt(totalArea * SQFT_TO_SQM)} sq meters</strong></div>
      ${price > 0 ? `<div class="stat-row"><span>Estimated price</span><strong>${money(totalCost)}</strong></div>` : ''}
    `;
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  form.querySelectorAll('input, select').forEach((i) => i.addEventListener('change', calculate));
  calculate();
})();
