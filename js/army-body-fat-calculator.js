'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('ab-form');
  if (!form) return;

  const LB_PER_KG = 2.2046226218, IN_PER_CM = 1 / 2.54;
  const sex = () => form.querySelector('input[name="ab-sex"]:checked').value;
  const num = (id) => { const raw = el(id).value.trim(); if (raw === '') return NaN; const v = Number(raw); return Number.isFinite(v) ? v : NaN; };
  const error = (msg) => { el('ab-result').innerHTML = `<p class="tool-result is-error">${msg}</p>`; };
  const fmt = (v) => Math.round(v * 10) / 10;

  function maxAllowed(age, s) {
    const m = s === 'm';
    if (age <= 20) return m ? 20 : 30;
    if (age <= 27) return m ? 22 : 32;
    if (age <= 39) return m ? 24 : 34;
    return m ? 26 : 36;
  }

  function calculate() {
    const s = sex(), metric = el('ab-units').value === 'metric';
    const age = num('ab-age'), wRaw = num('ab-weight');
    if (!Number.isFinite(age) || age < 1 || age > 120) return error('Enter an age.');
    if (age < 17) return error('The Army standard starts at age 17, so there is no standard to compare with for this age.');
    if (!(wRaw > 0)) return error('Enter your weight, more than 0.');
    let waist;
    if (metric) {
      const cm = num('ab-cm');
      if (!(cm > 0)) return error('Enter your waist measurement, more than 0.');
      waist = cm * IN_PER_CM;
    } else {
      const ft = el('ab-feet').value.trim() === '' ? 0 : num('ab-feet'), inch = el('ab-inch').value.trim() === '' ? 0 : num('ab-inch');
      if (!Number.isFinite(ft) || !Number.isFinite(inch) || ft < 0 || inch < 0 || ft * 12 + inch <= 0) return error('Enter your waist measurement, more than 0.');
      waist = ft * 12 + inch;
    }
    const lb = metric ? wRaw * LB_PER_KG : wRaw;

    const raw = s === 'm' ? -26.97 - 0.12 * lb + 1.99 * waist : -9.15 - 0.015 * lb + 1.27 * waist;
    const bf = Math.min(100, Math.max(0, Math.round(raw)));
    const limit = maxAllowed(age, s);
    let html = `<div class="summary-payment-box"><div class="label">Body fat</div><div class="value">${bf}%</div></div>`;
    if (bf <= limit) {
      html += `<p style="font-size:14px;line-height:1.5;margin:14px 0 0;color:#10b981;"><strong>You meet the maximum allowable body fat standard</strong>, which is ${limit}% for your age and sex.</p>`;
    } else {
      const cut = bf - limit;
      const lose = (cut / 100) * lb;
      const loseText = metric ? `${fmt(lose / LB_PER_KG)} kilograms` : `${Math.round(lose)} pounds`;
      html += `<p style="font-size:14px;line-height:1.5;margin:14px 0 0;color:#ef4444;"><strong>You are not within the maximum allowable body fat standard</strong>, which is ${limit}% for your age and sex.</p>` +
        `<div class="stat-row"><span>Reduction needed</span><strong>${cut}%</strong></div>` +
        `<div class="stat-row"><span>Equal to body fat of about</span><strong>${loseText}</strong></div>`;
    }
    html += '<div class="stat-row"><span>Waist used</span><strong>' + fmt(waist) + ' in</strong></div>' +
      '<div class="stat-row"><span>Weight used</span><strong>' + fmt(lb) + ' lb</strong></div>';
    el('ab-result').innerHTML = html;
  }

  function applyUnits() {
    const metric = el('ab-units').value === 'metric';
    el('ab-weight-label').textContent = metric ? 'Weight (kilograms)' : 'Weight (pounds)';
    el('ab-waist-us').style.display = metric ? 'none' : '';
    el('ab-waist-metric').style.display = metric ? '' : 'none';
  }
  el('ab-units').addEventListener('change', () => {
    const metric = el('ab-units').value === 'metric';
    const w = num('ab-weight');
    if (Number.isFinite(w)) el('ab-weight').value = Math.round((metric ? w / LB_PER_KG : w * LB_PER_KG) * 10) / 10;
    if (metric) {
      const ft = num('ab-feet') || 0, inch = num('ab-inch') || 0;
      el('ab-cm').value = Math.round((ft * 12 + inch) * 2.54 * 10) / 10;
    } else {
      const total = (num('ab-cm') || 0) * IN_PER_CM;
      el('ab-feet').value = Math.floor(total / 12);
      el('ab-inch').value = Math.round((total % 12) * 10) / 10;
    }
    applyUnits();
    calculate();
  });
  form.querySelectorAll('input[name="ab-sex"]').forEach((n) => n.addEventListener('change', calculate));
  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  applyUnits();
  calculate();
})();
