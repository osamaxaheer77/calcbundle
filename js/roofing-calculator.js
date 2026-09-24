'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('roofing-form');
  if (!form) return;

  const fmt = (n) => n.toLocaleString('en-US', { maximumFractionDigits: 1 });
  const money = (n) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  const TO_SQFT = { foot: 1, meter: 1 / 0.092903, yard: 9 };
  const SQFT_TO_SQM = 0.092903;
  const SQFT_TO_SQYD = 1 / 9;

  function calculate() {
    const baseArea = (parseFloat(el('roofing-area').value) || 0) * TO_SQFT[el('roofing-area-unit').value];
    const pitch = parseFloat(el('roofing-pitch').value);
    const price = parseFloat(el('roofing-price').value) || 0;
    const resultEl = el('roofing-result');

    const multiplier = Math.sqrt(Math.pow(pitch / 12, 2) + 1);
    const roofArea = baseArea * multiplier;
    const squares = Math.ceil((roofArea * 1.1) / 100);
    const cost = roofArea * price;

    resultEl.innerHTML = `
      <div class="summary-payment-box">
        <div class="label">Estimated Roof Area</div>
        <div class="value">${fmt(roofArea)} sq ft</div>
      </div>
      <div class="stat-row"><span>Or</span><strong>${fmt(roofArea * SQFT_TO_SQM)} sq meters</strong></div>
      <div class="stat-row"><span>Or</span><strong>${fmt(roofArea * SQFT_TO_SQYD)} sq yards</strong></div>
      <div class="stat-row"><span>Roof squares (with 10% buffer)</span><strong>${squares}</strong></div>
      ${price > 0 ? `<div class="stat-row"><span>Estimated price</span><strong>${money(cost)}</strong></div>` : ''}
    `;
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  form.querySelectorAll('input, select').forEach((i) => i.addEventListener('change', calculate));
  calculate();
})();
