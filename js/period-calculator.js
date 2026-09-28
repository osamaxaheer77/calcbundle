'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('period-form');
  if (!form) return;

  const DAY = 24 * 60 * 60 * 1000;

  function addDays(date, days) {
    return new Date(date.getTime() + days * DAY);
  }

  function fmtDate(d) {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  function fmtDateShort(d) {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function calculate() {
    const lastVal = el('period-lastperiod').value;
    const resultEl = el('period-result');
    if (!lastVal) {
      resultEl.innerHTML = '<p class="tool-result is-error">Enter the first day of your last period.</p>';
      return;
    }
    const lastPeriod = new Date(lastVal + 'T00:00:00');
    const periodLength = parseInt(el('period-length').value, 10);
    const cycle = parseInt(el('period-cycle').value, 10);

    const rows = [];
    let periodStart = lastPeriod;
    for (let i = 0; i < 6; i++) {
      const periodEnd = addDays(periodStart, periodLength - 1);
      const nextPeriod = addDays(periodStart, cycle);
      const ovulationDate = addDays(nextPeriod, -14);
      const ovulationWindowStart = addDays(ovulationDate, -2);
      const ovulationWindowEnd = addDays(ovulationDate, 2);
      rows.push({ periodStart, periodEnd, ovulationWindowStart, ovulationWindowEnd });
      periodStart = nextPeriod;
    }

    const first = rows[0];

    resultEl.innerHTML = `
      <div class="summary-payment-box">
        <div class="label">Next Period</div>
        <div class="value">${fmtDate(first.periodStart)} &ndash; ${fmtDate(first.periodEnd)}</div>
      </div>
      <div class="stat-row"><span>Most Probable Ovulation Days</span><strong>${fmtDateShort(first.ovulationWindowStart)} &ndash; ${fmtDateShort(first.ovulationWindowEnd)}</strong></div>
    `;

    let tableHtml = '<table class="schedule-table"><thead><tr><th>Period</th><th>Most Probable Ovulation Days</th></tr></thead><tbody>';
    rows.forEach((r) => {
      tableHtml += `<tr><td>${fmtDateShort(r.periodStart)} &ndash; ${fmtDateShort(r.periodEnd)}</td><td>${fmtDateShort(r.ovulationWindowStart)} &ndash; ${fmtDateShort(r.ovulationWindowEnd)}</td></tr>`;
    });
    tableHtml += '</tbody></table>';
    el('period-table-wrap').innerHTML = tableHtml;
    el('period-results-section').hidden = false;
  }

  el('period-lastperiod').addEventListener('change', calculate);
  el('period-length').addEventListener('change', calculate);
  el('period-cycle').addEventListener('change', calculate);
  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });

  calculate();
})();
