'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('age-form');
  if (!form) return;

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

  function calculate() {
    const dob = parseDate('age-dob');
    const at = parseDate('age-at');

    if (!dob || !at) {
      el('age-result').innerHTML = '<p class="tool-result is-error">Enter both a date of birth and an "age at" date.</p>';
      return;
    }
    if (dob > at) {
      el('age-result').innerHTML = '<p class="tool-result is-error">The date of birth must be before the "age at" date.</p>';
      return;
    }

    const { years, months, days } = ymdDiff(dob, at);
    const totalDays = Math.round((at - dob) / DAY);
    const totalMonths = years * 12 + months;
    const totalWeeks = Math.floor(totalDays / 7);
    const remainderDaysAfterWeeks = totalDays - totalWeeks * 7;
    const totalHours = totalDays * 24;
    const totalMinutes = totalHours * 60;
    const totalSeconds = totalMinutes * 60;

    const fmt = (n) => n.toLocaleString('en-US');

    el('age-result').innerHTML = `
      <div class="summary-payment-box">
        <div class="label">Age</div>
        <div class="value">${years} years ${months} months ${days} days</div>
      </div>
      <div class="stat-row"><span>Or</span><strong>${fmt(totalMonths)} months, ${days} days</strong></div>
      <div class="stat-row"><span>Or</span><strong>${fmt(totalWeeks)} weeks, ${remainderDaysAfterWeeks} days</strong></div>
      <div class="stat-row"><span>Or</span><strong>${fmt(totalDays)} days</strong></div>
      <div class="stat-row"><span>Or</span><strong>${fmt(totalHours)} hours</strong></div>
      <div class="stat-row"><span>Or</span><strong>${fmt(totalMinutes)} minutes</strong></div>
      <div class="stat-row"><span>Or</span><strong>${fmt(totalSeconds)} seconds</strong></div>
    `;
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  form.querySelectorAll('input[type="date"]').forEach((i) => i.addEventListener('change', calculate));
  calculate();
})();
