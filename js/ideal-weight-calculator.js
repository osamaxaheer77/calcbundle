'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('iw-form');
  if (!form) return;

  const KG_TO_LBS = 1 / 0.45359237;

  function num(id, fallback = 0) {
    const field = el(id);
    if (!field) return fallback;
    const v = parseFloat(field.value);
    return Number.isFinite(v) ? v : fallback;
  }

  function calculate() {
    const unit = form.querySelector('input[name="iw-unit"]:checked').value;
    const gender = form.querySelector('input[name="iw-gender"]:checked').value;

    let heightIn;
    if (unit === 'us') {
      heightIn = num('iw-ft', 0) * 12 + num('iw-in', 0);
    } else {
      heightIn = num('iw-cm', 0) / 2.54;
    }

    if (heightIn <= 60) {
      el('iw-result').innerHTML = '<p class="tool-result is-error">Enter a height of at least 5 feet (these formulas only apply from 5 ft up).</p>';
      return;
    }

    const inchesOver5ft = heightIn - 60;
    const formulas = gender === 'm'
      ? [
        { name: 'Robinson (1983)', base: 52, perInch: 1.9 },
        { name: 'Miller (1983)', base: 56.2, perInch: 1.41 },
        { name: 'Devine (1974)', base: 50, perInch: 2.3 },
        { name: 'Hamwi (1964)', base: 48, perInch: 2.7 },
      ]
      : [
        { name: 'Robinson (1983)', base: 49, perInch: 1.7 },
        { name: 'Miller (1983)', base: 53.1, perInch: 1.36 },
        { name: 'Devine (1974)', base: 45.5, perInch: 2.3 },
        { name: 'Hamwi (1964)', base: 45.5, perInch: 2.2 },
      ];

    const unitLabel = unit === 'us' ? 'lbs' : 'kg';
    const toDisplay = (kg) => unit === 'us' ? (kg * KG_TO_LBS).toFixed(1) : kg.toFixed(1);

    const rows = formulas.map((f) => {
      const kg = f.base + f.perInch * inchesOver5ft;
      return `<div class="stat-row"><span>${f.name}</span><strong>${toDisplay(kg)} ${unitLabel}</strong></div>`;
    }).join('');

    const heightM = heightIn * 0.0254;
    let bmiRangeDisplay;
    if (unit === 'us') {
      const lowLbs = 18.5 * heightIn * heightIn / 703;
      const highLbs = 25 * heightIn * heightIn / 703;
      bmiRangeDisplay = `${lowLbs.toFixed(1)} - ${highLbs.toFixed(1)} lbs`;
    } else {
      const lowKg = 18.5 * heightM * heightM;
      const highKg = 25 * heightM * heightM;
      bmiRangeDisplay = `${lowKg.toFixed(1)} - ${highKg.toFixed(1)} kg`;
    }

    const robinsonKg = formulas[0].base + formulas[0].perInch * inchesOver5ft;

    el('iw-result').innerHTML = `
      <div class="summary-payment-box">
        <div class="label">Ideal Weight (Robinson formula)</div>
        <div class="value">${toDisplay(robinsonKg)} ${unitLabel}</div>
      </div>
      ${rows}
      <div class="stat-row" style="margin-top:8px;"><span>Healthy BMI Range</span><strong>${bmiRangeDisplay}</strong></div>
    `;
  }

  function updateVisibility() {
    const unit = form.querySelector('input[name="iw-unit"]:checked').value;
    el('iw-us-fields').hidden = unit !== 'us';
    el('iw-metric-fields').hidden = unit !== 'metric';
  }

  form.querySelectorAll('input[name="iw-unit"]').forEach((r) => r.addEventListener('change', () => { updateVisibility(); calculate(); }));
  form.querySelectorAll('input[name="iw-gender"]').forEach((r) => r.addEventListener('change', calculate));
  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });

  updateVisibility();
  calculate();
})();
