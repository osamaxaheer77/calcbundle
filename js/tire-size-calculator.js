'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const fmt = (n) => n.toLocaleString('en-US', { maximumFractionDigits: 1 });

  function tireStats(widthMm, aspectPct, wheelIn) {
    const sidewallMm = widthMm * (aspectPct / 100);
    const diameterMm = wheelIn * 25.4 + 2 * sidewallMm;
    const circumferenceMm = Math.PI * diameterMm;
    const revsPerMile = 63360 / (circumferenceMm / 25.4);
    const revsPerKm = 1000000 / circumferenceMm;
    return { sidewallMm, diameterMm, circumferenceMm, revsPerMile, revsPerKm };
  }

  const singleForm = el('tire-single-form');
  if (singleForm) {
    function calcSingle() {
      const width = parseFloat(el('tire-width').value);
      const aspect = parseFloat(el('tire-aspect').value);
      const wheel = parseFloat(el('tire-wheel').value);
      const resultEl = el('tire-single-result');

      if ([width, aspect, wheel].some((v) => isNaN(v) || v <= 0)) {
        resultEl.innerHTML = '<p class="tool-result is-error">Enter a valid width (mm), aspect ratio (%), and wheel size (in).</p>';
        return;
      }

      const t = tireStats(width, aspect, wheel);

      resultEl.innerHTML = `
        <div class="summary-payment-box">
          <div class="label">Tire Diameter</div>
          <div class="value">${fmt(t.diameterMm / 25.4)} in / ${fmt(t.diameterMm)} mm</div>
        </div>
        <div class="stat-row"><span>Sidewall Height</span><strong>${fmt(t.sidewallMm / 25.4)} in / ${fmt(t.sidewallMm)} mm</strong></div>
        <div class="stat-row"><span>Circumference</span><strong>${fmt(t.circumferenceMm / 25.4)} in / ${fmt(t.circumferenceMm)} mm</strong></div>
        <div class="stat-row"><span>Revolutions per Mile</span><strong>${fmt(t.revsPerMile)}</strong></div>
        <div class="stat-row"><span>Revolutions per Kilometer</span><strong>${fmt(t.revsPerKm)}</strong></div>
      `;
    }
    singleForm.addEventListener('submit', (e) => { e.preventDefault(); calcSingle(); });
    singleForm.querySelectorAll('input').forEach((i) => i.addEventListener('input', calcSingle));
    calcSingle();
  }

  const compareForm = el('tire-compare-form');
  if (compareForm) {
    function calcCompare() {
      const w1 = parseFloat(el('tire-c1-width').value);
      const a1 = parseFloat(el('tire-c1-aspect').value);
      const r1 = parseFloat(el('tire-c1-wheel').value);
      const w2 = parseFloat(el('tire-c2-width').value);
      const a2 = parseFloat(el('tire-c2-aspect').value);
      const r2 = parseFloat(el('tire-c2-wheel').value);
      const resultEl = el('tire-compare-result');

      if ([w1, a1, r1, w2, a2, r2].some((v) => isNaN(v) || v <= 0)) {
        resultEl.innerHTML = '<p class="tool-result is-error">Enter valid values for both tires.</p>';
        return;
      }

      const t1 = tireStats(w1, a1, r1);
      const t2 = tireStats(w2, a2, r2);
      const diffPct = ((t2.diameterMm - t1.diameterMm) / t1.diameterMm) * 100;

      const speeds = [20, 40, 60, 80, 100, 120];
      const speedRows = speeds.map((s) => {
        const actual = s * (t2.diameterMm / t1.diameterMm);
        return `<div class="stat-row"><span>Speedo shows ${s}</span><strong>Actual: ${fmt(actual)}</strong></div>`;
      }).join('');

      resultEl.innerHTML = `
        <div class="summary-payment-box">
          <div class="label">Diameter Difference</div>
          <div class="value">${diffPct > 0 ? '+' : ''}${fmt(diffPct)}%</div>
        </div>
        <div class="stat-row"><span>Tire 1 Diameter</span><strong>${fmt(t1.diameterMm / 25.4)} in</strong></div>
        <div class="stat-row"><span>Tire 2 Diameter</span><strong>${fmt(t2.diameterMm / 25.4)} in</strong></div>
        <div class="stat-row"><span></span><span style="font-size:0.85em;">Speedometer reading (calibrated to Tire 1) vs. actual speed on Tire 2:</span></div>
        ${speedRows}
      `;
    }
    compareForm.addEventListener('submit', (e) => { e.preventDefault(); calcCompare(); });
    compareForm.querySelectorAll('input').forEach((i) => i.addEventListener('input', calcCompare));
    calcCompare();
  }
})();
