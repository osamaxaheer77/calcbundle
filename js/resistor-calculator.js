'use strict';

(function () {
  const el = (id) => document.getElementById(id);

  const DIGIT_COLORS = ['black', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'grey', 'white'];
  const DIGIT_VALUES = { black: 0, brown: 1, red: 2, orange: 3, yellow: 4, green: 5, blue: 6, violet: 7, grey: 8, white: 9 };
  const MULTIPLIER_VALUES = {
    black: 1, brown: 10, red: 100, orange: 1000, yellow: 10000, green: 100000,
    blue: 1000000, violet: 10000000, grey: 100000000, white: 1000000000, gold: 0.1, silver: 0.01
  };
  const TOLERANCE_VALUES = {
    brown: 1, red: 2, green: 0.5, blue: 0.25, violet: 0.1, grey: 0.05, gold: 5, silver: 10
  };
  const CAP = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  function populateSelect(select, colors, labelFn) {
    select.innerHTML = '';
    colors.forEach((c) => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = labelFn ? labelFn(c) : CAP(c);
      select.appendChild(opt);
    });
  }

  const fmtOhms = (n) => {
    if (n >= 1000000) return (n / 1000000).toLocaleString('en-US', { maximumFractionDigits: 3 }) + ' MΩ';
    if (n >= 1000) return (n / 1000).toLocaleString('en-US', { maximumFractionDigits: 3 }) + ' kΩ';
    return n.toLocaleString('en-US', { maximumFractionDigits: 3 }) + ' Ω';
  };

  const colorForm = el('resistor-color-form');
  if (colorForm) {
    const multiplierColors = [...DIGIT_COLORS, 'gold', 'silver'];
    const toleranceColors = ['brown', 'red', 'green', 'blue', 'violet', 'grey', 'gold', 'silver'];

    populateSelect(el('resistor-band1'), DIGIT_COLORS);
    populateSelect(el('resistor-band2'), DIGIT_COLORS);
    populateSelect(el('resistor-band3'), DIGIT_COLORS);
    populateSelect(el('resistor-multiplier'), multiplierColors);
    populateSelect(el('resistor-tolerance'), toleranceColors, (c) => `${CAP(c)} (±${TOLERANCE_VALUES[c]}%)`);

    el('resistor-band1').value = 'brown';
    el('resistor-band2').value = 'black';
    el('resistor-band3').value = 'black';
    el('resistor-multiplier').value = 'red';
    el('resistor-tolerance').value = 'gold';

    function refreshBandCount() {
      const bands = el('resistor-band-count').value;
      el('resistor-band3-row').style.display = bands === '5' ? '' : 'none';
    }

    function calcColor() {
      const bands = el('resistor-band-count').value;
      const d1 = DIGIT_VALUES[el('resistor-band1').value];
      const d2 = DIGIT_VALUES[el('resistor-band2').value];
      const d3 = DIGIT_VALUES[el('resistor-band3').value];
      const mult = MULTIPLIER_VALUES[el('resistor-multiplier').value];
      const tolerance = TOLERANCE_VALUES[el('resistor-tolerance').value];
      const resultEl = el('resistor-color-result');

      const digits = bands === '5' ? d1 * 100 + d2 * 10 + d3 : d1 * 10 + d2;
      const ohms = digits * mult;

      resultEl.innerHTML = `
        <div class="summary-payment-box">
          <div class="label">Resistance</div>
          <div class="value">${fmtOhms(ohms)} &plusmn;${tolerance}%</div>
        </div>
        <div class="stat-row"><span>Range</span><strong>${fmtOhms(ohms * (1 - tolerance / 100))} &ndash; ${fmtOhms(ohms * (1 + tolerance / 100))}</strong></div>
      `;
    }

    el('resistor-band-count').addEventListener('change', () => { refreshBandCount(); calcColor(); });
    colorForm.addEventListener('submit', (e) => { e.preventDefault(); calcColor(); });
    colorForm.querySelectorAll('select').forEach((s) => s.addEventListener('change', calcColor));

    refreshBandCount();
    calcColor();
  }

  const parallelForm = el('resistor-parallel-form');
  if (parallelForm) {
    function calcParallel() {
      const values = el('resistor-parallel-input').value.split(',').map((s) => parseFloat(s.trim())).filter((n) => !isNaN(n) && n > 0);
      const resultEl = el('resistor-parallel-result');
      if (values.length < 2) {
        resultEl.innerHTML = '<p class="tool-result is-error">Enter at least two resistance values, separated by commas.</p>';
        return;
      }
      const reciprocalSum = values.reduce((sum, v) => sum + 1 / v, 0);
      const total = 1 / reciprocalSum;
      resultEl.innerHTML = `
        <div class="summary-payment-box">
          <div class="label">Total Resistance</div>
          <div class="value">${fmtOhms(total)}</div>
        </div>
      `;
    }
    parallelForm.addEventListener('submit', (e) => { e.preventDefault(); calcParallel(); });
    el('resistor-parallel-input').addEventListener('input', calcParallel);
    calcParallel();
  }

  const seriesForm = el('resistor-series-form');
  if (seriesForm) {
    function calcSeries() {
      const values = el('resistor-series-input').value.split(',').map((s) => parseFloat(s.trim())).filter((n) => !isNaN(n) && n > 0);
      const resultEl = el('resistor-series-result');
      if (values.length < 2) {
        resultEl.innerHTML = '<p class="tool-result is-error">Enter at least two resistance values, separated by commas.</p>';
        return;
      }
      const total = values.reduce((sum, v) => sum + v, 0);
      resultEl.innerHTML = `
        <div class="summary-payment-box">
          <div class="label">Total Resistance</div>
          <div class="value">${fmtOhms(total)}</div>
        </div>
      `;
    }
    seriesForm.addEventListener('submit', (e) => { e.preventDefault(); calcSeries(); });
    el('resistor-series-input').addEventListener('input', calcSeries);
    calcSeries();
  }
})();
