'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('ov-form');
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
    const lmpVal = el('ov-lastperiod').value;
    if (!lmpVal) {
      el('ov-result').innerHTML = '<p class="tool-result is-error">Enter the first day of your last period.</p>';
      return;
    }
    const lmp = new Date(lmpVal + 'T00:00:00');
    const cycle = parseInt(el('ov-cycle').value, 10);

    const rows = [];
    let periodStart = lmp;
    for (let i = 0; i < 6; i++) {
      const nextPeriod = addDays(periodStart, cycle);
      const ovulationDate = addDays(nextPeriod, -14);
      const ovulationWindowStart = addDays(ovulationDate, -2);
      const ovulationWindowEnd = addDays(ovulationDate, 2);
      const intercourseStart = addDays(ovulationDate, -5);
      const pregnancyTest = addDays(nextPeriod, -5);
      const dueDate = addDays(periodStart, 280);
      rows.push({ periodStart, nextPeriod, ovulationDate, ovulationWindowStart, ovulationWindowEnd, intercourseStart, pregnancyTest, dueDate });
      periodStart = nextPeriod;
    }

    const first = rows[0];

    el('ov-result').innerHTML = `
      <div class="summary-payment-box">
        <div class="label">Most Probable Ovulation Date</div>
        <div class="value">${fmtDate(first.ovulationDate)}</div>
      </div>
      <div class="stat-row"><span>Ovulation Window</span><strong>${fmtDateShort(first.ovulationWindowStart)} &ndash; ${fmtDateShort(first.ovulationWindowEnd)}</strong></div>
      <div class="stat-row"><span>Intercourse Window for Pregnancy</span><strong>${fmtDateShort(first.intercourseStart)} &ndash; ${fmtDateShort(first.ovulationWindowEnd)}</strong></div>
      <div class="stat-row"><span>Pregnancy Test</span><strong>${fmtDate(first.pregnancyTest)}</strong></div>
      <div class="stat-row"><span>Next Period Start</span><strong>${fmtDate(first.nextPeriod)}</strong></div>
      <div class="stat-row"><span>Due Date If Pregnant</span><strong>${fmtDate(first.dueDate)}</strong></div>
    `;

    let tableHtml = '<table class="schedule-table"><thead><tr><th>Period Start</th><th>Ovulation Window</th><th>Due Date</th></tr></thead><tbody>';
    rows.forEach((r) => {
      tableHtml += `<tr><td>${fmtDate(r.periodStart)}</td><td>${fmtDateShort(r.ovulationWindowStart)} &ndash; ${fmtDateShort(r.ovulationWindowEnd)}</td><td>${fmtDate(r.dueDate)}</td></tr>`;
    });
    tableHtml += '</tbody></table>';
    el('ov-table-wrap').innerHTML = tableHtml;
    el('ov-results-section').hidden = false;
  }

  el('ov-lastperiod').addEventListener('change', calculate);
  el('ov-cycle').addEventListener('change', calculate);
  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });

  calculate();
})();
