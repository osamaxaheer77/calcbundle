'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const DAY = 24 * 60 * 60 * 1000;

  function parseDate(id) {
    const v = el(id).value;
    if (!v) return null;
    const d = new Date(v + 'T00:00:00');
    return isNaN(d) ? null : d;
  }

  function ymdDiff(start, end) {
    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    let days = end.getDate() - start.getDate();
    if (days < 0) {
      months--;
      const prevMonthLastDay = new Date(end.getFullYear(), end.getMonth(), 0).getDate();
      days += prevMonthLastDay;
    }
    if (months < 0) {
      years--;
      months += 12;
    }
    return { years, months, days };
  }

  const fmt = (n) => n.toLocaleString('en-US');

  const diffForm = el('date-diff-form');
  if (diffForm) {
    function calcDiff() {
      const start = parseDate('date-diff-start');
      const end = parseDate('date-diff-end');
      const includeEnd = el('date-diff-include').checked;
      const resultEl = el('date-diff-result');

      if (!start || !end) {
        resultEl.innerHTML = '<p class="tool-result is-error">Enter both a start and end date.</p>';
        return;
      }
      if (start > end) {
        resultEl.innerHTML = '<p class="tool-result is-error">The start date must be before the end date.</p>';
        return;
      }

      const { years, months, days } = ymdDiff(start, end);
      let totalDays = Math.round((end - start) / DAY);
      if (includeEnd) totalDays += 1;
      const totalWeeks = Math.floor(totalDays / 7);
      const remDays = totalDays - totalWeeks * 7;

      resultEl.innerHTML = `
        <div class="summary-payment-box">
          <div class="label">Difference</div>
          <div class="value">${years > 0 ? years + ' years ' : ''}${months} months ${days} days</div>
        </div>
        <div class="stat-row"><span>Or</span><strong>${fmt(totalWeeks)} weeks, ${remDays} days</strong></div>
        <div class="stat-row"><span>Or</span><strong>${fmt(totalDays)} calendar days</strong></div>
      `;
    }
    diffForm.addEventListener('submit', (e) => { e.preventDefault(); calcDiff(); });
    diffForm.querySelectorAll('input').forEach((i) => i.addEventListener('change', calcDiff));
    calcDiff();
  }

  const addForm = el('date-add-form');
  if (addForm) {
    function calcAdd() {
      const start = parseDate('date-add-start');
      const resultEl = el('date-add-result');

      if (!start) {
        resultEl.innerHTML = '<p class="tool-result is-error">Enter a start date.</p>';
        return;
      }

      const op = el('date-add-op').value === '-' ? -1 : 1;
      const years = op * (parseInt(el('date-add-years').value, 10) || 0);
      const months = op * (parseInt(el('date-add-months').value, 10) || 0);
      const weeks = op * (parseInt(el('date-add-weeks').value, 10) || 0);
      const days = op * (parseInt(el('date-add-days').value, 10) || 0);

      const result = new Date(
        start.getFullYear() + years,
        start.getMonth() + months,
        start.getDate() + weeks * 7 + days
      );

      const dateFmt = result.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const weekdayFmt = result.toLocaleDateString('en-US', { weekday: 'long' });

      resultEl.innerHTML = `
        <div class="summary-payment-box">
          <div class="label">Result</div>
          <div class="value">${dateFmt}</div>
        </div>
        <div class="stat-row"><span>Day of week</span><strong>${weekdayFmt}</strong></div>
      `;
    }
    addForm.addEventListener('submit', (e) => { e.preventDefault(); calcAdd(); });
    addForm.querySelectorAll('input, select').forEach((i) => i.addEventListener('change', calcAdd));
    calcAdd();
  }
})();
