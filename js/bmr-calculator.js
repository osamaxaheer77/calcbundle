'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('bmr-form');
  if (!form) return;

  function num(id, fallback = 0) {
    const field = el(id);
    if (!field) return fallback;
    const v = parseFloat(field.value);
    return Number.isFinite(v) ? v : fallback;
  }

  function bmr(formula, gender, weightKg, heightCm, age, bodyFatPct) {
    if (formula === 'k') return 370 + 21.6 * (1 - bodyFatPct / 100) * weightKg;
    if (formula === 'h') {
      return gender === 'm'
        ? 13.397 * weightKg + 4.799 * heightCm - 5.677 * age + 88.362
        : 9.247 * weightKg + 3.098 * heightCm - 4.330 * age + 447.593;
    }
    return gender === 'm'
      ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  }

  const ACTIVITIES = [
    { label: 'Sedentary: little or no exercise', mult: 1.2 },
    { label: 'Exercise 1-3 times/week', mult: 1.375 },
    { label: 'Exercise 4-5 times/week', mult: 1.465 },
    { label: 'Daily exercise or intense exercise 3-4 times/week', mult: 1.55 },
    { label: 'Intense exercise 6-7 times/week', mult: 1.725 },
    { label: 'Very intense exercise daily, or physical job', mult: 1.9 },
  ];

  function calculate() {
    const unit = form.querySelector('input[name="bmr-unit"]:checked').value;
    const gender = form.querySelector('input[name="bmr-gender"]:checked').value;
    const age = num('bmr-age', 25);
    const formula = form.querySelector('input[name="bmr-formula"]:checked').value;
    const bodyFatPct = num('bmr-bodyfat', 20);

    let weightKg, heightCm;
    if (unit === 'us') {
      const ft = num('bmr-ft', 0);
      const inch = num('bmr-in', 0);
      const lbs = num('bmr-lbs', 0);
      heightCm = (ft * 12 + inch) * 2.54;
      weightKg = lbs * 0.45359237;
    } else {
      heightCm = num('bmr-cm', 0);
      weightKg = num('bmr-kg', 0);
    }

    if (heightCm <= 0 || weightKg <= 0) {
      el('bmr-result').innerHTML = '<p class="tool-result is-error">Enter a valid height and weight.</p>';
      return;
    }

    const bmrValue = bmr(formula, gender, weightKg, heightCm, age, bodyFatPct);

    const rows = ACTIVITIES.map((a) => `<div class="stat-row"><span>${a.label}</span><strong>${Math.round(bmrValue * a.mult).toLocaleString('en-US')} cal/day</strong></div>`).join('');

    el('bmr-result').innerHTML = `
      <div class="summary-payment-box">
        <div class="label">Basal Metabolic Rate (BMR)</div>
        <div class="value">${Math.round(bmrValue).toLocaleString('en-US')} cal/day</div>
      </div>
      <div class="subsection-title">Daily Calorie Needs by Activity Level</div>
      ${rows}
    `;
  }

  function updateVisibility() {
    const unit = form.querySelector('input[name="bmr-unit"]:checked').value;
    el('bmr-us-fields').hidden = unit !== 'us';
    el('bmr-metric-fields').hidden = unit !== 'metric';
    const formula = form.querySelector('input[name="bmr-formula"]:checked').value;
    el('bmr-bodyfat-field').hidden = formula !== 'k';
  }

  form.querySelectorAll('input[name="bmr-unit"]').forEach((r) => r.addEventListener('change', () => { updateVisibility(); calculate(); }));
  form.querySelectorAll('input[name="bmr-formula"]').forEach((r) => r.addEventListener('change', () => { updateVisibility(); calculate(); }));
  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });

  updateVisibility();
  calculate();
})();
