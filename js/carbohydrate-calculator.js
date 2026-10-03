'use strict';

(function () {
  const N = window.NutritionCommon;
  if (!N || !N.el('cb-form')) return;
  const el = N.el;

  const KCAL_PER_G = 3.75, FLOOR_G = 130;
  const PCTS = [40, 55, 65, 75];
  const G_PER_OZ = 28.349523125, G_PER_LB = 453.59237;

  const grams = (cal, pct) => (cal * pct) / 100 / KCAL_PER_G;
  const gText = (g, us) => `${N.whole(g)} g` + (us ? ` (${(g / G_PER_OZ).toFixed(2)} oz, ${(g / G_PER_LB).toFixed(3)} lb)` : '');

  function run() {
    const r = N.read('cb');
    if (r.err) { el('cb-result').innerHTML = `<p class="tool-result is-error">${r.err}</p>`; el('cb-below').hidden = true; return; }
    el('cb-result').innerHTML =
      `<div class="summary-payment-box"><div class="label">Calories to maintain your weight</div><div class="value">${N.whole(r.maintain)}</div><div class="label" style="margin-top:6px;">Calories per day</div></div>` +
      `<p style="font-size:13px;line-height:1.5;margin:14px 0 0;">Carbohydrates are recommended to make up 40% to 75% of daily calories. The table below shows the grams for each goal.</p>`;

    const low = grams(r.maintain, 40) < FLOOR_G; // very low calorie needs: use the 130 g minimum instead of a table
    let html = '';
    if (!low) {
      html = '<table class="schedule-table"><thead><tr><th>Goal</th><th>Daily calories</th>' + PCTS.map((p) => `<th>${p}%*</th>`).join('') + '</tr></thead><tbody>' +
        r.goals.map((g) => `<tr><td>${g.label}</td><td>${N.whole(g.cal)}</td>${PCTS.map((p) => `<td>${gText(grams(g.cal, p), r.us)}</td>`).join('')}</tr>`).join('') + '</tbody></table>';
    } else {
      html = '<p style="font-size:13px;color:var(--text-secondary);margin:0 0 10px;">Your calorie needs are low, so the amounts are held to the 130 gram daily minimum of carbohydrate that the brain needs.</p>' +
        r.goals.map((g) => {
          const cal = N.whole(g.cal);
          const lo = grams(g.cal, 40), hi = grams(g.cal, 75);
          const gr = (v) => `${N.whole(v)} grams${r.us ? ` (${(v / G_PER_OZ).toFixed(2)} oz or ${(v / G_PER_LB).toFixed(3)} lb)` : ''}`;
          let text;
          if (hi < FLOOR_G) text = `You should take ${gr(FLOOR_G)} of carbohydrate for your energy needs.`;
          else {
            const from = lo >= FLOOR_G ? `${N.whole(lo)} (40%)` : `${FLOOR_G}`;
            text = `You should take ${from} - ${N.whole(hi)} (75%) grams of carbohydrate for your energy needs. (55% = ${gr(grams(g.cal, 55))}, 65% = ${gr(grams(g.cal, 65))})`;
          }
          return `<p style="margin:0 0 10px;font-size:14px;line-height:1.5;"><strong>You need ${cal} Calories/day to ${g.phrase}.</strong> ${text}</p>`;
        }).join('');
    }
    html += '<p style="font-size:12px;color:var(--text-secondary);margin:12px 0 0;">*The Institute of Medicine recommends that adults in the U.S. and Canada get 40% to 65% of their energy from carbohydrates. The Food and Agriculture Organization and the World Health Organization recommend 55% to 75%, with no more than 10% directly from sugars.</p>';
    el('cb-table-wrap').innerHTML = html;
    el('cb-below').hidden = false;
  }

  N.wire('cb', run);
})();
