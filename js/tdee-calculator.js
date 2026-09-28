'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('tdee-form');
  if (!form) return;

  function num(id, fallback = 0) {
    const field = el(id);
    if (!field) return fallback;
    const v = parseFloat(field.value);
    return Number.isFinite(v) ? v : fallback;
  }

  function bmrMifflin(gender, weightKg, heightCm, age) {
    return gender === 'm'
      ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  }

  function bmiCategory(bmi) {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  }

  function calculate() {
    const unit = form.querySelector('input[name="tdee-unit"]:checked').value;
    const gender = form.querySelector('input[name="tdee-gender"]:checked').value;
    const age = num('tdee-age', 25);
    const activity = parseFloat(el('tdee-activity').value);

    let weightKg, heightCm;
    if (unit === 'us') {
      const ft = num('tdee-ft', 0);
      const inch = num('tdee-in', 0);
      const lbs = num('tdee-lbs', 0);
      heightCm = (ft * 12 + inch) * 2.54;
      weightKg = lbs * 0.45359237;
    } else {
      heightCm = num('tdee-cm', 0);
      weightKg = num('tdee-kg', 0);
    }

    if (heightCm <= 0 || weightKg <= 0) {
      el('tdee-result').innerHTML = '<p class="tool-result is-error">Enter a valid height and weight.</p>';
      return;
    }

    const bmrValue = bmrMifflin(gender, weightKg, heightCm, age);
    const tdee = bmrValue * activity;
    const bmi = weightKg / Math.pow(heightCm / 100, 2);

    const rows = [
      { label: 'Extreme weight gain', sub: '2 lb/week', delta: 1000 },
      { label: 'Weight gain', sub: '1 lb/week', delta: 500 },
      { label: 'Mild weight gain', sub: '0.5 lb/week', delta: 250 },
      { label: 'Mild weight loss', sub: '0.5 lb/week', delta: -250 },
      { label: 'Weight loss', sub: '1 lb/week', delta: -500 },
      { label: 'Extreme weight loss', sub: '2 lb/week', delta: -1000 },
    ];

    const rowsHtml = rows.map((r) => {
      const cal = Math.round(tdee + r.delta);
      const pct = Math.round((cal / tdee) * 100);
      return `<div class="stat-row"><span>${r.label} <span style="color:var(--text-muted);font-weight:400;">(${r.sub})</span></span><strong>${cal.toLocaleString('en-US')} cal/day <span style="color:var(--text-muted);font-weight:400;">(${pct}%)</span></strong></div>`;
    }).join('');

    el('tdee-result').innerHTML = `
      <div class="summary-payment-box">
        <div class="label">Total Daily Energy Expenditure (TDEE)</div>
        <div class="value">${Math.round(tdee).toLocaleString('en-US')} cal/day</div>
      </div>
      <div class="stat-row"><span>BMI</span><strong>${bmi.toFixed(1)} kg/m&sup2; (${bmiCategory(bmi)})</strong></div>
      <div class="stat-row" style="margin-bottom:12px;"><span>Basal Metabolic Rate (BMR)</span><strong>${Math.round(bmrValue).toLocaleString('en-US')} cal/day</strong></div>
      ${rowsHtml}
    `;
  }

  function updateVisibility() {
    const unit = form.querySelector('input[name="tdee-unit"]:checked').value;
    el('tdee-us-fields').hidden = unit !== 'us';
    el('tdee-metric-fields').hidden = unit !== 'metric';
  }

  form.querySelectorAll('input[name="tdee-unit"]').forEach((r) => r.addEventListener('change', () => { updateVisibility(); calculate(); }));
  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  form.querySelectorAll('input, select').forEach((i) => i.addEventListener('input', calculate));

  updateVisibility();
  calculate();
})();
