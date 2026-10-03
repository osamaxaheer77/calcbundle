'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('cp-form');
  if (!form || !window.DebtEngine) return;
  const D = window.DebtEngine;
  const money = D.money;
  const COUNT = 20;

  D.mountRows(el('cp-rows'), 'cp', [
    { name: 'Card 1', bal: 4600, min: 100, rate: 18.99 },
    { name: 'Card 2', bal: 3900, min: 90, rate: 19.99 },
    { name: 'Card 3', bal: 6000, min: 120, rate: 15.99 },
  ], { count: COUNT, shown: 6, nameLabel: 'Credit card', balLabel: 'Balance ($)', payLabel: 'Minimum payment ($)', rateLabel: 'Interest rate (%)' });

  const showError = (msg) => { el('cp-result').innerHTML = `<p class="tool-result is-error">${msg}</p>`; el('cp-results-section').hidden = true; };

  function donut(principal, interest) {
    const total = principal + interest || 1, p1 = (principal / total) * 100, r = 15.9155;
    return '<div class="donut-wrap" style="margin-top:16px;"><svg viewBox="0 0 42 42" class="donut">' +
      `<circle cx="21" cy="21" r="${r}" fill="transparent" stroke="var(--accent)" stroke-width="4" stroke-dasharray="${p1} ${100 - p1}" stroke-dashoffset="25"></circle>` +
      `<circle cx="21" cy="21" r="${r}" fill="transparent" stroke="#10b981" stroke-width="4" stroke-dasharray="${100 - p1} ${p1}" stroke-dashoffset="${25 - p1}"></circle></svg>` +
      '<div class="donut-legend"><span class="legend-item"><span class="legend-dot" style="background:var(--accent)"></span>Principal</span>' +
      '<span class="legend-item"><span class="legend-dot" style="background:#10b981"></span>Interest</span></div></div>';
  }

  function calculate() {
    const budget = Number(el('cp-budget').value.trim());
    if (el('cp-budget').value.trim() === '' || !Number.isFinite(budget) || budget <= 0) return showError('Enter the monthly budget you can set aside for your cards.');
    const read = D.readRows('cp', COUNT, 'credit card');
    if (read.error) return showError(read.error);
    const debts = read.debts;
    const sumMin = debts.reduce((s, d) => s + d.min, 0);
    if (budget < sumMin - 1e-9) {
      el('cp-result').innerHTML = `<p class="tool-result is-error"><strong>Warning:</strong> your monthly budget of ${money(budget)} is less than the ${money(sumMin)} total of the minimum payments. Missing minimums usually brings late fees, penalty rates and damage to your credit. Try to find the extra money, ask for help, or look at a balance transfer or a personal loan. If you are unsure, speak to a financial adviser.</p>`;
      el('cp-results-section').hidden = true;
      return;
    }
    const r = D.avalanche(debts, { budget });
    if (r.debts.some((c) => c.work > 0.005)) return showError('At this budget the cards are not paid off within 100 years, because the interest is as large as the payments. Raise your budget.');
    const principal = debts.reduce((s, d) => s + d.bal, 0);
    const stat = (l, v, c) => `<div class="stat-row"><span>${l}</span><strong${c ? ` style="color:${c}"` : ''}>${v}</strong></div>`;
    el('cp-result').innerHTML =
      `<div class="summary-payment-box"><div class="label">Paid off in</div><div class="value">${D.monthsText(r.months)}</div><div class="label" style="margin-top:6px;">Paying ${money(budget)} every month</div></div>` +
      stat('Total you will pay', money(r.totalPaid)) + stat('Total interest', money(r.totalInterest), '#10b981') + stat('Total balance now', money(principal)) + donut(principal, r.totalInterest);
    const sorted = r.debts.slice().sort((a, b) => a.doneMonth - b.doneMonth || b.rate - a.rate);
    let html = '<table class="schedule-table"><thead><tr><th>Credit Card</th><th>Payoff Length</th><th>Total Interest</th><th>Total Payments</th><th>Payment Schedule</th></tr></thead><tbody>';
    sorted.forEach((c, k) => {
      html += `<tr><td>#${k + 1}: ${c.name.replace(/</g, '&lt;')}</td><td>${D.monthsText(c.doneMonth)}</td><td>${money(c.paid - c.bal)}</td><td>${money(c.paid)}</td><td style="min-width:220px;">${D.scheduleText(c)}</td></tr>`;
    });
    el('cp-table-wrap').innerHTML = html + '</tbody></table>';
    el('cp-results-section').hidden = false;
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  calculate();
})();
