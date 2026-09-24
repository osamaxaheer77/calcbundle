'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const num = (id) => parseInt(el(id).value, 10) || 0;
  const fmt = (n) => n.toLocaleString('en-US');

  const sumForm = el('time-sum-form');
  if (sumForm) {
    function calcSum() {
      const op = el('time-sum-op').value === '-' ? -1 : 1;
      const s1 = num('time-sum-day1') * 86400 + num('time-sum-hour1') * 3600 + num('time-sum-min1') * 60 + num('time-sum-sec1');
      const s2 = num('time-sum-day2') * 86400 + num('time-sum-hour2') * 3600 + num('time-sum-min2') * 60 + num('time-sum-sec2');
      let total = s1 + op * s2;

      const resultEl = el('time-sum-result');
      const negative = total < 0;
      total = Math.abs(total);

      const days = Math.floor(total / 86400);
      const hours = Math.floor((total % 86400) / 3600);
      const minutes = Math.floor((total % 3600) / 60);
      const seconds = total % 60;

      resultEl.innerHTML = `
        <div class="summary-payment-box">
          <div class="label">Result</div>
          <div class="value">${negative ? '&minus; ' : ''}${days} days ${hours} hours ${minutes} minutes ${seconds} seconds</div>
        </div>
        <div class="stat-row"><span>Or</span><strong>${fmt(+(total / 3600).toFixed(2))} hours</strong></div>
        <div class="stat-row"><span>Or</span><strong>${fmt(+(total / 60).toFixed(2))} minutes</strong></div>
        <div class="stat-row"><span>Or</span><strong>${fmt(total)} seconds</strong></div>
      `;
    }
    sumForm.addEventListener('submit', (e) => { e.preventDefault(); calcSum(); });
    sumForm.querySelectorAll('input, select').forEach((i) => i.addEventListener('change', calcSum));
    calcSum();
  }

  const addForm = el('time-add-form');
  if (addForm) {
    function calcAdd() {
      const dateVal = el('time-add-date').value;
      const timeVal = el('time-add-time').value || '00:00';
      const resultEl = el('time-add-result');
      if (!dateVal) {
        resultEl.innerHTML = '<p class="tool-result is-error">Enter a start date.</p>';
        return;
      }

      const start = new Date(dateVal + 'T' + timeVal + ':00');
      if (isNaN(start)) {
        resultEl.innerHTML = '<p class="tool-result is-error">Enter a valid start date and time.</p>';
        return;
      }

      const op = el('time-add-op').value === '-' ? -1 : 1;
      const ms = op * (num('time-add-day') * 86400 + num('time-add-hour') * 3600 + num('time-add-min') * 60 + num('time-add-sec')) * 1000;
      const result = new Date(start.getTime() + ms);

      const dateFmt = result.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      const timeFmt = result.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const weekdayFmt = result.toLocaleDateString('en-US', { weekday: 'long' });

      resultEl.innerHTML = `
        <div class="summary-payment-box">
          <div class="label">Result</div>
          <div class="value">${dateFmt}, ${timeFmt}</div>
        </div>
        <div class="stat-row"><span>Day of week</span><strong>${weekdayFmt}</strong></div>
      `;
    }
    addForm.addEventListener('submit', (e) => { e.preventDefault(); calcAdd(); });
    addForm.querySelectorAll('input, select').forEach((i) => i.addEventListener('change', calcAdd));
    calcAdd();
  }
})();
