'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('pwg-form');
  if (!form) return;

  const KG_TO_LBS = 1 / 0.45359237;

  function num(id, fallback = 0) {
    const field = el(id);
    if (!field) return fallback;
    const v = parseFloat(field.value);
    return Number.isFinite(v) ? v : fallback;
  }

  function bmiCategory(bmi) {
    if (bmi < 18.5) return 'underweight';
    if (bmi < 25) return 'normal';
    if (bmi < 30) return 'overweight';
    return 'obese';
  }

  const IOM_RANGES = {
    underweight: { single: [28, 40], twins: null },
    normal: { single: [25, 35], twins: [37, 54] },
    overweight: { single: [15, 25], twins: [31, 50] },
    obese: { single: [11, 20], twins: [25, 42] },
  };

  const CATEGORY_LABEL = { underweight: 'Underweight', normal: 'Normal Weight', overweight: 'Overweight', obese: 'Obese' };

  const FIRST_TRI_END = 13;
  const FIRST_TRI_GAIN = [1, 4];

  // Recommended [low, high] extra weight gained by the given week, using a
  // standard 2-phase model: 1-4 lb ramp through the first trimester (week 13),
  // then a steady linear rate to reach the IOM total by week 40. This is a
  // transparent approximation of the published guideline, not a byte-for-byte
  // reproduction of any specific reference site's internal curve.
  function gainAtWeek(week, totalRange) {
    if (week <= FIRST_TRI_END) {
      const frac = week / FIRST_TRI_END;
      return [FIRST_TRI_GAIN[0] * frac, FIRST_TRI_GAIN[1] * frac];
    }
    const remainingWeeks = 40 - FIRST_TRI_END;
    const frac = (week - FIRST_TRI_END) / remainingWeeks;
    return [
      FIRST_TRI_GAIN[0] + (totalRange[0] - FIRST_TRI_GAIN[0]) * frac,
      FIRST_TRI_GAIN[1] + (totalRange[1] - FIRST_TRI_GAIN[1]) * frac,
    ];
  }

  function calculate() {
    const unit = form.querySelector('input[name="pwg-unit"]:checked').value;
    const week = parseInt(el('pwg-week').value, 10);
    const twins = form.querySelector('input[name="pwg-twins"]:checked').value === '1';

    let heightIn, weightBeforeLbs, weightNowLbs;
    if (unit === 'us') {
      heightIn = num('pwg-ft', 0) * 12 + num('pwg-in', 0);
      weightBeforeLbs = num('pwg-before-lbs', 0);
      weightNowLbs = num('pwg-now-lbs', 0);
    } else {
      heightIn = num('pwg-cm', 0) / 2.54;
      weightBeforeLbs = num('pwg-before-kg', 0) * KG_TO_LBS;
      weightNowLbs = num('pwg-now-kg', 0) * KG_TO_LBS;
    }

    if (heightIn <= 0 || weightBeforeLbs <= 0) {
      el('pwg-result').innerHTML = '<p class="tool-result is-error">Enter a valid height and pre-pregnancy weight.</p>';
      return;
    }

    const bmi = 703 * weightBeforeLbs / (heightIn * heightIn);
    const category = bmiCategory(bmi);
    const iom = IOM_RANGES[category];
    const totalRange = twins ? iom.twins : iom.single;

    const toDisplay = (lbs) => unit === 'us' ? lbs.toFixed(1) + ' lbs' : (lbs / KG_TO_LBS).toFixed(1) + ' kg';

    if (!totalRange) {
      el('pwg-result').innerHTML = `
        <div class="summary-payment-box">
          <div class="label">Pre-pregnancy BMI</div>
          <div class="value">${bmi.toFixed(1)} kg/m&sup2;</div>
          <div style="font-size:14px;font-weight:600;color:var(--accent);margin-top:4px;">${CATEGORY_LABEL[category]}</div>
        </div>
        <p class="tool-result is-error" style="margin-top:12px;">The Institute of Medicine does not publish a specific twin-pregnancy weight gain range for the underweight category &mdash; talk to your care provider about a target that's right for you.</p>
      `;
      return;
    }

    const currentRange = gainAtWeek(week, totalRange);
    const currentLowWeight = weightBeforeLbs + currentRange[0];
    const currentHighWeight = weightBeforeLbs + currentRange[1];
    const finalLowWeight = weightBeforeLbs + totalRange[0];
    const finalHighWeight = weightBeforeLbs + totalRange[1];

    let statusHtml = '';
    if (weightNowLbs > 0) {
      let status, color;
      if (weightNowLbs < currentLowWeight) { status = 'below the recommended range'; color = '#f59e0b'; }
      else if (weightNowLbs > currentHighWeight) { status = 'above the recommended range'; color = '#ef4444'; }
      else { status = 'within the recommended range'; color = '#10b981'; }
      statusHtml = `<div class="stat-row"><span>Your Current Weight</span><strong style="color:${color};">${toDisplay(weightNowLbs)} (${status})</strong></div>`;
    }

    el('pwg-result').innerHTML = `
      <div class="summary-payment-box">
        <div class="label">Recommended Range for Week ${week}</div>
        <div class="value">${toDisplay(currentLowWeight)} &ndash; ${toDisplay(currentHighWeight)}</div>
      </div>
      ${statusHtml}
      <div class="stat-row"><span>Recommended Range at Delivery (Week 40)</span><strong>${toDisplay(finalLowWeight)} &ndash; ${toDisplay(finalHighWeight)}</strong></div>
      <div class="stat-row"><span>Total Recommended Gain</span><strong>${totalRange[0]} &ndash; ${totalRange[1]} lbs</strong></div>
      <div class="stat-row"><span>Pre-pregnancy BMI</span><strong>${bmi.toFixed(1)} kg/m&sup2; (${CATEGORY_LABEL[category]})</strong></div>
    `;

    let tableHtml = '<table class="schedule-table"><thead><tr><th>Week</th><th>Recommended Weight Range</th><th>Recommended Gain</th></tr></thead><tbody>';
    for (let w = 1; w <= 40; w++) {
      const r = gainAtWeek(w, totalRange);
      const lowW = weightBeforeLbs + r[0];
      const highW = weightBeforeLbs + r[1];
      const highlight = w === week ? ' style="background:var(--accent-tint);"' : '';
      tableHtml += `<tr${highlight}><td>Week ${w}</td><td>${toDisplay(lowW)} &ndash; ${toDisplay(highW)}</td><td>${r[0].toFixed(1)} &ndash; ${r[1].toFixed(1)} lbs</td></tr>`;
    }
    tableHtml += '</tbody></table>';
    el('pwg-table-wrap').innerHTML = tableHtml;
    el('pwg-results-section').hidden = false;
  }

  function updateVisibility() {
    const unit = form.querySelector('input[name="pwg-unit"]:checked').value;
    el('pwg-us-fields').hidden = unit !== 'us';
    el('pwg-metric-fields').hidden = unit !== 'metric';
  }

  form.querySelectorAll('input[name="pwg-unit"]').forEach((r) => r.addEventListener('change', () => { updateVisibility(); calculate(); }));
  form.querySelectorAll('input[name="pwg-twins"]').forEach((r) => r.addEventListener('change', calculate));
  el('pwg-week').addEventListener('change', calculate);
  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });

  updateVisibility();
  calculate();
})();
