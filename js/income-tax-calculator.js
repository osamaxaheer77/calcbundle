'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('it-form');
  if (!form || !window.TaxEngine) return;

  const GREEN = '#10b981';
  const RED = '#dc2626';
  const money = (v) => (v < -0.5 ? '-$' : '$') + Math.abs(Math.round(v)).toLocaleString('en-US');
  const pct = (v) => (Math.round(v * 1000) / 10) + '%';

  function num(id) {
    const raw = el(id).value.trim();
    if (raw === '') return 0;
    const v = parseFloat(raw);
    return Number.isFinite(v) ? v : NaN;
  }

  const MAY_BE_NEGATIVE = ['it-passive', 'it-stgain', 'it-ltgain', 'it-other-income'];
  const ALL_NUMBERS = [
    'it-young', 'it-other-deps', 'it-age1', 'it-wages1', 'it-withheld1', 'it-statewh1', 'it-business1', 'it-estimated1', 'it-medicare1',
    'it-age2', 'it-wages2', 'it-withheld2', 'it-statewh2', 'it-business2', 'it-estimated2', 'it-medicare2',
    'it-ss', 'it-interest', 'it-ord-div', 'it-qual-div', 'it-passive', 'it-stgain', 'it-ltgain', 'it-other-income', 'it-state-rate',
    'it-tips', 'it-overtime', 'it-car', 'it-ira', 'it-realestate', 'it-mortgage', 'it-charity', 'it-student', 'it-childcare',
    'it-tuition1', 'it-tuition2', 'it-tuition3', 'it-tuition4', 'it-other-ded',
  ];

  function showError(msg) {
    el('it-result').innerHTML = `<p class="tool-result is-error">${msg}</p>`;
  }

  const statRow = (label, value, color) =>
    `<div class="stat-row"><span>${label}</span><strong${color ? ` style="color:${color}"` : ''}>${value}</strong></div>`;
  const note = (text) => `<p style="font-size:12px;color:var(--text-secondary);margin:12px 0 0;">${text}</p>`;
  const heading = (text) => `<h4 style="margin:18px 0 4px;font-size:13px;">${text}</h4>`;

  function donut(taxShare) {
    const r = 15.9155;
    const p = Math.max(0, Math.min(100, taxShare));
    return `<div class="donut-wrap" style="margin-top:16px;"><svg viewBox="0 0 42 42" class="donut">` +
      `<circle cx="21" cy="21" r="${r}" fill="transparent" stroke="${GREEN}" stroke-width="4"></circle>` +
      `<circle cx="21" cy="21" r="${r}" fill="transparent" stroke="${RED}" stroke-width="4" stroke-dasharray="${p} ${100 - p}" stroke-dashoffset="25"></circle></svg>` +
      `<div class="donut-legend"><span class="legend-item"><span class="legend-dot" style="background:${RED}"></span>Federal tax (${Math.round(p)}%)</span>` +
      `<span class="legend-item"><span class="legend-dot" style="background:${GREEN}"></span>Income kept (${Math.round(100 - p)}%)</span></div></div>`;
  }

  function personInput(n) {
    return {
      age: num('it-age' + n), wages: num('it-wages' + n), withheld: num('it-withheld' + n), stateWithheld: num('it-statewh' + n),
      business: el('it-has-business').checked ? num('it-business' + n) : 0,
      estimated: el('it-has-business').checked ? num('it-estimated' + n) : 0,
      medicareWages: num('it-medicare' + n),
    };
  }

  function calculate() {
    const bad = ALL_NUMBERS.filter((id) => !Number.isFinite(num(id)) || (!MAY_BE_NEGATIVE.includes(id) && num(id) < 0));
    if (bad.length) return showError('Enter each amount as a number (0 or more). Capital gains, passive and other income can be negative.');
    const status = el('it-status').value;
    const year = parseInt(el('it-year').value, 10);
    const joint = status === 'mfj';

    const input = {
      year, status, youngDeps: num('it-young'), otherDeps: num('it-other-deps'),
      p1: personInput(1), p2: joint ? personInput(2) : {},
      ssIncome: num('it-ss'), interest: num('it-interest'), ordDividends: num('it-ord-div'), qualDividends: num('it-qual-div'),
      passive: num('it-passive'), stGain: num('it-stgain'), ltGain: num('it-ltgain'), otherIncome: num('it-other-income'), stateRate: num('it-state-rate'),
      ded: {
        tips: num('it-tips'), overtime: num('it-overtime'), carLoan: num('it-car'), ira: num('it-ira'), realEstate: num('it-realestate'),
        mortgage: num('it-mortgage'), charity: num('it-charity'), studentLoan: num('it-student'), childCare: num('it-childcare'),
        tuition: [num('it-tuition1'), num('it-tuition2'), num('it-tuition3'), num('it-tuition4')], other: num('it-other-ded'),
      },
    };
    const r = window.TaxEngine.compute(input);
    const owed = r.balance < 0;
    const amount = Math.abs(r.balance);
    const effective = r.totalIncome > 0 ? Math.max(0, r.totalTax - r.credits.refundable) / r.totalIncome : 0;
    const d = r.detail;

    const creditRows = [];
    if (r.credits.ctc > 0) creditRows.push(statRow('Child and other dependent credits', money(r.credits.ctc)));
    if (r.credits.care > 0) creditRows.push(statRow('Child and dependent care credit', money(r.credits.care)));
    if (r.credits.education > 0) creditRows.push(statRow('Education credit', money(r.credits.education)));
    if (r.credits.eitc > 0) creditRows.push(statRow('Earned income credit', money(r.credits.eitc)));

    const specials = [];
    if (d.tipsDed > 0) specials.push(statRow('Tips deduction', '-' + money(d.tipsDed)));
    if (d.otDed > 0) specials.push(statRow('Overtime deduction', '-' + money(d.otDed)));
    if (d.carDed > 0) specials.push(statRow('Car loan interest deduction', '-' + money(d.carDed)));
    if (d.seniorDed > 0) specials.push(statRow('Senior deduction (65 and older)', '-' + money(d.seniorDed)));

    el('it-result').innerHTML =
      `<div class="summary-payment-box"><div class="label">${owed ? 'Estimated tax you owe' : 'Estimated refund'} for ${year}</div><div class="value">${money(amount)}</div>` +
      `<div class="label" style="margin-top:6px;">Marginal rate ${pct(r.marginal)}, effective rate ${pct(effective)}</div></div>` +
      statRow('Total income', money(r.totalIncome + (d.ss - d.ssTaxable))) +
      (d.ss > 0 ? statRow('Taxable Social Security', money(d.ssTaxable)) : '') +
      (r.adjustments > 0 ? statRow('Adjustments to income', '-' + money(r.adjustments)) : '') +
      statRow('Adjusted gross income', money(r.agi)) +
      statRow(r.usedItemized ? 'Itemized deductions' : 'Standard deduction', '-' + money(r.deduction)) +
      specials.join('') +
      (r.qbi > 0 ? statRow('Qualified business income deduction', '-' + money(r.qbi)) : '') +
      statRow('Taxable income', money(r.taxable)) +
      heading('Tax') +
      statRow('Regular income tax', money(r.regular)) +
      (r.amt > 0 ? statRow('Alternative minimum tax', money(r.amt)) : '') +
      (r.seTax > 0 ? statRow('Self-employment tax', money(r.seTax)) : '') +
      (r.addlMedicare > 0 ? statRow('Additional Medicare tax', money(r.addlMedicare)) : '') +
      (r.niit > 0 ? statRow('Net investment income tax', money(r.niit)) : '') +
      (creditRows.length ? heading('Credits') + creditRows.join('') + statRow('Total credits', '-' + money(r.creditsTotal), GREEN) : '') +
      heading('Bottom line') +
      statRow('Total tax after credits', money(r.totalTax - r.credits.refundable)) +
      statRow('Tax already paid', money(r.payments)) +
      statRow(owed ? 'Amount you owe' : 'Refund', money(amount), owed ? RED : GREEN) +
      (r.totalTax - r.credits.refundable > 0 && r.totalIncome > 0 ? donut(((r.totalTax - r.credits.refundable) / (r.totalIncome + (d.ss - d.ssTaxable))) * 100) : '') +
      note('This is an estimate of your federal return. It does not include state or local income tax, and it assumes your inputs and eligibility are correct. See the notes below for what is and is not modeled.');
  }

  function applyVisibility() {
    const joint = el('it-status').value === 'mfj';
    const biz = el('it-has-business').checked;
    form.querySelectorAll('[data-joint]').forEach((n) => { n.hidden = !joint; });
    form.querySelectorAll('[data-business]').forEach((n) => { n.hidden = !biz; });
    el('it-person1-title').textContent = joint ? 'Person 1' : 'You';
  }

  ['it-status', 'it-has-business'].forEach((id) => el(id).addEventListener('change', () => { applyVisibility(); calculate(); }));
  el('it-year').addEventListener('change', calculate);
  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  applyVisibility();
  calculate();
})();
