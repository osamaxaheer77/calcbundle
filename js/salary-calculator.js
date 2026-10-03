'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('sal-form');
  if (!form) return;

  const money = (v) => '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function num(id) {
    const v = parseFloat(el(id).value);
    return Number.isFinite(v) ? v : NaN;
  }

  function showError(msg) {
    el('sal-result').innerHTML = `<p class="tool-result is-error">${msg}</p>`;
  }

  // Pay periods per year for every unit except hourly and daily, which depend on the work schedule.
  const PERIODS = { weekly: 52, biweekly: 26, semimonthly: 24, monthly: 12, quarterly: 4, annual: 1 };
  const WEEKDAYS_PER_YEAR = 260;

  function calculate() {
    const amount = num('sal-amount');
    const unit = el('sal-unit').value;
    const hours = num('sal-hours');
    const days = num('sal-days');
    const holidays = num('sal-holidays');
    const vacation = num('sal-vacation');

    if (!Number.isFinite(amount) || amount < 0) return showError('Enter a salary amount (0 or more).');
    if (!Number.isFinite(hours) || hours <= 0 || hours > 168) return showError('Enter hours per week between 1 and 168.');
    if (!Number.isFinite(days) || days < 1 || days > 7) return showError('Enter days per week between 1 and 7.');
    if (hours / days > 24) return showError('That schedule has more than 24 hours in a day. Check your hours and days.');
    if (!Number.isFinite(holidays) || holidays < 0 || !Number.isFinite(vacation) || vacation < 0) return showError('Holidays and vacation days cannot be negative.');
    const off = holidays + vacation;
    if (off >= WEEKDAYS_PER_YEAR) return showError('Holidays and vacation days must add up to fewer than 260 days.');

    const keep = (WEEKDAYS_PER_YEAR - off) / WEEKDAYS_PER_YEAR;
    let unAnnual, adjAnnual;
    if (unit === 'hourly') { unAnnual = amount * hours * 52; adjAnnual = unAnnual * keep; }
    else if (unit === 'daily') { unAnnual = amount * days * 52; adjAnnual = unAnnual * keep; }
    else { adjAnnual = amount * PERIODS[unit]; unAnnual = adjAnnual / keep; }

    const rows = [
      ['Hourly', hours * 52], ['Daily', days * 52], ['Weekly', 52], ['Bi-weekly', 26],
      ['Semi-monthly', 24], ['Monthly', 12], ['Quarterly', 4], ['Annual', 1],
    ];
    let table = '<table class="schedule-table"><thead><tr><th>Pay Period</th><th>Unadjusted</th><th>Adjusted</th></tr></thead><tbody>';
    rows.forEach(([label, divisor]) => {
      table += `<tr><td>${label}</td><td>${money(unAnnual / divisor)}</td><td>${money(adjAnnual / divisor)}</td></tr>`;
    });
    table += '</tbody></table>';

    el('sal-result').innerHTML =
      `<div class="summary-payment-box"><div class="label">Annual salary (adjusted)</div><div class="value">${money(adjAnnual)}</div>` +
      `<div class="label" style="margin-top:6px;">${money(unAnnual)} unadjusted, before ${off} day${off === 1 ? '' : 's'} off</div></div>` +
      `<div class="schedule-table-wrap" style="max-height:none;">${table}</div>` +
      `<p style="font-size:12px;color:var(--text-secondary);margin:12px 0 0;">Hourly and daily amounts are treated as unadjusted pay. Every other period is treated as already adjusted for ${off} day${off === 1 ? '' : 's'} of holidays and vacation. The calculation assumes 52 weeks, or ${WEEKDAYS_PER_YEAR} weekdays, a year.</p>`;
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  calculate();
})();
