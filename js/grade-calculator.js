'use strict';

(function () {
  const el = (id) => document.getElementById(id);

  const weightedForm = el('grade-weighted-form');
  if (weightedForm) {
    const rowsEl = el('grade-rows');

    function addRow(grade, weight) {
      const row = document.createElement('div');
      row.className = 'field-row grade-row';
      row.innerHTML = `
        <div class="field-group">
          <label>Grade (%)</label>
          <input type="number" class="grade-score" min="0" max="100" step="any" value="${grade !== undefined ? grade : ''}">
        </div>
        <div class="field-group">
          <label>Weight (%)</label>
          <input type="number" class="grade-weight" min="0" step="any" value="${weight !== undefined ? weight : ''}">
        </div>
      `;
      rowsEl.appendChild(row);
      row.querySelectorAll('input').forEach((i) => i.addEventListener('input', calcWeighted));
    }

    function calcWeighted() {
      const resultEl = el('grade-weighted-result');
      let totalWeighted = 0;
      let totalWeight = 0;

      rowsEl.querySelectorAll('.grade-row').forEach((row) => {
        const grade = parseFloat(row.querySelector('.grade-score').value);
        const weight = parseFloat(row.querySelector('.grade-weight').value);
        if (isNaN(grade) || isNaN(weight) || weight <= 0) return;
        totalWeighted += grade * weight;
        totalWeight += weight;
      });

      if (totalWeight === 0) {
        resultEl.innerHTML = '<p class="tool-result is-error">Enter a grade and weight for at least one item.</p>';
        return;
      }

      const overall = totalWeighted / totalWeight;
      resultEl.innerHTML = `
        <div class="summary-payment-box">
          <div class="label">Overall Grade</div>
          <div class="value">${overall.toFixed(2)}%</div>
        </div>
        <div class="stat-row"><span>Total Weight Entered</span><strong>${totalWeight}%</strong></div>
        ${Math.abs(totalWeight - 100) > 0.001 ? '<div class="stat-row"><span></span><strong>Weights don\'t total 100% &mdash; result is normalized to the weight you entered.</strong></div>' : ''}
      `;
    }

    el('grade-add-row').addEventListener('click', () => addRow());
    weightedForm.addEventListener('submit', (e) => { e.preventDefault(); calcWeighted(); });

    addRow(90, 5);
    addRow(83, 20);
    addRow(88, 20);
    calcWeighted();
  }

  const finalForm = el('grade-final-form');
  if (finalForm) {
    function calcFinal() {
      const current = parseFloat(el('grade-final-current').value);
      const desired = parseFloat(el('grade-final-desired').value);
      const weightPct = parseFloat(el('grade-final-weight').value);
      const resultEl = el('grade-final-result');

      if ([current, desired, weightPct].some((v) => isNaN(v)) || weightPct <= 0 || weightPct > 100) {
        resultEl.innerHTML = '<p class="tool-result is-error">Enter your current grade, desired grade, and a final weight between 0 and 100%.</p>';
        return;
      }

      const weight = weightPct / 100;
      const required = (desired - current * (1 - weight)) / weight;

      resultEl.innerHTML = `
        <div class="summary-payment-box">
          <div class="label">Required Grade on the Final</div>
          <div class="value">${required.toFixed(2)}%</div>
        </div>
        ${required > 100 ? '<div class="stat-row"><span></span><strong style="color:#c0392b;">Not achievable &mdash; exceeds 100%</strong></div>' : ''}
        ${required < 0 ? '<div class="stat-row"><span></span><strong>You\'ve already secured this grade</strong></div>' : ''}
      `;
    }
    finalForm.addEventListener('submit', (e) => { e.preventDefault(); calcFinal(); });
    finalForm.querySelectorAll('input').forEach((i) => i.addEventListener('input', calcFinal));
    calcFinal();
  }
})();
