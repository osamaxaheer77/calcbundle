'use strict';

(function () {
  const el = (id) => document.getElementById(id);

  const GRADE_POINTS = {
    'A+': 4.3, A: 4, 'A-': 3.7, 'B+': 3.3, B: 3, 'B-': 2.7,
    'C+': 2.3, C: 2, 'C-': 1.7, 'D+': 1.3, D: 1, 'D-': 0.7, F: 0
  };

  const gpaForm = el('gpa-form');
  if (gpaForm) {
    const rowsEl = el('gpa-rows');

    function gradeOptions(selected) {
      const grades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F', 'P', 'NP'];
      return '<option value="">-</option>' + grades.map((g) => `<option value="${g}"${g === selected ? ' selected' : ''}>${g}</option>`).join('');
    }

    function addRow(credits, grade) {
      const row = document.createElement('div');
      row.className = 'field-row gpa-row';
      row.innerHTML = `
        <div class="field-group">
          <label>Credits</label>
          <input type="number" class="gpa-credits" min="0" step="any" value="${credits !== undefined ? credits : ''}">
        </div>
        <div class="field-group">
          <label>Grade</label>
          <select class="gpa-grade unit-select">${gradeOptions(grade)}</select>
        </div>
      `;
      rowsEl.appendChild(row);
      row.querySelectorAll('input, select').forEach((i) => i.addEventListener('input', calcGpa));
      row.querySelectorAll('select').forEach((s) => s.addEventListener('change', calcGpa));
    }

    function calcGpa() {
      const resultEl = el('gpa-result');
      let totalPoints = 0;
      let totalCredits = 0;

      rowsEl.querySelectorAll('.gpa-row').forEach((row) => {
        const credits = parseFloat(row.querySelector('.gpa-credits').value);
        const grade = row.querySelector('.gpa-grade').value;
        if (isNaN(credits) || credits <= 0 || !grade || !(grade in GRADE_POINTS)) return;
        totalPoints += credits * GRADE_POINTS[grade];
        totalCredits += credits;
      });

      if (totalCredits === 0) {
        resultEl.innerHTML = '<p class="tool-result is-error">Enter credits and a letter grade (A+ through F) for at least one course.</p>';
        return;
      }

      const gpa = totalPoints / totalCredits;
      resultEl.innerHTML = `
        <div class="summary-payment-box">
          <div class="label">GPA</div>
          <div class="value">${gpa.toFixed(3)}</div>
        </div>
        <div class="stat-row"><span>Total Credits</span><strong>${totalCredits}</strong></div>
        <div class="stat-row"><span>Total Grade Points</span><strong>${totalPoints.toFixed(2)}</strong></div>
      `;
    }

    el('gpa-add-row').addEventListener('click', () => addRow());
    gpaForm.addEventListener('submit', (e) => { e.preventDefault(); calcGpa(); });

    addRow(4, 'A+');
    addRow(2, 'B');
    addRow(3, 'A');
    calcGpa();
  }

  const planForm = el('gpa-plan-form');
  if (planForm) {
    function calcPlan() {
      const currentGpa = parseFloat(el('gpa-plan-current').value);
      const targetGpa = parseFloat(el('gpa-plan-target').value);
      const currentCredits = parseFloat(el('gpa-plan-current-credits').value);
      const additionalCredits = parseFloat(el('gpa-plan-additional-credits').value);
      const resultEl = el('gpa-plan-result');

      if ([currentGpa, targetGpa, currentCredits, additionalCredits].some((v) => isNaN(v)) || additionalCredits <= 0) {
        resultEl.innerHTML = '<p class="tool-result is-error">Enter all four values; additional credits must be greater than 0.</p>';
        return;
      }

      const requiredGpa = (targetGpa * (currentCredits + additionalCredits) - currentGpa * currentCredits) / additionalCredits;

      resultEl.innerHTML = `
        <div class="summary-payment-box">
          <div class="label">Required GPA for Next ${additionalCredits} Credits</div>
          <div class="value">${requiredGpa.toFixed(3)}</div>
        </div>
        ${requiredGpa > 4.3 ? '<div class="stat-row"><span></span><strong style="color:#c0392b;">Not achievable on a standard 4.3 scale</strong></div>' : ''}
        ${requiredGpa < 0 ? '<div class="stat-row"><span></span><strong>You\'ve already exceeded this target</strong></div>' : ''}
      `;
    }
    planForm.addEventListener('submit', (e) => { e.preventDefault(); calcPlan(); });
    planForm.querySelectorAll('input').forEach((i) => i.addEventListener('input', calcPlan));
    calcPlan();
  }
})();
