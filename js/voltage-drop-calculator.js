'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('vd-form');
  if (!form) return;

  const RES_TO_OHM_PER_M = {
    okm: 0.001, om: 1, mohm_m: 0.001, o1000ft: 1 / 304.8, oft: 1 / 0.3048, mohm_ft: 0.001 / 0.3048
  };
  const DIST_TO_M = { feet: 0.3048, meter: 1, mile: 1609.344, kilometer: 1000 };
  const PHASE_MULTIPLIER = { dc: 2, acsingle: 2, ac3: Math.sqrt(3) };

  const fmt = (n) => n.toLocaleString('en-US', { maximumFractionDigits: 4 });

  function calculate() {
    const resistanceVal = parseFloat(el('vd-resistance').value);
    const resistanceOhmPerM = resistanceVal * RES_TO_OHM_PER_M[el('vd-resistance-unit').value];
    const voltage = parseFloat(el('vd-voltage').value);
    const phase = el('vd-phase').value;
    const conductors = parseFloat(el('vd-conductors').value) || 1;
    const distanceVal = parseFloat(el('vd-distance').value);
    const distanceM = distanceVal * DIST_TO_M[el('vd-distance-unit').value];
    const current = parseFloat(el('vd-current').value);
    const resultEl = el('vd-result');

    if ([resistanceVal, voltage, distanceVal, current].some((v) => isNaN(v) || v <= 0)) {
      resultEl.innerHTML = '<p class="tool-result is-error">Enter positive values for resistance, voltage, distance, and current.</p>';
      return;
    }

    const effectiveResistance = resistanceOhmPerM / conductors;
    const voltageDrop = PHASE_MULTIPLIER[phase] * current * effectiveResistance * distanceM;
    const dropPct = (voltageDrop / voltage) * 100;
    const voltageAtEnd = voltage - voltageDrop;

    resultEl.innerHTML = `
      <div class="summary-payment-box">
        <div class="label">Voltage Drop</div>
        <div class="value">${fmt(voltageDrop)} V</div>
      </div>
      <div class="stat-row"><span>Voltage drop percentage</span><strong>${fmt(dropPct)}%</strong></div>
      <div class="stat-row"><span>Voltage at the load</span><strong>${fmt(voltageAtEnd)} V</strong></div>
      ${dropPct > 5 ? '<div class="stat-row"><span></span><strong style="color:#c0392b;">Exceeds the recommended 5% limit</strong></div>' : ''}
    `;
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  form.querySelectorAll('input, select').forEach((i) => i.addEventListener('input', calculate));
  calculate();
})();
