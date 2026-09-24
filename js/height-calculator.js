'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const CM_PER_INCH = 2.54;

  function feetInchesToInches(feet, inches) {
    return (parseFloat(feet) || 0) * 12 + (parseFloat(inches) || 0);
  }
  function inchesToFeetInches(totalInches) {
    const feet = Math.floor(totalInches / 12);
    const inches = totalInches - feet * 12;
    return { feet, inches };
  }
  function fmt(n) { return Math.round(n * 10) / 10; }

  const predictForm = el('height-predict-form');
  if (predictForm) {
    function calcPredict() {
      const motherIn = feetInchesToInches(el('height-mother-feet').value, el('height-mother-inch').value);
      const fatherIn = feetInchesToInches(el('height-father-feet').value, el('height-father-inch').value);
      const resultEl = el('height-predict-result');

      if (!motherIn || !fatherIn) {
        resultEl.innerHTML = '<p class="tool-result is-error">Enter both parents\' heights.</p>';
        return;
      }

      const boyIn = (fatherIn + motherIn + 5) / 2;
      const girlIn = (fatherIn + motherIn - 5) / 2;
      const boy = inchesToFeetInches(boyIn);
      const girl = inchesToFeetInches(girlIn);

      resultEl.innerHTML = `
        <div class="summary-payment-box">
          <div class="label">Male Child's Predicted Height</div>
          <div class="value">${boy.feet} ft ${fmt(boy.inches)} in</div>
        </div>
        <div class="stat-row"><span>Or</span><strong>${fmt(boyIn * CM_PER_INCH)} cm</strong></div>
        <div class="summary-payment-box" style="margin-top:16px;">
          <div class="label">Female Child's Predicted Height</div>
          <div class="value">${girl.feet} ft ${fmt(girl.inches)} in</div>
        </div>
        <div class="stat-row"><span>Or</span><strong>${fmt(girlIn * CM_PER_INCH)} cm</strong></div>
      `;
    }
    predictForm.addEventListener('submit', (e) => { e.preventDefault(); calcPredict(); });
    predictForm.querySelectorAll('input').forEach((i) => i.addEventListener('input', calcPredict));
    calcPredict();
  }

  const convertForm = el('height-convert-form');
  if (convertForm) {
    function calcConvert() {
      const totalIn = feetInchesToInches(el('height-conv-feet').value, el('height-conv-inch').value);
      const resultEl = el('height-convert-result');

      if (!totalIn) {
        resultEl.innerHTML = '<p class="tool-result is-error">Enter a height in feet and/or inches.</p>';
        return;
      }

      resultEl.innerHTML = `
        <div class="summary-payment-box">
          <div class="label">In Centimeters</div>
          <div class="value">${fmt(totalIn * CM_PER_INCH)} cm</div>
        </div>
      `;
    }
    convertForm.addEventListener('submit', (e) => { e.preventDefault(); calcConvert(); });
    convertForm.querySelectorAll('input').forEach((i) => i.addEventListener('input', calcConvert));
    calcConvert();
  }
})();
