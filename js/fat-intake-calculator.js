'use strict';

(function () {
  const N = window.NutritionCommon;
  if (!N || !N.el('ft-form')) return;
  const el = N.el;

  const KCAL_PER_G = 8.8;
  const g = (cal, pct) => Math.round((cal * pct) / 100 / KCAL_PER_G);

  function run() {
    const r = N.read('ft');
    if (r.err) { el('ft-result').innerHTML = `<p class="tool-result is-error">${r.err}</p>`; el('ft-below').hidden = true; return; }
    const m = r.goals[0];
    el('ft-result').innerHTML =
      `<div class="summary-payment-box"><div class="label">Daily fat to maintain your weight</div><div class="value">${g(m.cal, 20)} – ${g(m.cal, 35)} g</div><div class="label" style="margin-top:6px;">20% to 35% of ${N.whole(m.cal)} Calories</div></div>` +
      `<div class="stat-row"><span>Saturated fat</span><strong>under ${g(m.cal, 10)} g</strong></div>` +
      `<div class="stat-row"><span>Saturated fat to help reduce heart disease</span><strong>under ${g(m.cal, 7)} g</strong></div>`;
    el('ft-table-wrap').innerHTML =
      '<table class="schedule-table"><thead><tr><th>Goal</th><th>Daily calories</th><th>Fat (20–35%)*</th><th>Saturated fat (10%)*</th><th>Saturated fat for heart health (7%)*</th></tr></thead><tbody>' +
      r.goals.map((x) => `<tr><td>${x.label}</td><td>${N.whole(x.cal)}</td><td>${g(x.cal, 20)} – ${g(x.cal, 35)} g</td><td>&lt; ${g(x.cal, 10)} g</td><td>&lt; ${g(x.cal, 7)} g</td></tr>`).join('') +
      '</tbody></table><p style="font-size:12px;color:var(--text-secondary);margin:12px 0 0;">*The percentages are shares of total daily calories. Negative values mean that calorie goal is below zero and is not a realistic target.</p>';
    el('ft-below').hidden = false;
  }

  N.wire('ft', run);
})();
