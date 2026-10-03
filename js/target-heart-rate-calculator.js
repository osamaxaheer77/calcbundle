'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('hr-form');
  if (!form) return;

  const num = (id) => { const raw = el(id).value.trim(); if (raw === '') return NaN; const v = Number(raw); return Number.isFinite(v) ? v : NaN; };
  const error = (msg) => { el('hr-result').innerHTML = `<p class="tool-result is-error">${msg}</p>`; };
  const mode = () => form.querySelector('input[name="hr-mode"]:checked').value;

  const MHR = { h: (a) => 220 - a, t: (a) => 208 - 0.7 * a, n: (a) => 211 - 0.64 * a };
  const ZONES = [
    ['Very light', 0.5, 0.6, 'maintenance, warm up'],
    ['Light', 0.6, 0.7, 'weight control, fat burning'],
    ['Moderate', 0.7, 0.8, 'aerobic, endurance training'],
    ['Hard', 0.8, 0.9, 'anaerobic, hard training'],
    ['VO2 max', 0.9, 1, 'maximum effort'],
  ];
  const BORG = [['No exertion', 6], ['Extremely light', 7], ['Very light', 9], ['Light', 11], ['Moderate', 12], ['Somewhat hard', 13], ['Hard', 15], ['Very hard', 17], ['Extremely hard', 19], ['Maximal exertion', 20]];
  const CR10 = [['No exertion', 0], ['Noticeable', 0.5], ['Very light', 1], ['Light', 2], ['Moderate', 3], ['Somewhat difficult', 4], ['Difficult', 5], ['Very difficult', 7], ['Almost maximal', 9], ['Maximal', 10]];

  function calculate() {
    let max;
    if (mode() === 'a') {
      const age = num('hr-age');
      if (!Number.isFinite(age) || age < 1 || age > 110) return error('Enter an age from 1 to 110.');
      max = Math.round(MHR[el('hr-formula').value](age));
    } else {
      max = num('hr-mhr');
      if (!(max > 0) || max > 300) return error('Enter your tested maximum heart rate, up to 300 bpm.');
    }
    const rhrRaw = el('hr-rhr').value.trim();
    const hasRhr = rhrRaw !== '';
    const rhr = hasRhr ? Number(rhrRaw) : 0;
    if (hasRhr) {
      if (!Number.isFinite(rhr) || rhr < 20) return error('Enter a resting heart rate of at least 20 bpm, or leave it empty.');
      if (rhr >= max) return error('The resting heart rate must be lower than the maximum heart rate.');
    }
    const r = (v) => Math.round(v);
    const scale = el('hr-scale').value;
    let html = `<div class="stat-row"><span>Maximum heart rate</span><strong>${r(max)} bpm</strong></div>`;
    if (hasRhr) html += `<div class="stat-row"><span>Heart rate reserve</span><strong>${r(max - rhr)} bpm</strong></div>`;

    if (!hasRhr) {
      html += '<p style="font-size:12px;color:var(--text-secondary);margin:6px 0 10px;">Zones are a share of your maximum heart rate. Add a resting heart rate for a more personal result.</p>' +
        '<table class="schedule-table"><thead><tr><th>Intensity</th><th>Target (bpm)</th></tr></thead><tbody>' +
        ZONES.map(([n, a, b, d]) => `<tr><td>${n}<br><span style="font-size:12px;color:var(--text-secondary);">${d}</span></td><td>${r(max * a)} – ${r(max * b)} (${a * 100}–${b * 100}%)</td></tr>`).join('') + '</tbody></table>';
    } else if (scale === 'k') {
      html = `<div class="summary-payment-box"><div class="label">Target heart rate for aerobic exercise</div><div class="value">${r((max - rhr) * 0.5 + rhr)} – ${r((max - rhr) * 0.85 + rhr)} bpm</div><div class="label" style="margin-top:6px;">50% to 85% of heart rate reserve</div></div>` + html +
        '<table class="schedule-table" style="margin-top:12px;"><thead><tr><th>Intensity</th><th>Reserve</th><th>Target (bpm)</th></tr></thead><tbody>' +
        ZONES.map(([n, a, b]) => `<tr><td>${n}</td><td>${a * 100}–${b * 100}%</td><td>${r((max - rhr) * a + rhr)} – ${r((max - rhr) * b + rhr)}</td></tr>`).join('') + '</tbody></table>';
    } else {
      const rows = scale === 'b' ? BORG : CR10;
      const lo = scale === 'b' ? 6 : 0, hi = scale === 'b' ? 20 : 10;
      html += `<table class="schedule-table" style="margin-top:12px;"><thead><tr><th>Intensity</th><th>${scale === 'b' ? 'Borg scale' : 'CR10 scale'}</th><th>Target (bpm)</th></tr></thead><tbody>` +
        rows.map(([n, v]) => `<tr><td>${n}</td><td>${v}</td><td>${r(rhr + (max - rhr) * ((v - lo) / (hi - lo)))}</td></tr>`).join('') + '</tbody></table>';
    }
    el('hr-result').innerHTML = html;
  }

  function applyMode() {
    const a = mode() === 'a';
    el('hr-age-box').style.display = a ? '' : 'none';
    el('hr-formula-box').style.display = a ? '' : 'none';
    el('hr-mhr-box').style.display = a ? 'none' : '';
  }
  form.querySelectorAll('input[name="hr-mode"]').forEach((n) => n.addEventListener('change', () => { applyMode(); calculate(); }));
  ['hr-formula', 'hr-scale'].forEach((id) => el(id).addEventListener('change', calculate));
  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  applyMode();
  calculate();
})();
