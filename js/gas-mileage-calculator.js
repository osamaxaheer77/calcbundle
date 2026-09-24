'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('mpg-form');
  if (!form) return;

  const money = (n) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  const fmt = (n) => n.toLocaleString('en-US', { maximumFractionDigits: 2 });

  function calculate() {
    const current = parseFloat(el('mpg-current').value);
    const previous = parseFloat(el('mpg-previous').value);
    const gallons = parseFloat(el('mpg-gallons').value);
    const price = parseFloat(el('mpg-price').value);
    const resultEl = el('mpg-result');

    if (isNaN(current) || isNaN(previous) || isNaN(gallons) || gallons <= 0 || current <= previous) {
      resultEl.innerHTML = '<p class="tool-result is-error">Enter a current odometer reading greater than the previous one, and gas added greater than 0.</p>';
      return;
    }

    const miles = current - previous;
    const mpg = miles / gallons;
    const lPer100km = 235.215 / mpg;
    const kmPerL = mpg * 1.609344 / 3.785412;

    let costHtml = '';
    if (!isNaN(price) && price > 0) {
      const fillCost = price * gallons;
      const costPerMile = price / mpg;
      costHtml = `
        <div class="stat-row"><span>Cost of This Fill-Up</span><strong>${money(fillCost)}</strong></div>
        <div class="stat-row"><span>Cost Per Mile</span><strong>${money(costPerMile)}</strong></div>
      `;
    }

    resultEl.innerHTML = `
      <div class="summary-payment-box">
        <div class="label">Gas Mileage</div>
        <div class="value">${fmt(mpg)} mpg</div>
      </div>
      <div class="stat-row"><span>Or</span><strong>${fmt(lPer100km)} L/100km</strong></div>
      <div class="stat-row"><span>Or</span><strong>${fmt(kmPerL)} km/L</strong></div>
      <div class="stat-row"><span>Distance Traveled</span><strong>${fmt(miles)} miles</strong></div>
      ${costHtml}
    `;
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  form.querySelectorAll('input').forEach((i) => i.addEventListener('input', calculate));
  calculate();
})();
