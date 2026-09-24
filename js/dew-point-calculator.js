'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('dewpoint-form');
  if (!form) return;

  const TEMP_TO_C = {
    celsius: (t) => t,
    fahrenheit: (t) => (t - 32) * 5 / 9,
    kelvin: (t) => t - 273.15
  };

  const B = 17.625, C = 243.04;

  function calculate() {
    const tempRaw = parseFloat(el('dewpoint-temp').value);
    const tempC = TEMP_TO_C[el('dewpoint-temp-unit').value](tempRaw);
    const rh = parseFloat(el('dewpoint-humidity').value);
    const resultEl = el('dewpoint-result');

    if (isNaN(tempRaw) || isNaN(rh) || rh <= 0 || rh > 100) {
      resultEl.innerHTML = '<p class="tool-result is-error">Enter a temperature and a relative humidity greater than 0 and up to 100%.</p>';
      return;
    }

    const gamma = Math.log(rh / 100) + (B * tempC) / (C + tempC);
    const dewC = (C * gamma) / (B - gamma);
    const dewF = dewC * 9 / 5 + 32;
    const dewK = dewC + 273.15;

    resultEl.innerHTML = `
      <div class="summary-payment-box">
        <div class="label">Dew Point</div>
        <div class="value">${dewF.toFixed(1)}&deg;F</div>
      </div>
      <div class="stat-row"><span>Or</span><strong>${dewC.toFixed(1)}&deg;C</strong></div>
      <div class="stat-row"><span>Or</span><strong>${dewK.toFixed(1)} K</strong></div>
    `;
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  form.querySelectorAll('input, select').forEach((i) => i.addEventListener('input', calculate));
  calculate();
})();
