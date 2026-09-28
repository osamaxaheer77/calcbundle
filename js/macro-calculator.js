'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('macro-form');
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

  const DIET_SPLITS = {
    balanced: { label: 'Balanced', protein: 0.30, carb: 0.40, fat: 0.30 },
    lowfat: { label: 'Low Fat', protein: 0.30, carb: 0.55, fat: 0.15 },
    lowcarb: { label: 'Low Carb', protein: 0.40, carb: 0.20, fat: 0.40 },
    highprotein: { label: 'High Protein', protein: 0.40, carb: 0.30, fat: 0.30 },
  };

  function calculate() {
    const unit = form.querySelector('input[name="macro-unit"]:checked').value;
    const gender = form.querySelector('input[name="macro-gender"]:checked').value;
    const age = num('macro-age', 25);
    const activity = parseFloat(el('macro-activity').value);
    const goalDelta = parseFloat(el('macro-goal').value);
    const diet = el('macro-diet').value;

    let weightKg, heightCm;
    if (unit === 'us') {
      const ft = num('macro-ft', 0);
      const inch = num('macro-in', 0);
      const lbs = num('macro-lbs', 0);
      heightCm = (ft * 12 + inch) * 2.54;
      weightKg = lbs * 0.45359237;
    } else {
      heightCm = num('macro-cm', 0);
      weightKg = num('macro-kg', 0);
    }

    if (heightCm <= 0 || weightKg <= 0) {
      el('macro-result').innerHTML = '<p class="tool-result is-error">Enter a valid height and weight.</p>';
      return;
    }

    const bmrValue = bmrMifflin(gender, weightKg, heightCm, age);
    const tdee = bmrValue * activity;
    const targetCalories = tdee + goalDelta;

    const split = DIET_SPLITS[diet];
    const proteinG = (targetCalories * split.protein) / 4;
    const carbG = (targetCalories * split.carb) / 4;
    const fatG = (targetCalories * split.fat) / 9;

    const fmt = (n) => Math.round(n).toLocaleString('en-US');

    el('macro-result').innerHTML = `
      <div class="summary-payment-box">
        <div class="label">Daily Calories (${split.label})</div>
        <div class="value">${fmt(targetCalories)} cal/day</div>
      </div>
      <div class="stat-row"><span>Protein (${Math.round(split.protein * 100)}%)</span><strong>${fmt(proteinG)} g</strong></div>
      <div class="stat-row"><span>Carbs (${Math.round(split.carb * 100)}%)</span><strong>${fmt(carbG)} g</strong></div>
      <div class="stat-row"><span>Fat (${Math.round(split.fat * 100)}%)</span><strong>${fmt(fatG)} g</strong></div>
    `;
  }

  function updateVisibility() {
    const unit = form.querySelector('input[name="macro-unit"]:checked').value;
    el('macro-us-fields').hidden = unit !== 'us';
    el('macro-metric-fields').hidden = unit !== 'metric';
  }

  form.querySelectorAll('input[name="macro-unit"]').forEach((r) => r.addEventListener('change', () => { updateVisibility(); calculate(); }));
  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  form.querySelectorAll('input, select').forEach((i) => i.addEventListener('input', calculate));

  updateVisibility();
  calculate();
})();
