'use strict';

(function () {
  const N = window.NutritionCommon;
  if (!N || !N.el('pr-form')) return;
  const el = N.el;

  const KCAL_PER_G = 4.1;

  function run() {
    const r = N.read('pr');
    if (r.err) { el('pr-result').innerHTML = `<p class="tool-result is-error">${r.err}</p>`; return; }
    const sedentary = r.activity === 1.2;
    const adaLow = r.kg * (sedentary ? 0.8 : 1), adaHigh = r.kg * (sedentary ? 1 : 1.8);
    const cdcLow = (r.maintain * 0.1) / KCAL_PER_G, cdcHigh = (r.maintain * 0.35) / KCAL_PER_G;
    const who = r.kg * 0.83;
    el('pr-result').innerHTML =
      `<div class="summary-payment-box"><div class="label">Protein per day (ADA guideline)</div><div class="value">${N.whole(adaLow)} – ${N.whole(adaHigh)} g</div></div>` +
      '<p style="font-size:13px;color:var(--text-secondary);margin:12px 0 6px;">Daily protein recommendations from three authorities for the details you entered:</p>' +
      `<div class="stat-row" style="display:block;"><span>American Dietetic Association (ADA)</span><br><strong>at least ${N.whole(adaLow)} – ${N.whole(adaHigh)} grams/day</strong></div>` +
      `<div class="stat-row" style="display:block;"><span>Centers for Disease Control and Prevention (CDC)</span><br><strong>${N.whole(cdcLow)} – ${N.whole(cdcHigh)} grams/day</strong><br><span style="font-size:12px;">10% to 35% of daily calories</span></div>` +
      `<div class="stat-row" style="display:block;"><span>World Health Organization safe lower limit</span><br><strong>${N.whole(who)} grams/day</strong></div>`;
  }

  N.wire('pr', run);
})();
