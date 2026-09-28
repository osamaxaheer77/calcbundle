'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('bac-form');
  if (!form) return;

  const GRAMS_PER_STANDARD_DRINK = 14;
  const ELIMINATION_RATE = 0.015;

  function calculate() {
    const gender = form.querySelector('input[name="bac-gender"]:checked').value;
    const weightVal = parseFloat(el('bac-weight').value);
    const weightUnit = el('bac-weight-unit').value;
    const drinks = parseFloat(el('bac-drinks').value);
    const hours = parseFloat(el('bac-hours').value) || 0;
    const resultEl = el('bac-result');

    if (!weightVal || weightVal <= 0 || isNaN(drinks) || drinks < 0) {
      resultEl.innerHTML = '<p class="tool-result is-error">Enter a valid body weight and number of drinks.</p>';
      return;
    }

    let weightKg;
    if (weightUnit === 'pound') weightKg = weightVal * 0.45359237;
    else weightKg = weightVal;
    const weightG = weightKg * 1000;

    const r = gender === 'm' ? 0.68 : 0.55;
    const alcoholG = drinks * GRAMS_PER_STANDARD_DRINK;

    const rawBac = (alcoholG / (weightG * r)) * 100;
    const bac = Math.max(0, rawBac - ELIMINATION_RATE * hours);
    const hoursToZero = Math.max(0, rawBac / ELIMINATION_RATE - hours);

    let statusMsg;
    if (bac === 0) statusMsg = 'No measurable impairment estimated.';
    else if (bac < 0.03) statusMsg = 'Mild impairment possible.';
    else if (bac < 0.08) statusMsg = 'Noticeable impairment likely &mdash; do not drive.';
    else if (bac < 0.15) statusMsg = 'Significant impairment &mdash; above the US legal driving limit.';
    else statusMsg = 'Severe impairment &mdash; risk of serious harm.';

    resultEl.innerHTML = `
      <div class="summary-payment-box">
        <div class="label">Estimated BAC</div>
        <div class="value">${bac.toFixed(3)}%</div>
      </div>
      <div class="stat-row"><span>Time to reach 0.00%</span><strong>${hoursToZero < 0.05 ? 'Already at 0%' : hoursToZero.toFixed(1) + ' hours'}</strong></div>
      <div class="stat-row"><span></span><strong>${statusMsg}</strong></div>
    `;
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  form.querySelectorAll('input, select').forEach((i) => i.addEventListener('input', calculate));
  calculate();
})();
