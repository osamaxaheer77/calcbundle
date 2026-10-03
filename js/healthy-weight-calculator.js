'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('hw-form');
  if (!form) return;

  const LB_PER_KG = 2.2046226218;
  const num = (id) => { const raw = el(id).value.trim(); if (raw === '') return NaN; const v = Number(raw); return Number.isFinite(v) ? v : NaN; };
  const error = (msg) => { el('hw-result').innerHTML = `<p class="tool-result is-error">${msg}</p>`; };

  const BANDS = [
    ['Underweight', null, 18.5, '#3b82f6'],
    ['Healthy weight', 18.5, 25, '#10b981'],
    ['Overweight', 25, 30, '#f59e0b'],
    ['Obese, class I', 30, 35, '#f97316'],
    ['Obese, class II', 35, 40, '#ef4444'],
    ['Obese, class III', 40, null, '#b91c1c'],
  ];

  function calculate() {
    const us = el('hw-units').value === 'us';
    let m;
    if (us) {
      const ft = el('hw-ft').value.trim() === '' ? 0 : num('hw-ft'), inch = el('hw-in').value.trim() === '' ? 0 : num('hw-in');
      if (!Number.isFinite(ft) || !Number.isFinite(inch) || ft < 0 || inch < 0 || ft * 12 + inch <= 0) return error('Enter your height, more than 0.');
      m = ((ft * 12 + inch) * 2.54) / 100;
    } else {
      const cm = num('hw-cm');
      if (!(cm > 0)) return error('Enter your height, more than 0.');
      m = cm / 100;
    }
    const sq = m * m;
    const w = (bmi) => bmi * sq;
    const show = (kg) => (us ? `${Math.round(kg * LB_PER_KG)} lb` : `${(Math.round(kg * 10) / 10).toFixed(1)} kg`);
    const lo = w(18.5), hi = w(25);
    let html = `<div class="summary-payment-box"><div class="label">Healthy weight range</div><div class="value" style="font-size:26px;">${show(lo)} – ${show(hi)}</div><div class="label" style="margin-top:6px;">BMI 18.5 to 25 at your height</div></div>`;

    // Bar covering BMI 15 to 45, split at the category boundaries.
    const min = 15, max = 45;
    html += '<div style="display:flex;height:16px;border-radius:8px;overflow:hidden;margin:16px 0 4px;">';
    BANDS.forEach(([name, a, b, color]) => {
      const from = Math.max(a == null ? min : a, min), to = Math.min(b == null ? max : b, max);
      html += `<div title="${name}" style="width:${((to - from) / (max - min)) * 100}%;background:${color};"></div>`;
    });
    html += '</div>';
    html += '<table class="schedule-table" style="margin-top:10px;"><thead><tr><th>Category</th><th>BMI</th><th>Weight</th></tr></thead><tbody>';
    BANDS.forEach(([name, a, b]) => {
      const bmi = a == null ? 'under 18.5' : b == null ? '40 and over' : `${a} to ${b}`;
      const wt = a == null ? `under ${show(w(b))}` : b == null ? `${show(w(a))} and over` : `${show(w(a))} to ${show(w(b))}`;
      html += `<tr><td>${name}</td><td>${bmi}</td><td>${wt}</td></tr>`;
    });
    el('hw-result').innerHTML = html + '</tbody></table>';
  }

  el('hw-units').addEventListener('change', () => {
    const us = el('hw-units').value === 'us';
    if (us) {
      const cm = num('hw-cm');
      if (Number.isFinite(cm)) { const t = cm / 2.54; el('hw-ft').value = Math.floor(t / 12); el('hw-in').value = Math.round((t % 12) * 10) / 10; }
    } else {
      const ft = num('hw-ft') || 0, inch = num('hw-in') || 0;
      el('hw-cm').value = Math.round((ft * 12 + inch) * 2.54 * 10) / 10;
    }
    el('hw-metric').style.display = us ? 'none' : '';
    el('hw-us').style.display = us ? '' : 'none';
    calculate();
  });
  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  calculate();
})();
