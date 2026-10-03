'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('rm-form');
  if (!form) return;

  const LB_PER_KG = 2.2046226218;
  const num = (id) => { const raw = el(id).value.trim(); if (raw === '') return NaN; const v = Number(raw); return Number.isFinite(v) ? v : NaN; };
  const error = (msg) => { el('rm-result').innerHTML = `<p class="tool-result is-error">${msg}</p>`; el('rm-tables').hidden = true; };
  const group = (s) => s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  // Multiplier that turns a lifted weight and rep count into a one rep max, and its inverse.
  const FORMULAS = {
    e: { name: 'Epley', max: (n) => 1 + n / 30, reps: (p) => 30 * (1 / p - 1) },
    b: { name: 'Brzycki', max: (n) => 36 / (37 - n), reps: (p) => 37 - 36 * p },
    l: { name: 'Lombardi', max: (n) => Math.pow(n, 0.1), reps: (p) => Math.pow(p, -10) },
  };
  // The fraction of the 1RM you can lift for n reps.
  const share = (f, n) => (n <= 1 ? 1 : 1 / f.max(n));

  function calculate() {
    const lift = num('rm-lift'), reps = num('rm-reps');
    if (!(lift > 0)) return error('Enter the weight you lifted, more than 0.');
    if (!Number.isInteger(reps) || reps < 1 || reps > 10) return error('Enter the repetitions as a whole number from 1 to 10.');
    const f = FORMULAS[el('rm-formula').value];
    const inUnit = el('rm-lift-unit').value, outUnit = el('rm-out-unit').value;
    const toOut = (w) => (inUnit === outUnit ? w : inUnit === 'kg' ? w * LB_PER_KG : w / LB_PER_KG);
    const oneRm = toOut(lift * (reps === 1 ? 1 : f.max(reps)));
    const show = (w) => group((Math.round(w * 10) / 10).toFixed(1)) + ' ' + outUnit;

    el('rm-result').innerHTML =
      `<div class="summary-payment-box"><div class="label">Estimated one rep max</div><div class="value">${show(oneRm)}</div><div class="label" style="margin-top:6px;">${f.name} formula, ${lift} ${inUnit} for ${reps} rep${reps === 1 ? '' : 's'}</div></div>` +
      `<div class="stat-row"><span>90% of your max</span><strong>${show(oneRm * 0.9)}</strong></div>` +
      `<div class="stat-row"><span>80% of your max</span><strong>${show(oneRm * 0.8)}</strong></div>` +
      `<div class="stat-row"><span>70% of your max</span><strong>${show(oneRm * 0.7)}</strong></div>`;

    let t1 = '<table class="schedule-table"><thead><tr><th>Repetitions</th><th>Weight</th><th>% of 1RM</th></tr></thead><tbody>';
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20].forEach((n) => {
      const s = share(f, n);
      t1 += `<tr><td>${n}</td><td>${show(oneRm * s)}</td><td>${Math.round(s * 100)}%</td></tr>`;
    });
    el('rm-reps-table').innerHTML = t1 + '</tbody></table>';

    let t2 = '<table class="schedule-table"><thead><tr><th>% of 1RM</th><th>Weight</th><th>Repetitions</th></tr></thead><tbody>';
    for (let p = 100; p >= 50; p -= 5) {
      const n = Math.max(1, Math.floor(f.reps(p / 100) + 1e-9));
      t2 += `<tr><td>${p}%</td><td>${show(oneRm * (p / 100))}</td><td>${group(String(n))}</td></tr>`;
    }
    el('rm-pct-table').innerHTML = t2 + '</tbody></table>';
    el('rm-tables').hidden = false;
  }

  el('rm-lift-unit').addEventListener('change', () => { el('rm-out-unit').value = el('rm-lift-unit').value; calculate(); });
  el('rm-out-unit').addEventListener('change', calculate);
  el('rm-formula').addEventListener('change', calculate);
  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  calculate();
})();
