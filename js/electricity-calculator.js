'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('elec-form');
  if (!form) return;

  const DAYS_PER_YEAR = 365.25;
  const POWER_TO_KW = { watt: 0.001, kilowatt: 1 };

  const HOURS_PER_YEAR = {
    minperday: (v) => (v / 60) * DAYS_PER_YEAR,
    hrperday: (v) => v * DAYS_PER_YEAR,
    hrperweek: (v) => v * (DAYS_PER_YEAR / 7),
    hrpermonth: (v) => v * 12,
    dayperweek: (v) => v * 24 * (DAYS_PER_YEAR / 7),
    daypermonth: (v) => v * 24 * 12,
    dayperyear: (v) => v * 24,
    monthperyear: (v) => v * (DAYS_PER_YEAR / 12) * 24
  };

  const fmt = (n) => n.toLocaleString('en-US', { maximumFractionDigits: 2 });
  const money = (n) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  function calculate() {
    const power = parseFloat(el('elec-power').value);
    const powerKw = power * POWER_TO_KW[el('elec-power-unit').value];
    const capacity = parseFloat(el('elec-capacity').value);
    const usage = parseFloat(el('elec-usage').value);
    const usageUnit = el('elec-usage-unit').value;
    const price = parseFloat(el('elec-price').value);
    const resultEl = el('elec-result');

    if ([power, capacity, usage, price].some((v) => isNaN(v) || v < 0)) {
      resultEl.innerHTML = '<p class="tool-result is-error">Enter valid, non-negative values for all fields.</p>';
      return;
    }

    const hoursPerYear = HOURS_PER_YEAR[usageUnit](usage);
    const effectiveKw = powerKw * (capacity / 100);
    const kwhPerYear = effectiveKw * hoursPerYear;
    const kwhPerDay = kwhPerYear / DAYS_PER_YEAR;
    const kwhPerWeek = kwhPerDay * 7;
    const kwhPerMonth = kwhPerYear / 12;

    resultEl.innerHTML = `
      <div class="stat-row"><span>Per day</span><strong>${fmt(kwhPerDay)} kWh &mdash; ${money(kwhPerDay * price)}</strong></div>
      <div class="stat-row"><span>Per week</span><strong>${fmt(kwhPerWeek)} kWh &mdash; ${money(kwhPerWeek * price)}</strong></div>
      <div class="stat-row"><span>Per month</span><strong>${fmt(kwhPerMonth)} kWh &mdash; ${money(kwhPerMonth * price)}</strong></div>
      <div class="summary-payment-box" style="margin-top:12px;">
        <div class="label">Per year</div>
        <div class="value">${fmt(kwhPerYear)} kWh &mdash; ${money(kwhPerYear * price)}</div>
      </div>
    `;
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  form.querySelectorAll('input, select').forEach((i) => i.addEventListener('input', calculate));
  calculate();
})();
