'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('heatindex-form');
  if (!form) return;

  const TEMP_TO_F = {
    fahrenheit: (t) => t,
    celsius: (t) => t * 9 / 5 + 32,
    kelvin: (t) => (t - 273.15) * 9 / 5 + 32
  };

  function rothfusz(T, RH) {
    return -42.379 + 2.04901523 * T + 10.14333127 * RH - 0.22475541 * T * RH
      - 0.00683783 * T * T - 0.05481717 * RH * RH + 0.00122874 * T * T * RH
      + 0.00085282 * T * RH * RH - 0.00000199 * T * T * RH * RH;
  }

  function heatIndexF(T, RH) {
    const simple = 0.5 * (T + 61 + (T - 68) * 1.2 + RH * 0.094);
    if ((simple + T) / 2 < 80) return simple;

    let hi = rothfusz(T, RH);

    if (RH < 13 && T >= 80 && T <= 112) {
      hi -= ((13 - RH) / 4) * Math.sqrt((17 - Math.abs(T - 95)) / 17);
    } else if (RH > 85 && T >= 80 && T <= 87) {
      hi += ((RH - 85) / 10) * ((87 - T) / 5);
    }
    return hi;
  }

  function riskLabel(hiF) {
    if (hiF < 80) return 'No significant risk from heat alone.';
    if (hiF < 90) return 'Caution: fatigue possible with prolonged exposure or activity.';
    if (hiF < 103) return 'Extreme caution: heat cramps and heat exhaustion are possible.';
    if (hiF < 125) return 'Danger: heat cramps and heat exhaustion likely; heat stroke possible.';
    return 'Extreme danger: heat stroke highly likely with continued exposure.';
  }

  function calculate() {
    const tempRaw = parseFloat(el('heatindex-temp').value);
    const tempF = TEMP_TO_F[el('heatindex-temp-unit').value](tempRaw);
    const rh = parseFloat(el('heatindex-humidity').value);
    const resultEl = el('heatindex-result');

    if (isNaN(tempRaw) || isNaN(rh) || rh < 0 || rh > 100) {
      resultEl.innerHTML = '<p class="tool-result is-error">Enter a temperature and a relative humidity between 0 and 100%.</p>';
      return;
    }

    const hiF = heatIndexF(tempF, rh);
    const hiC = (hiF - 32) * 5 / 9;
    const hiK = hiC + 273.15;

    resultEl.innerHTML = `
      <div class="summary-payment-box">
        <div class="label">Feels Like</div>
        <div class="value">${hiF.toFixed(1)}&deg;F</div>
      </div>
      <div class="stat-row"><span>Or</span><strong>${hiC.toFixed(1)}&deg;C</strong></div>
      <div class="stat-row"><span>Or</span><strong>${hiK.toFixed(1)} K</strong></div>
      <div class="stat-row"><span></span><strong>${riskLabel(hiF)}</strong></div>
    `;
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  form.querySelectorAll('input, select').forEach((i) => i.addEventListener('input', calculate));
  calculate();
})();
