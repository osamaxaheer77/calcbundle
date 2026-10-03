'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('dp-form');
  if (!form || !window.DebtEngine) return;
  const D = window.DebtEngine;
  const money = D.money;
  const COUNT = 20;

  D.mountRows(el('dp-rows'), 'dp', [
    { name: 'Auto loan', bal: 25000, min: 519, rate: 4.9 },
    { name: 'Home mortgage', bal: 250000, min: 1800, rate: 4 },
    { name: 'Credit card 1', bal: 6000, min: 150, rate: 18.99 },
    { name: 'Credit card 2', bal: 3000, min: 60, rate: 16.99 },
  ], { count: COUNT, shown: 6 });

  const showError = (msg) => { el('dp-result').innerHTML = `<p class="tool-result is-error">${msg}</p>`; el('dp-results-section').hidden = true; };

  function donut(principal, interest) {
    const total = principal + interest || 1, p1 = (principal / total) * 100, r = 15.9155;
    return '<div class="donut-wrap" style="margin-top:16px;"><svg viewBox="0 0 42 42" class="donut">' +
      `<circle cx="21" cy="21" r="${r}" fill="transparent" stroke="var(--accent)" stroke-width="4" stroke-dasharray="${p1} ${100 - p1}" stroke-dashoffset="25"></circle>` +
      `<circle cx="21" cy="21" r="${r}" fill="transparent" stroke="#10b981" stroke-width="4" stroke-dasharray="${100 - p1} ${p1}" stroke-dashoffset="${25 - p1}"></circle></svg>` +
      '<div class="donut-legend"><span class="legend-item"><span class="legend-dot" style="background:var(--accent)"></span>Principal</span>' +
      '<span class="legend-item"><span class="legend-dot" style="background:#10b981"></span>Interest</span></div></div>';
  }

  const optNum = (id) => { const raw = el(id).value.trim(); return raw === '' ? 0 : Number(raw); };

  function calculate() {
    const read = D.readRows('dp', COUNT, 'debt');
    if (read.error) return showError(read.error);
    const debts = read.debts;
    const em = optNum('dp-month'), ey = optNum('dp-year'), eo = optNum('dp-once'), eoMonth = optNum('dp-once-month');
    if ([em, ey, eo, eoMonth].some((v) => !Number.isFinite(v) || v < 0)) return showError('Enter the extra payments as numbers, 0 or more.');
    const rollover = form.querySelector('input[name="dp-fixed"]:checked').value === 'y';
    const r = D.avalanche(debts, { extraMonth: em, extraYear: ey, oneTime: eo, oneTimeMonth: Math.max(1, Math.round(eoMonth || 1)), rollover });
    const stuck = r.debts.find((c) => c.work > 0.005);
    if (stuck) return showError(`With ${money(stuck.min)} a month you cannot pay off ${stuck.name}, because that is not more than the interest it earns. Raise the payment, or add an extra monthly payment.`);
    const principal = debts.reduce((s, d) => s + d.bal, 0);
    const extras = [];
    if (em > 0) extras.push(`${money(em)} extra every month`);
    if (ey > 0) extras.push(`${money(ey)} extra once a year, in the first month of each year`);
    if (eo > 0) extras.push(`${money(eo)} one-time in month ${Math.max(1, Math.round(eoMonth || 1))}`);
    const fixedNote = rollover
      ? `Your total payment stays fixed at ${money(r.sumMin + em)} a month. When a debt is paid off, the money that was going to it is moved to the remaining debts.`
      : 'Each debt keeps its own payment, and the money from a paid-off debt is not moved to the others.';
    const stat = (l, v, c) => `<div class="stat-row"><span>${l}</span><strong${c ? ` style="color:${c}"` : ''}>${v}</strong></div>`;
    el('dp-result').innerHTML =
      `<div class="summary-payment-box"><div class="label">Debt-free in</div><div class="value">${D.monthsText(r.months)}</div><div class="label" style="margin-top:6px;">${extras.length ? extras.join('; ') : 'Paying the minimums only'}</div></div>` +
      stat('Total you will pay', money(r.totalPaid)) + stat('Total interest', money(r.totalInterest), '#10b981') + stat('Total of all balances', money(principal)) + donut(principal, r.totalInterest) +
      `<p style="font-size:12px;color:var(--text-secondary);margin:12px 0 0;">${fixedNote}</p>`;
    const sorted = r.debts.slice().sort((a, b) => a.doneMonth - b.doneMonth || b.rate - a.rate);
    let html = '<table class="schedule-table"><thead><tr><th>Debt</th><th>Payoff Length</th><th>Total Interest</th><th>Total Payments</th><th>Payment Schedule</th></tr></thead><tbody>';
    sorted.forEach((c, k) => {
      html += `<tr><td>#${k + 1}: ${c.name.replace(/</g, '&lt;')}</td><td>${D.monthsText(c.doneMonth)}</td><td>${money(c.paid - c.bal)}</td><td>${money(c.paid)}</td><td style="min-width:220px;">${D.scheduleText(c)}</td></tr>`;
    });
    el('dp-table-wrap').innerHTML = html + '</tbody></table>';
    el('dp-results-section').hidden = false;
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  form.querySelectorAll('input[name="dp-fixed"]').forEach((n) => n.addEventListener('change', calculate));
  calculate();
})();
