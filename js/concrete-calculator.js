'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const fmt = (n) => n.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 });

  const TO_FEET = { foot: 1, inch: 1 / 12, yard: 3, meter: 3.28084, centimeter: 0.0328084 };
  const LBS_PER_CUFT = 133;
  const CUFT_TO_CUYD = 1 / 27;
  const CUFT_TO_CUM = 0.0283168;
  const LBS_TO_KG = 0.453592;

  function volumeResultHtml(volumeCuFt) {
    const cuYd = volumeCuFt * CUFT_TO_CUYD;
    const cuM = volumeCuFt * CUFT_TO_CUM;
    const lbs = volumeCuFt * LBS_PER_CUFT;
    const kg = lbs * LBS_TO_KG;
    const bags60 = lbs / 60;
    const bags80 = lbs / 80;

    return `
      <div class="summary-payment-box">
        <div class="label">Volume</div>
        <div class="value">${fmt(volumeCuFt)} cubic feet</div>
      </div>
      <div class="stat-row"><span>Or</span><strong>${fmt(cuYd)} cubic yards</strong></div>
      <div class="stat-row"><span>Or</span><strong>${fmt(cuM)} cubic meters</strong></div>
      <div class="stat-row"><span>Weight needed</span><strong>${fmt(lbs)} lbs (${fmt(kg)} kg)</strong></div>
      <div class="stat-row"><span>Using 60-lb bags</span><strong>${fmt(bags60)} bags</strong></div>
      <div class="stat-row"><span>Using 80-lb bags</span><strong>${fmt(bags80)} bags</strong></div>
    `;
  }

  const slabForm = el('concrete-slab-form');
  if (slabForm) {
    function calcSlab() {
      const length = (parseFloat(el('concrete-slab-length').value) || 0) * TO_FEET[el('concrete-slab-length-unit').value];
      const width = (parseFloat(el('concrete-slab-width').value) || 0) * TO_FEET[el('concrete-slab-width-unit').value];
      const thick = (parseFloat(el('concrete-slab-thick').value) || 0) * TO_FEET[el('concrete-slab-thick-unit').value];
      const qty = parseFloat(el('concrete-slab-qty').value) || 0;
      const resultEl = el('concrete-slab-result');

      const volume = length * width * thick * qty;
      resultEl.innerHTML = volumeResultHtml(volume);
    }
    slabForm.addEventListener('submit', (e) => { e.preventDefault(); calcSlab(); });
    slabForm.querySelectorAll('input, select').forEach((i) => i.addEventListener('change', calcSlab));
    calcSlab();
  }

  const holeForm = el('concrete-hole-form');
  if (holeForm) {
    function calcHole() {
      const diameter = (parseFloat(el('concrete-hole-diameter').value) || 0) * TO_FEET[el('concrete-hole-diameter-unit').value];
      const depth = (parseFloat(el('concrete-hole-depth').value) || 0) * TO_FEET[el('concrete-hole-depth-unit').value];
      const qty = parseFloat(el('concrete-hole-qty').value) || 0;
      const resultEl = el('concrete-hole-result');

      const radius = diameter / 2;
      const volume = Math.PI * radius * radius * depth * qty;
      resultEl.innerHTML = volumeResultHtml(volume);
    }
    holeForm.addEventListener('submit', (e) => { e.preventDefault(); calcHole(); });
    holeForm.querySelectorAll('input, select').forEach((i) => i.addEventListener('change', calcHole));
    calcHole();
  }
})();
