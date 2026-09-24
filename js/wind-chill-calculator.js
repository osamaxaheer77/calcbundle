'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('windchill-form');
  if (!form) return;

  const SPEED_TO_MPH = { mph: 1, kmh: 0.621371, ms: 2.23694, knot: 1.15078 };
  const TEMP_TO_F = {
    fahrenheit: (t) => t,
    celsius: (t) => t * 9 / 5 + 32,
    kelvin: (t) => (t - 273.15) * 9 / 5 + 32
  };

  function calculate() {
    const speedVal = parseFloat(el('windchill-speed').value);
    const speedMph = speedVal * SPEED_TO_MPH[el('windchill-speed-unit').value];
    const tempRaw = parseFloat(el('windchill-temp').value);
    const tempF = TEMP_TO_F[el('windchill-temp-unit').value](tempRaw);
    const resultEl = el('windchill-result');

    if (isNaN(speedVal) || isNaN(tempRaw)) {
      resultEl.innerHTML = '<p class="tool-result is-error">Enter both wind speed and air temperature.</p>';
      return;
    }
    if (speedMph < 3 || tempF > 50) {
      resultEl.innerHTML = '<p class="tool-result is-error">The wind chill formula is only valid for wind speeds of 3+ mph and air temperatures at or below 50&deg;F.</p>';
      return;
    }

    const v16 = Math.pow(speedMph, 0.16);
    const windChillF = 35.74 + 0.6215 * tempF - 35.75 * v16 + 0.4275 * tempF * v16;
    const windChillC = (windChillF - 32) * 5 / 9;
    const windChillK = windChillC + 273.15;

    let risk = '';
    if (windChillF <= -19) risk = 'Frostbite possible in as little as 30 minutes on exposed skin.';
    else if (windChillF <= 0) risk = 'Frostbite risk with extended exposure &mdash; cover exposed skin.';
    else risk = 'Low frostbite risk, but dress warmly for comfort.';

    resultEl.innerHTML = `
      <div class="summary-payment-box">
        <div class="label">Feels Like</div>
        <div class="value">${windChillF.toFixed(1)}&deg;F</div>
      </div>
      <div class="stat-row"><span>Or</span><strong>${windChillC.toFixed(1)}&deg;C</strong></div>
      <div class="stat-row"><span>Or</span><strong>${windChillK.toFixed(1)} K</strong></div>
      <div class="stat-row"><span></span><strong>${risk}</strong></div>
    `;
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  form.querySelectorAll('input, select').forEach((i) => i.addEventListener('input', calculate));
  calculate();
})();
