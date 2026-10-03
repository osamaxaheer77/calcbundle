'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('bt-form');
  if (!form) return;

  const read = (id) => {
    const raw = el('bt-' + id).value.trim();
    const v = raw === '' ? NaN : Number(raw);
    return Number.isFinite(v) && v > 0 ? (el('bt-' + id + '-u').value === 'cm' ? v / 2.54 : v) : NaN;
  };

  // Rules from Lee, Istook, Nam and Park (2007); all measurements in inches.
  function shapes(bust, waist, highHip, hip) {
    const bh = bust - hip, hb = hip - bust, bw = bust - waist, hw = hip - waist, hhw = highHip / waist;
    const out = [];
    if (bh <= 1 && hb < 3.6 && (bw >= 9 || hw >= 10)) out.push('Hourglass');
    if (hb >= 3.6 && hb < 10 && hw >= 9 && hhw < 1.193) out.push('Bottom hourglass');
    if (bh > 1 && bh < 10 && bw >= 9) out.push('Top hourglass');
    if (hb > 2 && hw >= 7 && hhw >= 1.193) out.push('Spoon');
    if (hb >= 3.6 && hw < 9) out.push('Triangle');
    if (bh >= 3.6 && bw < 9) out.push('Inverted triangle');
    if (hb < 3.6 && bh < 3.6 && bw < 9 && hw < 10) out.push('Rectangle');
    return out;
  }

  function calculate() {
    const bust = read('bust'), waist = read('waist'), hh = read('highhip'), hip = read('hip');
    if ([bust, waist, hh, hip].some((v) => Number.isNaN(v))) {
      el('bt-result').innerHTML = '<p class="tool-result is-error">Enter all four measurements, each more than 0.</p>';
      return;
    }
    const found = shapes(bust, waist, hh, hip);
    const whr = waist / hip;
    const whrText = String(Math.round(whr * 100) / 100);
    const high = whr > 0.85;
    el('bt-result').innerHTML =
      (found.length
        ? `<div class="summary-payment-box"><div class="label">Body shape</div><div class="value" style="font-size:24px;">${found.join(' and ')}</div></div>`
        : '<p style="font-size:14px;line-height:1.5;margin:0;">Unfortunately, this calculator could not place your measurements in one of the seven female body shapes. Every body is different, and the rules cannot cover all possibilities.</p>') +
      `<div class="stat-row"><span>Waist-hip ratio (WHR)</span><strong>${whrText}</strong></div>` +
      (high ? '<p style="font-size:13px;line-height:1.5;margin:10px 0 0;">Based on a World Health Organization publication, this waist-hip ratio points to abdominal obesity and a higher health risk.</p>' : '');
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  form.querySelectorAll('select').forEach((s) => s.addEventListener('change', calculate));
  calculate();
})();
