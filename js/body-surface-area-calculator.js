'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('bsa-form');
  if (!form) return;

  function calculate() {
    const unit = form.querySelector('input[name="bsa-heightunit"]:checked').value;
    let heightCm;
    if (unit === 'ftin') {
      const ft = parseFloat(el('bsa-ft').value) || 0;
      const inch = parseFloat(el('bsa-in').value) || 0;
      heightCm = (ft * 12 + inch) * 2.54;
    } else {
      heightCm = parseFloat(el('bsa-cm').value) || 0;
    }

    const weightVal = parseFloat(el('bsa-weight').value);
    const weightUnit = el('bsa-weight-unit').value;
    let weightKg;
    if (weightUnit === 'pound') weightKg = weightVal * 0.45359237;
    else if (weightUnit === 'gram') weightKg = weightVal / 1000;
    else weightKg = weightVal;

    const resultEl = el('bsa-result');
    if (heightCm <= 0 || !weightVal || weightKg <= 0) {
      resultEl.innerHTML = '<p class="tool-result is-error">Enter a valid height and weight.</p>';
      return;
    }

    const weightG = weightKg * 1000;
    const h = heightCm, w = weightKg;

    const formulas = [
      { name: 'Du Bois', m2: 0.007184 * Math.pow(h, 0.725) * Math.pow(w, 0.425) },
      { name: 'Mosteller', m2: Math.sqrt((h * w) / 3600) },
      { name: 'Haycock', m2: 0.024265 * Math.pow(h, 0.3964) * Math.pow(w, 0.5378) },
      { name: 'Gehan & George', m2: 0.0235 * Math.pow(h, 0.42246) * Math.pow(w, 0.51456) },
      { name: 'Boyd', m2: 0.0003207 * Math.pow(h, 0.3) * Math.pow(weightG, 0.7285 - 0.0188 * Math.log10(weightG)) },
    ];

    const bmi = w / Math.pow(h / 100, 2);

    const rowsHtml = formulas.map((f) => {
      const ft2 = f.m2 * 10.7639;
      return `<div class="stat-row"><span>${f.name}</span><strong>${f.m2.toFixed(2)} m&sup2; (${ft2.toFixed(2)} ft&sup2;)</strong></div>`;
    }).join('');

    const avg = formulas.reduce((sum, f) => sum + f.m2, 0) / formulas.length;

    resultEl.innerHTML = `
      <div class="summary-payment-box">
        <div class="label">Average Body Surface Area</div>
        <div class="value">${avg.toFixed(2)} m&sup2;</div>
      </div>
      ${rowsHtml}
      <div class="stat-row" style="margin-top:8px;"><span>BMI</span><strong>${bmi.toFixed(1)} kg/m&sup2;</strong></div>
    `;
  }

  function updateVisibility() {
    const unit = form.querySelector('input[name="bsa-heightunit"]:checked').value;
    el('bsa-ftin-fields').hidden = unit !== 'ftin';
    el('bsa-cm-field').hidden = unit !== 'cm';
  }

  form.querySelectorAll('input[name="bsa-heightunit"]').forEach((r) => r.addEventListener('change', () => { updateVisibility(); calculate(); }));
  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  form.querySelectorAll('input, select').forEach((i) => i.addEventListener('input', calculate));

  updateVisibility();
  calculate();
})();
