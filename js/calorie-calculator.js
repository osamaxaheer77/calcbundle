'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('calorie-form');
  if (!form) return;

  function num(id, fallback = 0) {
    const field = el(id);
    if (!field) return fallback;
    const v = parseFloat(field.value);
    return Number.isFinite(v) ? v : fallback;
  }

  function bmr(formula, gender, weightKg, heightCm, age, bodyFatPct) {
    if (formula === 'k') {
      return 370 + 21.6 * (1 - bodyFatPct / 100) * weightKg;
    }
    if (formula === 'h') {
      return gender === 'm'
        ? 13.397 * weightKg + 4.799 * heightCm - 5.677 * age + 88.362
        : 9.247 * weightKg + 3.098 * heightCm - 4.330 * age + 447.593;
    }
    // Mifflin-St Jeor
    return gender === 'm'
      ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  }

  function calculate() {
    const unit = form.querySelector('input[name="calorie-unit"]:checked').value;
    const gender = form.querySelector('input[name="calorie-gender"]:checked').value;
    const age = num('calorie-age', 25);
    const activity = parseFloat(el('calorie-activity').value);
    const formula = form.querySelector('input[name="calorie-formula"]:checked').value;
    const bodyFatPct = num('calorie-bodyfat', 20);

    let weightKg, heightCm;
    if (unit === 'us') {
      const ft = num('calorie-ft', 0);
      const inch = num('calorie-in', 0);
      const lbs = num('calorie-lbs', 0);
      heightCm = (ft * 12 + inch) * 2.54;
      weightKg = lbs * 0.45359237;
    } else {
      heightCm = num('calorie-cm', 0);
      weightKg = num('calorie-kg', 0);
    }

    if (heightCm <= 0 || weightKg <= 0) {
      el('calorie-result').innerHTML = '<p class="tool-result is-error">Enter a valid height and weight.</p>';
      return;
    }

    const bmrValue = bmr(formula, gender, weightKg, heightCm, age, bodyFatPct);
    const maintain = bmrValue * activity;

    const rows = [
      { label: 'Extreme weight gain', sub: '2 lb/week', delta: 1000 },
      { label: 'Weight gain', sub: '1 lb/week', delta: 500 },
      { label: 'Mild weight gain', sub: '0.5 lb/week', delta: 250 },
      { label: 'Maintain weight', sub: '', delta: 0 },
      { label: 'Mild weight loss', sub: '0.5 lb/week', delta: -250 },
      { label: 'Weight loss', sub: '1 lb/week', delta: -500 },
      { label: 'Extreme weight loss', sub: '2 lb/week', delta: -1000 },
    ];

    const rowsHtml = rows.map((r) => {
      const cal = Math.round(maintain + r.delta);
      const pct = Math.round((cal / maintain) * 100);
      const isMaintain = r.delta === 0;
      return `<div class="stat-row"${isMaintain ? ' style="font-weight:700;"' : ''}><span>${r.label}${r.sub ? ` <span style="color:var(--text-muted);font-weight:400;">(${r.sub})</span>` : ''}</span><strong>${cal.toLocaleString('en-US')} cal/day <span style="color:var(--text-muted);font-weight:400;">(${pct}%)</span></strong></div>`;
    }).join('');

    el('calorie-result').innerHTML = `
      <div class="summary-payment-box">
        <div class="label">Maintenance Calories</div>
        <div class="value">${Math.round(maintain).toLocaleString('en-US')} cal/day</div>
      </div>
      ${rowsHtml}
      <div class="stat-row" style="margin-top:8px;"><span>Basal Metabolic Rate (BMR)</span><strong>${Math.round(bmrValue).toLocaleString('en-US')} cal/day</strong></div>
    `;
  }

  function updateVisibility() {
    const unit = form.querySelector('input[name="calorie-unit"]:checked').value;
    el('calorie-us-fields').hidden = unit !== 'us';
    el('calorie-metric-fields').hidden = unit !== 'metric';
    const formula = form.querySelector('input[name="calorie-formula"]:checked').value;
    el('calorie-bodyfat-field').hidden = formula !== 'k';
  }

  form.querySelectorAll('input[name="calorie-unit"]').forEach((r) => r.addEventListener('change', () => { updateVisibility(); calculate(); }));
  form.querySelectorAll('input[name="calorie-formula"]').forEach((r) => r.addEventListener('change', () => { updateVisibility(); calculate(); }));
  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });

  updateVisibility();
  calculate();
})();
