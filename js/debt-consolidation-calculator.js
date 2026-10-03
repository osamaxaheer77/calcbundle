'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('dc-form');
  if (!form || !window.DebtEngine) return;
  const D = window.DebtEngine;
  const money = D.money;
  const COUNT = 20;

  D.mountRows(el('dc-rows'), 'dc', [
    { name: 'Credit card 1', bal: 10000, min: 260, rate: 17.99 },
    { name: 'Credit card 2', bal: 7500, min: 190, rate: 19.99 },
    { name: 'High interest debt', bal: 6500, min: 180, rate: 18.99 },
  ], { count: COUNT, shown: 6 });

  const showError = (msg) => { el('dc-result').innerHTML = `<p class="tool-result is-error">${msg}</p>`; el('dc-results-section').hidden = true; };
  const num = (id) => { const raw = el(id).value.trim(); if (raw === '') return NaN; const v = Number(raw); return Number.isFinite(v) ? v : NaN; };
  // Rates are shown with up to two decimals and no trailing zeros, such as 12.6% or 18.92%.
  const pct = (v) => `${Math.round(v * 100) / 100}%`;

  function calculate() {
    const read = D.readRows('dc', COUNT, 'debt');
    if (read.error) return showError(read.error);
    const debts = read.debts;
    const loan = num('dc-loan'), rate = num('dc-rate');
    const years = num('dc-years'), months = num('dc-months');
    const costRaw = num('dc-cost'), costPct = el('dc-cost-unit').value === 'p';
    if (!Number.isFinite(loan) || loan <= 0) return showError('Enter the consolidation loan amount.');
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) return showError('Enter a consolidation loan rate between 0% and 100%.');
    if (!Number.isFinite(years) || !Number.isFinite(months) || years < 0 || months < 0) return showError('Enter the loan term in years and months.');
    const n = Math.round(years * 12 + months);
    if (n < 1 || n > 600) return showError('Enter a loan term between 1 month and 50 years.');
    if (!Number.isFinite(costRaw) || costRaw < 0 || (costPct && costRaw > 100)) return showError('Enter the loan fee as a percentage (0 to 100) or a dollar amount.');
    const fee = costPct ? (loan * costRaw) / 100 : costRaw;
    if (fee >= loan) return showError('The loan fee must be less than the loan amount.');

    const balance = debts.reduce((s, d) => s + d.bal, 0);
    const monthly = debts.reduce((s, d) => s + d.min, 0);
    // Existing debts: keep paying the same total each month, highest rate first.
    const ex = D.avalanche(debts, { budget: monthly });
    const stuck = ex.debts.find((c) => c.work > 0.005);
    if (stuck) return showError(`Your debts cannot be paid off at ${money(monthly)} a month, because the interest is as large as the payments. Raise the payments.`);
    const flows = [];
    for (let m = 1; m <= ex.months; m++) flows.push(ex.debts.reduce((s, c) => s + (c.pays[m] || 0), 0));
    const exApr = D.monthlyIrr(balance, flows) * 1200;

    const i = rate / 1200;
    const pay = i === 0 ? loan / n : (loan * i) / (1 - Math.pow(1 + i, -n));
    const total = pay * n;
    const cash = loan - fee;
    const loanApr = fee > 0 ? D.monthlyIrr(cash, new Array(n).fill(pay)) * 1200 : rate;
    const upfront = cash - balance;
    const cheaper = loanApr < exApr - 1e-9;

    const verdict = cheaper
      ? `The APR of your consolidation loan${fee > 0 ? ', with fee considered,' : ''} is ${pct(loanApr)}, which is lower than the ${pct(exApr)} APR of your current debts. So the financial cost of the consolidation loan is lower, and it should save you money.`
      : `The APR of your consolidation loan${fee > 0 ? ', with fee considered,' : ''} is ${pct(loanApr)}, which is not lower than the ${pct(exApr)} APR of your current debts. So this consolidation loan is more expensive than your existing debts, and it is not recommended.`;
    let cashText;
    if (loan > balance + 1e-9 && fee === 0) cashText = `The loan amount of ${money(loan)} is more than your remaining debt balance of ${money(balance)}, so you can keep the remaining ${money(loan - balance)} after consolidation.`;
    else if (fee > 0 && cash >= balance - 1e-9) cashText = `After the loan fee of ${money(fee)}, you get ${money(cash)} to pay off your debt balance of ${money(balance)}${cash > balance + 1e-9 ? `, and you can keep the remaining ${money(cash - balance)}` : ''}.`;
    else if (fee > 0) cashText = `After the loan fee of ${money(fee)}, you get ${money(cash)} to pay off your debt balance of ${money(balance)}, so you will need an additional ${money(balance - cash)} to consolidate.`;
    else if (loan < balance - 1e-9) cashText = `The loan amount of ${money(loan)} is less than your debt balance of ${money(balance)}, so you will need an additional ${money(balance - loan)} to consolidate.`;
    else cashText = `The loan amount matches your debt balance of ${money(balance)}.`;

    const row = (label, a, b, bold) => `<tr${bold ? ' style="font-weight:700;"' : ''}><td>${label}</td><td>${a}</td><td>${b}</td></tr>`;
    el('dc-result').innerHTML =
      `<div class="summary-payment-box"><div class="label">${cheaper ? 'Consolidating looks cheaper' : 'Consolidating costs more'}</div><div class="value">${pct(loanApr)} vs ${pct(exApr)}</div><div class="label" style="margin-top:6px;">APR of the loan against your current debts</div></div>` +
      `<p style="font-size:13px;line-height:1.5;margin:14px 0 0;">${verdict}</p>` +
      `<p style="font-size:13px;line-height:1.5;margin:10px 0 0;">${cashText}</p>` +
      '<div class="schedule-table-wrap" style="max-height:none;margin-top:14px;"><table class="schedule-table"><thead><tr><th></th><th>Existing Debts</th><th>Consolidation Loan</th></tr></thead><tbody>' +
      row('APR', pct(exApr), pct(loanApr), true) +
      row('Monthly pay', money(monthly), money(pay)) +
      row('Time to pay off', D.monthsText(ex.months), D.monthsText(n)) +
      row('Loan fee / points', '$0.00', money(fee)) +
      row('Upfront cash flow', '$0.00', money(upfront)) +
      row('Total payments', money(ex.totalPaid), money(total)) +
      row('Total interest', money(ex.totalInterest), money(total - loan)) +
      `</tbody></table></div><p style="font-size:12px;color:var(--text-secondary);margin:12px 0 0;">The existing debts are worked out assuming you keep paying ${money(monthly)} a month, highest interest rate first, until everything is paid. The loan fee is not included in the consolidation loan interest.</p>`;
    el('dc-results-section').hidden = true;
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  calculate();
})();
