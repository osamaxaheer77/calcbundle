'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('fuelcost-form');
  if (!form) return;

  const KM_PER_MILE = 1.609344;
  const LITER_PER_GALLON = 3.785412;
  const money = (n) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  const fmt = (n) => n.toLocaleString('en-US', { maximumFractionDigits: 2 });

  function calculate() {
    const distance = parseFloat(el('fuelcost-distance').value);
    const distanceUnit = el('fuelcost-distance-unit').value;
    const efficiency = parseFloat(el('fuelcost-efficiency').value);
    const efficiencyUnit = el('fuelcost-efficiency-unit').value;
    const price = parseFloat(el('fuelcost-price').value);
    const priceUnit = el('fuelcost-price-unit').value;
    const resultEl = el('fuelcost-result');

    if ([distance, efficiency, price].some((v) => isNaN(v) || v <= 0)) {
      resultEl.innerHTML = '<p class="tool-result is-error">Enter positive values for distance, fuel efficiency, and gas price.</p>';
      return;
    }

    const miles = distanceUnit === 'miles' ? distance : distance / KM_PER_MILE;
    const km = distanceUnit === 'km' ? distance : distance * KM_PER_MILE;

    let gallons;
    if (efficiencyUnit === 'mpg') {
      gallons = miles / efficiency;
    } else {
      const liters = (km / 100) * efficiency;
      gallons = liters / LITER_PER_GALLON;
    }
    const liters = gallons * LITER_PER_GALLON;

    const fuelAmount = priceUnit === 'gallon' ? gallons : liters;
    const fuelLabel = priceUnit === 'gallon' ? 'gallons' : 'liters';
    const cost = fuelAmount * price;

    resultEl.innerHTML = `
      <div class="summary-payment-box">
        <div class="label">Fuel Cost</div>
        <div class="value">${money(cost)}</div>
      </div>
      <div class="stat-row"><span>Fuel Needed</span><strong>${fmt(fuelAmount)} ${fuelLabel}</strong></div>
      <div class="stat-row"><span>Or</span><strong>${fmt(gallons)} gallons / ${fmt(liters)} liters</strong></div>
    `;
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  form.querySelectorAll('input, select').forEach((i) => i.addEventListener('input', calculate));
  calculate();
})();
