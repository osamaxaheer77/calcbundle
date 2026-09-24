'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('bf-form');
  if (!form) return;

  function num(id, fallback = 0) {
    const field = el(id);
    if (!field) return fallback;
    const v = parseFloat(field.value);
    return Number.isFinite(v) ? v : fallback;
  }

  const IDEAL_BF = {
    m: [[20, 8.5], [25, 10.5], [30, 12.7], [35, 13.7], [40, 15.3], [45, 16.4], [50, 18.9], [55, 20.9]],
    f: [[20, 17.7], [25, 18.4], [30, 19.3], [35, 21.5], [40, 22.2], [45, 22.9], [50, 25.2], [55, 26.3]],
  };
  function idealBF(gender, age) {
    const table = IDEAL_BF[gender];
    let closest = table[0];
    for (const row of table) {
      if (Math.abs(row[0] - age) <= Math.abs(closest[0] - age)) closest = row;
    }
    return closest[1];
  }

  function category(gender, bf) {
    const t = gender === 'm'
      ? [[5, 'Essential Fat'], [13, 'Athletes'], [17, 'Fitness'], [24, 'Average'], [Infinity, 'Obese']]
      : [[13, 'Essential Fat'], [20, 'Athletes'], [24, 'Fitness'], [31, 'Average'], [Infinity, 'Obese']];
    for (const [max, label] of t) if (bf < max) return label;
    return 'Obese';
  }

  function calculate() {
    const unit = form.querySelector('input[name="bf-unit"]:checked').value;
    const gender = form.querySelector('input[name="bf-gender"]:checked').value;
    const age = num('bf-age', 25);

    let weightForMass, heightCm, neckCm, waistCm, hipCm;

    if (unit === 'us') {
      const heightIn = num('bf-ft', 0) * 12 + num('bf-in', 0);
      const neckIn = num('bf-neckft', 0) * 12 + num('bf-neckin', 0);
      const waistIn = num('bf-waistft', 0) * 12 + num('bf-waistin', 0);
      const hipIn = num('bf-hipft', 0) * 12 + num('bf-hipin', 0);
      const weightLbs = num('bf-weight', 0);
      weightForMass = weightLbs;

      if (heightIn <= 0 || neckIn <= 0 || waistIn <= 0 || weightLbs <= 0 || (gender === 'f' && hipIn <= 0)) {
        el('bf-result').innerHTML = '<p class="tool-result is-error">Enter valid measurements.</p>';
        return;
      }
      heightCm = heightIn * 2.54;
      neckCm = neckIn * 2.54;
      waistCm = waistIn * 2.54;
      hipCm = hipIn * 2.54;
    } else {
      heightCm = num('bf-cm', 0);
      neckCm = num('bf-neckcm', 0);
      waistCm = num('bf-waistcm', 0);
      hipCm = num('bf-hipcm', 0);
      weightForMass = num('bf-kg', 0);

      if (heightCm <= 0 || neckCm <= 0 || waistCm <= 0 || weightForMass <= 0 || (gender === 'f' && hipCm <= 0)) {
        el('bf-result').innerHTML = '<p class="tool-result is-error">Enter valid measurements.</p>';
        return;
      }
    }

    // The site's US-unit tab converts to metric internally and always uses the SI
    // formula -- the separately-documented USC (inches) formula doesn't match its
    // actual output for the female case, so we replicate the metric path always.
    const bfp = gender === 'm'
      ? 495 / (1.0324 - 0.19077 * Math.log10(waistCm - neckCm) + 0.15456 * Math.log10(heightCm)) - 450
      : 495 / (1.29579 - 0.35004 * Math.log10(waistCm + hipCm - neckCm) + 0.22100 * Math.log10(heightCm)) - 450;

    if (!Number.isFinite(bfp) || bfp <= 0) {
      el('bf-result').innerHTML = '<p class="tool-result is-error">Enter valid measurements.</p>';
      return;
    }

    const fatMass = bfp / 100 * weightForMass;
    const leanMass = weightForMass - fatMass;
    const ideal = idealBF(gender, age);
    const toLose = fatMass - (ideal / 100 * weightForMass);
    const massUnit = unit === 'us' ? 'lbs' : 'kg';

    // BMI method (informational secondary estimate)
    let bmi;
    if (unit === 'us') {
      const heightIn = num('bf-ft', 0) * 12 + num('bf-in', 0);
      bmi = 703 * weightForMass / (heightIn * heightIn);
    } else {
      const heightM = num('bf-cm', 0) / 100;
      bmi = weightForMass / (heightM * heightM);
    }
    const bfpBmi = gender === 'm' ? (1.20 * bmi + 0.23 * age - 16.2) : (1.20 * bmi + 0.23 * age - 5.4);

    el('bf-result').innerHTML = `
      <div class="summary-payment-box">
        <div class="label">Body Fat (U.S. Navy Method)</div>
        <div class="value">${bfp.toFixed(1)}%</div>
        <div style="font-size:14px;font-weight:600;color:var(--accent);margin-top:4px;">${category(gender, bfp)}</div>
      </div>
      <div class="stat-row"><span>Body Fat Mass</span><strong>${fatMass.toFixed(1)} ${massUnit}</strong></div>
      <div class="stat-row"><span>Lean Body Mass</span><strong>${leanMass.toFixed(1)} ${massUnit}</strong></div>
      <div class="stat-row"><span>Ideal Body Fat for Age (Jackson &amp; Pollock)</span><strong>${ideal.toFixed(1)}%</strong></div>
      <div class="stat-row"><span>${toLose >= 0 ? 'Body Fat to Lose to Reach Ideal' : 'Body Fat Above Ideal'}</span><strong>${Math.abs(toLose).toFixed(1)} ${massUnit}</strong></div>
      <div class="stat-row"><span>Body Fat (BMI method)</span><strong>${bfpBmi.toFixed(1)}%</strong></div>
    `;
  }

  function updateVisibility() {
    const unit = form.querySelector('input[name="bf-unit"]:checked').value;
    el('bf-us-fields').hidden = unit !== 'us';
    el('bf-metric-fields').hidden = unit !== 'metric';
    const gender = form.querySelector('input[name="bf-gender"]:checked').value;
    el('bf-hip-us').hidden = !(unit === 'us' && gender === 'f');
    el('bf-hip-metric').hidden = !(unit === 'metric' && gender === 'f');
  }

  form.querySelectorAll('input[name="bf-unit"]').forEach((r) => r.addEventListener('change', () => { updateVisibility(); calculate(); }));
  form.querySelectorAll('input[name="bf-gender"]').forEach((r) => r.addEventListener('change', () => { updateVisibility(); calculate(); }));
  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });

  updateVisibility();
  calculate();
})();
