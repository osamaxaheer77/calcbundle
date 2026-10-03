'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('lb-form');
  if (!form) return;

  const KG_PER_LB = 0.45359237, LB_PER_KG = 1 / KG_PER_LB;
  const radio = (name) => form.querySelector(`input[name="${name}"]:checked`).value;
  const num = (id) => { const raw = el(id).value.trim(); if (raw === '') return NaN; const v = Number(raw); return Number.isFinite(v) ? v : NaN; };
  const error = (msg) => { el('lb-result').innerHTML = `<p class="tool-result is-error">${msg}</p>`; };

  function calculate() {
    const male = radio('lb-sex') === 'm', child = radio('lb-child') === 'y', us = el('lb-units').value === 'us';
    let w, h;
    if (us) {
      const ft = el('lb-ft').value.trim() === '' ? 0 : num('lb-ft'), inch = el('lb-in').value.trim() === '' ? 0 : num('lb-in'), lb = num('lb-lb');
      if (!Number.isFinite(ft) || !Number.isFinite(inch) || ft < 0 || inch < 0 || ft * 12 + inch <= 0) return error('Enter your height, more than 0.');
      if (!(lb > 0)) return error('Enter your weight, more than 0.');
      h = (ft * 12 + inch) * 2.54;
      w = lb * KG_PER_LB;
    } else {
      h = num('lb-cm'); w = num('lb-kg');
      if (!(h > 0)) return error('Enter your height, more than 0.');
      if (!(w > 0)) return error('Enter your weight, more than 0.');
    }
    const rows = [];
    if (child) rows.push(['Peters (for children)', 3.8 * 0.0215 * Math.pow(w, 0.6469) * Math.pow(h, 0.7236)]);
    rows.push(['Boer', male ? 0.407 * w + 0.267 * h - 19.2 : 0.252 * w + 0.473 * h - 48.3]);
    rows.push(['James', male ? 1.1 * w - 128 * Math.pow(w / h, 2) : 1.07 * w - 148 * Math.pow(w / h, 2)]);
    rows.push(['Hume', male ? 0.3281 * w + 0.33929 * h - 29.5336 : 0.29569 * w + 0.41813 * h - 43.2933]);

    const unit = us ? 'lb' : 'kg';
    const show = (kg) => (Math.round((us ? kg * LB_PER_KG : kg) * 10) / 10).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    const first = rows[0];
    let html = `<div class="summary-payment-box"><div class="label">Lean body mass (${first[0]})</div><div class="value">${show(first[1])} ${unit}</div><div class="label" style="margin-top:6px;">${Math.round((first[1] / w) * 100)}% of body weight</div></div>` +
      '<table class="schedule-table" style="margin-top:14px;"><thead><tr><th>Formula</th><th>Lean body mass</th><th>Body fat</th></tr></thead><tbody>';
    rows.forEach(([name, kg]) => {
      html += `<tr><td>${name}</td><td>${show(kg)} ${unit} (${Math.round((kg / w) * 100)}%)</td><td>${Math.round((1 - kg / w) * 100)}%</td></tr>`;
    });
    el('lb-result').innerHTML = html + '</tbody></table>';
  }

  function applyUnits() {
    const us = el('lb-units').value === 'us';
    el('lb-metric').style.display = us ? 'none' : '';
    el('lb-us').style.display = us ? '' : 'none';
  }
  el('lb-units').addEventListener('change', () => {
    const us = el('lb-units').value === 'us';
    if (us) {
      const cm = num('lb-cm'), kg = num('lb-kg');
      if (Number.isFinite(cm)) { const t = cm / 2.54; el('lb-ft').value = Math.floor(t / 12); el('lb-in').value = Math.round((t % 12) * 10) / 10; }
      if (Number.isFinite(kg)) el('lb-lb').value = Math.round(kg * LB_PER_KG * 10) / 10;
    } else {
      const ft = num('lb-ft') || 0, inch = num('lb-in') || 0, lb = num('lb-lb');
      el('lb-cm').value = Math.round((ft * 12 + inch) * 2.54 * 10) / 10;
      if (Number.isFinite(lb)) el('lb-kg').value = Math.round(lb * KG_PER_LB * 10) / 10;
    }
    applyUnits();
    calculate();
  });
  form.querySelectorAll('input[type="radio"]').forEach((n) => n.addEventListener('change', calculate));
  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  applyUnits();
  calculate();
})();
