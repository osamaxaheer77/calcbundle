'use strict';

(function () {
  const el = (id) => document.getElementById(id);

  const FORCE_TO_N = { newton: 1, kilonewton: 1000, poundforce: 4.448222, kilogramforce: 9.80665 };
  const DIST_TO_M = { meter: 1, kilometer: 1000, mile: 1609.344, yard: 0.9144 };
  const TIME_TO_S = { second: 1, minute: 60, hour: 3600, day: 86400 };

  const POWER_TO_WATT = {
    watt: 1, kilowatt: 1000, mechanical: 745.7, metric: 735.499,
    electrical: 746, boiler: 9809.5, btuh: 0.29307107
  };
  const POWER_LABELS = {
    watt: 'Watt', kilowatt: 'Kilowatt', mechanical: 'Mechanical Horsepower', metric: 'Metric Horsepower',
    electrical: 'Electrical Horsepower', boiler: 'Boiler Horsepower', btuh: 'BTU/h'
  };

  const fmt = (n) => n.toLocaleString('en-US', { maximumFractionDigits: 6 });

  const defForm = el('hp-definition-form');
  if (defForm) {
    function calcDef() {
      const force = parseFloat(el('hp-force').value) * FORCE_TO_N[el('hp-force-unit').value];
      const distance = parseFloat(el('hp-distance').value) * DIST_TO_M[el('hp-distance-unit').value];
      const time = parseFloat(el('hp-time').value) * TIME_TO_S[el('hp-time-unit').value];
      const resultEl = el('hp-definition-result');

      if (isNaN(force) || isNaN(distance) || isNaN(time) || time <= 0) {
        resultEl.innerHTML = '<p class="tool-result is-error">Enter force, distance, and a positive time.</p>';
        return;
      }

      const watts = (force * distance) / time;

      resultEl.innerHTML = `
        <div class="summary-payment-box">
          <div class="label">Power</div>
          <div class="value">${fmt(watts)} watts</div>
        </div>
        <div class="stat-row"><span>Mechanical Horsepower</span><strong>${fmt(watts / POWER_TO_WATT.mechanical)}</strong></div>
        <div class="stat-row"><span>Metric Horsepower</span><strong>${fmt(watts / POWER_TO_WATT.metric)}</strong></div>
        <div class="stat-row"><span>Kilowatts</span><strong>${fmt(watts / 1000)}</strong></div>
      `;
    }
    defForm.addEventListener('submit', (e) => { e.preventDefault(); calcDef(); });
    defForm.querySelectorAll('input, select').forEach((i) => i.addEventListener('input', calcDef));
    calcDef();
  }

  const convForm = el('hp-convert-form');
  if (convForm) {
    function calcConv() {
      const amount = parseFloat(el('hp-convert-amount').value);
      const fromUnit = el('hp-convert-from').value;
      const toUnit = el('hp-convert-to').value;
      const resultEl = el('hp-convert-result');

      if (isNaN(amount)) {
        resultEl.innerHTML = '<p class="tool-result is-error">Enter an amount to convert.</p>';
        return;
      }

      const watts = amount * POWER_TO_WATT[fromUnit];
      const result = watts / POWER_TO_WATT[toUnit];

      resultEl.innerHTML = `
        <div class="summary-payment-box">
          <div class="label">Result</div>
          <div class="value">${fmt(result)} ${POWER_LABELS[toUnit]}</div>
        </div>
        <div class="stat-row"><span>${amount} ${POWER_LABELS[fromUnit]}</span><strong>=</strong></div>
      `;
    }
    convForm.addEventListener('submit', (e) => { e.preventDefault(); calcConv(); });
    convForm.querySelectorAll('input, select').forEach((i) => i.addEventListener('input', calcConv));
    calcConv();
  }
})();
