'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  if (!el('gf-form')) return;

  const num = (id) => { const raw = el(id).value.trim(); if (raw === '') return NaN; const v = Number(raw); return Number.isFinite(v) ? v : NaN; };
  const error = (id, msg) => { el(id).innerHTML = `<p class="tool-result is-error">${msg}</p>`; };
  const radio = (name) => document.querySelector(`input[name="${name}"]:checked`).value;
  const toMgDl = (v, unit) => (unit === 'um' ? v / 88.4 : v);
  const one = (v) => (Math.round(v * 10) / 10).toFixed(1);

  function adult() {
    const scr = toMgDl(num('gf-scr'), el('gf-unit').value), age = num('gf-age');
    if (!(scr > 0)) return error('gf-result', 'Enter a serum creatinine value, more than 0.');
    if (!Number.isInteger(age) || age < 18) return error('gf-result', 'Enter an age of 18 or older as a whole number.');
    const female = radio('gf-sex') === 'f', black = radio('gf-race') === 'b';

    const mdrd = 175 * Math.pow(scr, -1.154) * Math.pow(age, -0.203) * (female ? 0.742 : 1) * (black ? 1.212 : 1);

    const kappa = female ? 0.7 : 0.9, alpha = scr < kappa ? -0.329 - (female ? 0 : 0.082) : -1.209;
    const base = female ? (black ? 166 : 144) : (black ? 163 : 141);
    const epi = base * Math.pow(scr / kappa, alpha) * Math.pow(0.993, age);

    const s = Math.max(scr, 0.8);
    const mayo = Math.exp(1.911 + 5.249 / s - 2.114 / (s * s) - 0.00686 * age - (female ? 0.205 : 0));

    el('gf-result').innerHTML =
      `<div class="summary-payment-box"><div class="label">CKD-EPI estimate</div><div class="value">${one(epi)}</div><div class="label" style="margin-top:6px;">mL/min/1.73 m²</div></div>` +
      '<table class="schedule-table" style="margin-top:14px;"><thead><tr><th>Formula</th><th>Result (mL/min/1.73 m²)</th></tr></thead><tbody>' +
      `<tr><td>MDRD 4-variable equation</td><td>${one(mdrd)}</td></tr>` +
      `<tr><td>CKD-EPI formula</td><td>${one(epi)}</td></tr>` +
      `<tr><td>Mayo Quadratic formula</td><td>${one(mayo)}</td></tr></tbody></table>`;
  }

  function child() {
    const scr = toMgDl(num('gc-scr'), el('gc-unit').value);
    const h = num('gc-height');
    if (!(scr > 0)) return error('gc-result', 'Enter a serum creatinine value, more than 0.');
    if (!(h > 0)) return error('gc-result', 'Enter a height, more than 0.');
    const cm = el('gc-hunit').value === 'in' ? h * 2.54 : h;
    const gfr = (0.413 * cm) / scr;
    el('gc-result').innerHTML = `<div class="summary-payment-box"><div class="label">Estimated GFR (Schwartz)</div><div class="value">${one(gfr)}</div><div class="label" style="margin-top:6px;">mL/min/1.73 m²</div></div>`;
  }

  el('gf-form').addEventListener('submit', (e) => { e.preventDefault(); adult(); });
  el('gc-form').addEventListener('submit', (e) => { e.preventDefault(); child(); });
  document.querySelectorAll('input[name="gf-sex"], input[name="gf-race"]').forEach((n) => n.addEventListener('change', adult));
  el('gf-unit').addEventListener('change', adult);
  el('gc-unit').addEventListener('change', child);
  el('gc-hunit').addEventListener('change', child);
  adult();
  child();
})();
