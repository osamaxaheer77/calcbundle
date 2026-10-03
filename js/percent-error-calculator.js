'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('pe-form');
  if (!form) return;

  const read = (id) => { const raw = el(id).value.trim(); if (raw === '') return NaN; const v = Number(raw); return Number.isFinite(v) ? v : NaN; };
  const fmt = (v) => { const s = String(Math.round(v * 1e4) / 1e4); const [i, f] = s.split('.'); return i.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (f ? '.' + f : ''); };
  const num = (v) => String(Math.round(v * 1e8) / 1e8);

  function calculate() {
    const obs = read('pe-obs'), tru = read('pe-true');
    if (Number.isNaN(obs) || Number.isNaN(tru)) { el('pe-result').innerHTML = '<p class="tool-result is-error">Enter both values as numbers.</p>'; return; }
    if (tru === 0) { el('pe-result').innerHTML = '<p class="tool-result is-error">Percent error is undefined when the true value is 0, because it would mean dividing by 0.</p>'; return; }
    const diff = obs - tru, rel = diff / tru, pct = rel * 100;
    el('pe-result').innerHTML =
      `<div class="summary-payment-box"><div class="label">Percent error</div><div class="value">${fmt(pct)}%</div><div class="label" style="margin-top:6px;">${fmt(Math.abs(pct))}% absolute error</div></div>` +
      '<h3 style="margin:16px 0 6px;font-size:15px;">Steps</h3>' +
      '<p style="font-size:13px;line-height:1.7;margin:0;">Percent error = (observed − true) ÷ true × 100<br>' +
      `= (${num(obs)} − ${num(tru)}) ÷ ${num(tru)} × 100<br>` +
      `= ${num(diff)} ÷ ${num(tru)} × 100<br>` +
      `= ${num(rel)} × 100<br>= ${fmt(pct)}%</p>` +
      `<div class="stat-row"><span>Absolute error</span><strong>${num(Math.abs(diff))}</strong></div>`;
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  calculate();
})();
