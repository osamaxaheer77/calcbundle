'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('mulch-form');
  if (!form) return;

  const fmt = (n) => n.toLocaleString('en-US', { maximumFractionDigits: 2 });
  const money = (n) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  const AREA_TO_SQFT = { foot: 1, meter: 10.7639, yard: 9, acre: 43560 };
  const DEPTH_TO_FEET = { inch: 1 / 12, foot: 1, cm: 0.0328084, meter: 3.28084, yard: 3 };
  const CUFT_TO_CUYD = 1 / 27;
  const CUFT_TO_CUM = 0.0283168;
  const CUFT_TO_LITER = 28.3168;

  function calculate() {
    const areaSqft = (parseFloat(el('mulch-area').value) || 0) * AREA_TO_SQFT[el('mulch-area-unit').value];
    const depthFt = (parseFloat(el('mulch-depth').value) || 0) * DEPTH_TO_FEET[el('mulch-depth-unit').value];
    const price = parseFloat(el('mulch-price').value) || 0;
    const priceUnit = el('mulch-price-unit').value;
    const resultEl = el('mulch-result');

    const volumeCuFt = areaSqft * depthFt;
    const cuYd = volumeCuFt * CUFT_TO_CUYD;
    const cuM = volumeCuFt * CUFT_TO_CUM;
    const liters = volumeCuFt * CUFT_TO_LITER;
    const cost = priceUnit === 'yard' ? cuYd * price : volumeCuFt * price;

    resultEl.innerHTML = `
      <div class="summary-payment-box">
        <div class="label">Mulch Needed</div>
        <div class="value">${fmt(volumeCuFt)} cubic feet</div>
      </div>
      <div class="stat-row"><span>Or</span><strong>${fmt(cuYd)} cubic yards</strong></div>
      <div class="stat-row"><span>Or</span><strong>${fmt(cuM)} cubic meters</strong></div>
      <div class="stat-row"><span>Or</span><strong>${fmt(liters)} liters</strong></div>
      ${price > 0 ? `<div class="stat-row"><span>Estimated cost</span><strong>${money(cost)}</strong></div>` : ''}
    `;
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  form.querySelectorAll('input, select').forEach((i) => i.addEventListener('change', calculate));
  calculate();
})();
