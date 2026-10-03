'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  if (!el('sl1-form')) return;

  const GREEN = '#10b981';
  const money = (v) => (v < -0.005 ? '-$' : '$') + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Empty means "not given". Anything else must be a valid number.
  function read(id) {
    const raw = el(id).value.trim();
    if (raw === '') return null;
    const v = Number(raw);
    return Number.isFinite(v) ? v : NaN;
  }

  const stat = (l, v, c) => `<div class="stat-row"><span>${l}</span><strong${c ? ` style="color:${c}"` : ''}>${v}</strong></div>`;
  const note = (t) => `<p style="font-size:12px;color:var(--text-secondary);margin:12px 0 0;">${t}</p>`;
  const error = (id, msg) => { el(id).innerHTML = `<p class="tool-result is-error">${msg}</p>`; };

  function donut(principal, interest) {
    const total = principal + interest || 1;
    const p1 = (principal / total) * 100, p2 = 100 - p1, r = 15.9155;
    return '<div class="donut-wrap" style="margin-top:16px;"><svg viewBox="0 0 42 42" class="donut">' +
      `<circle cx="21" cy="21" r="${r}" fill="transparent" stroke="var(--accent)" stroke-width="4" stroke-dasharray="${p1} ${100 - p1}" stroke-dashoffset="25"></circle>` +
      `<circle cx="21" cy="21" r="${r}" fill="transparent" stroke="${GREEN}" stroke-width="4" stroke-dasharray="${p2} ${100 - p2}" stroke-dashoffset="${25 - p1}"></circle></svg>` +
      '<div class="donut-legend"><span class="legend-item"><span class="legend-dot" style="background:var(--accent)"></span>Principal</span>' +
      `<span class="legend-item"><span class="legend-dot" style="background:${GREEN}"></span>Interest</span></div></div>`;
  }

  const monthsText = (n) => {
    const y = Math.floor(n / 12), m = n - y * 12;
    const parts = [];
    if (y) parts.push(`${y} ${y === 1 ? 'year' : 'years'}`);
    if (m || !y) parts.push(`${m} ${m === 1 ? 'month' : 'months'}`);
    return parts.join(' and ');
  };

  const pmt = (p, i, n) => (i === 0 ? p / n : (p * i) / (1 - Math.pow(1 + i, -n)));

  // Month-by-month payoff. `oneTime` goes in with the first payment, `yearly` with every twelfth.
  function payoff(balance, i, pay, monthly, yearly, oneTime) {
    let bal = balance, total = 0, interestTotal = 0, n = 0;
    while (bal > 0.005 && n < 1200) {
      n++;
      const interest = bal * i;
      let p = pay + monthly + (n === 1 ? oneTime : 0) + (n % 12 === 0 ? yearly : 0);
      if (bal + interest <= p) p = bal + interest;
      bal = bal + interest - p;
      total += p; interestTotal += interest;
    }
    return { months: n, total, interest: interestTotal };
  }

  // ---------- 1. Simple calculator: any three of four ----------
  function simple() {
    const vals = { bal: read('sl1-balance'), years: read('sl1-term'), rate: read('sl1-rate'), pay: read('sl1-pay') };
    if (Object.values(vals).some((v) => Number.isNaN(v))) return error('sl1-result', 'Enter numbers only in the boxes you fill in.');
    const given = Object.values(vals).filter((v) => v !== null).length;
    if (given < 3) return error('sl1-result', 'Fill in any three of the four boxes, and leave the one you want to find empty.');
    if ((vals.bal !== null && vals.bal <= 0) || (vals.years !== null && vals.years <= 0) || (vals.pay !== null && vals.pay <= 0)) return error('sl1-result', 'Balance, term and payment must be more than 0.');
    if (vals.rate !== null && (vals.rate < 0 || vals.rate > 100)) return error('sl1-result', 'Enter an interest rate between 0% and 100%.');
    if (vals.years !== null && vals.years > 60) return error('sl1-result', 'Enter a term of 60 years or less.');

    const allFour = given === 4;
    const target = allFour ? 'pay' : Object.keys(vals).find((k) => vals[k] === null);
    let { bal, years, rate, pay } = vals;
    let n, i, title, value, extra = '';
    if (target === 'pay') {
      n = Math.round(years * 12); i = rate / 1200;
      pay = pmt(bal, i, n);
      title = 'Repayment'; value = `${money(pay)}/month`;
      if (allFour) extra = note('You filled in all four boxes, so the payment was worked out again from the balance, term and rate. Clear one box to solve for it instead.');
    } else if (target === 'years') {
      i = rate / 1200;
      if (pay <= bal * i + 1e-9) return error('sl1-result', `The loan won’t be paid off with a payment of ${money(pay)} a month. It does not cover the interest.`);
      const r = payoff(bal, i, pay, 0, 0, 0);
      n = r.months; title = 'Remaining term'; value = monthsText(n);
    } else if (target === 'rate') {
      n = Math.round(years * 12);
      if (pay * n < bal - 1e-9) return error('sl1-result', 'Those payments add up to less than the balance, which would need a negative rate. Try a larger payment.');
      const pv = (m) => (m === 0 ? pay * n : (pay * (1 - Math.pow(1 + m, -n))) / m);
      let lo = 0, hi = 1;
      for (let k = 0; k < 300; k++) { const m = (lo + hi) / 2; if (pv(m) > bal) lo = m; else hi = m; }
      i = (lo + hi) / 2; rate = i * 1200;
      title = 'Interest rate'; value = `${rate.toFixed(2)}%`;
    } else {
      n = Math.round(years * 12); i = rate / 1200;
      bal = i === 0 ? pay * n : (pay * (1 - Math.pow(1 + i, -n))) / i;
      title = 'Loan balance'; value = money(bal);
    }
    let total, interest;
    if (target === 'years') { const r = payoff(bal, i, pay, 0, 0, 0); total = r.total; interest = r.interest; } else { total = pay * n; interest = total - bal; }
    el('sl1-result').innerHTML =
      `<div class="summary-payment-box"><div class="label">${title}</div><div class="value">${value}</div></div>` +
      stat('Total interest', money(interest), GREEN) + stat('Total payments', money(total)) + donut(bal, interest) + extra;
  }

  // ---------- 2. Repayment options ----------
  function repayment() {
    const bal = read('sl2-balance'), pay = read('sl2-pay'), rate = read('sl2-rate');
    const option = document.querySelector('input[name="sl2-option"]:checked').value;
    const em = read('sl2-month') || 0, ey = read('sl2-year') || 0, eo = read('sl2-once') || 0;
    if ([bal, pay, rate].some((v) => v === null || Number.isNaN(v)) || bal <= 0 || pay <= 0) return error('sl2-result', 'Enter the loan balance, monthly payment and interest rate.');
    if (rate < 0 || rate > 100) return error('sl2-result', 'Enter an interest rate between 0% and 100%.');
    if ([em, ey, eo].some((v) => Number.isNaN(v) || v < 0)) return error('sl2-result', 'Enter the extra payments as numbers, 0 or more.');
    const i = rate / 1200;
    if (pay <= bal * i + 1e-9) return error('sl2-result', `You cannot pay off the loan with a monthly payment of ${money(pay)}. It does not cover the interest, so please check.`);
    const orig = payoff(bal, i, pay, 0, 0, 0);
    const base = `<div class="stat-row"><span>The original payoff schedule</span><strong>${monthsText(orig.months)}</strong></div>` + stat('Total payments', money(orig.total)) + stat('Total interest', money(orig.interest));

    if (option === 'together') {
      el('sl2-result').innerHTML =
        `<div class="summary-payment-box"><div class="label">Needed to pay it all back now</div><div class="value">${money(bal)}</div><div class="label" style="margin-top:6px;">Saves ${money(orig.interest)} in interest</div></div>` + base;
      return;
    }
    if (option === 'original') {
      el('sl2-result').innerHTML =
        `<div class="summary-payment-box"><div class="label">Normal repayment, no extra payments</div><div class="value">${monthsText(orig.months)}</div></div>` + stat('Total payments', money(orig.total)) + stat('Total interest', money(orig.interest));
      return;
    }
    const withExtra = payoff(bal, i, pay, em, ey, eo);
    const parts = [];
    if (em > 0) parts.push(`${money(em)} per month`);
    if (ey > 0) parts.push(`${money(ey)} each year at the year end`);
    if (eo > 0) parts.push(`${money(eo)} now`);
    const earlier = orig.months - withExtra.months;
    el('sl2-result').innerHTML =
      `<div class="summary-payment-box"><div class="label">Paid off in</div><div class="value">${monthsText(withExtra.months)}</div><div class="label" style="margin-top:6px;">${earlier > 0 ? monthsText(earlier) + ' sooner' : 'Same as the normal schedule'}</div></div>` +
      stat('Interest saved', money(orig.interest - withExtra.interest), GREEN) +
      `<h4 style="margin:16px 0 4px;font-size:13px;">${parts.length ? 'If you pay an extra ' + parts.join(', ') : 'With no extra payments'}</h4>` +
      stat('Remaining term', monthsText(withExtra.months)) + stat('Total payments', money(withExtra.total)) + stat('Total interest', money(withExtra.interest)) +
      '<h4 style="margin:16px 0 4px;font-size:13px;">The original payoff schedule</h4>' +
      stat('Remaining term', monthsText(orig.months)) + stat('Total payments', money(orig.total)) + stat('Total interest', money(orig.interest)) +
      note('A one-time payment is made together with your first monthly payment, and a yearly payment is made with the twelfth, twenty-fourth and later monthly payments.');
  }

  // ---------- 3. Projection while in school ----------
  function projection() {
    const gradYears = read('sl3-grad'), annual = read('sl3-annual'), current = read('sl3-current');
    const term = read('sl3-term'), grace = read('sl3-grace'), rate = read('sl3-rate');
    const payInterest = document.querySelector('input[name="sl3-pay"]:checked').value === 'yes';
    if ([gradYears, annual, current, term, grace, rate].some((v) => v === null || Number.isNaN(v))) return error('sl3-result', 'Fill in every box with a number.');
    if (gradYears < 0 || gradYears > 12 || annual < 0 || current < 0 || grace < 0 || grace > 36) return error('sl3-result', 'Check the years to graduate (0 to 12), loan amounts and grace period (0 to 36 months).');
    if (term <= 0 || term > 40) return error('sl3-result', 'Enter a repayment term between 1 and 40 years.');
    if (rate < 0 || rate > 100) return error('sl3-result', 'Enter an interest rate between 0% and 100%.');
    const i = rate / 1200;
    const schoolMonths = Math.round(gradYears * 12), graceMonths = Math.round(grace), n = Math.round(term * 12);
    const borrowed = current + annual * gradYears;
    if (borrowed <= 0) return error('sl3-result', 'Enter a current balance or an amount to borrow each year.');

    let bal = current;
    for (let m = 0; m < schoolMonths; m++) bal = payInterest ? bal + annual / 12 : bal * (1 + i) + annual / 12;
    const afterGrad = bal;
    let afterGrace = bal;
    if (!payInterest) for (let m = 0; m < graceMonths; m++) afterGrace *= 1 + i;
    const payment = pmt(afterGrace, i, n);
    const interest = payment * n - borrowed;
    el('sl3-result').innerHTML =
      `<div class="summary-payment-box"><div class="label">Repayment</div><div class="value">${money(payment)}/month</div><div class="label" style="margin-top:6px;">For ${n} months after ${payInterest ? 'graduation' : 'the grace period'}</div></div>` +
      stat('Amount borrowed', money(borrowed)) +
      (payInterest || i === 0 ? '' : stat('Balance after graduation', money(afterGrad)) + (graceMonths > 0 ? stat('Balance after grace period', money(afterGrace)) : '')) +
      stat('Total interest', money(interest), GREEN) + donut(borrowed, Math.max(0, interest)) +
      (payInterest ? note('You pay the interest while in school, so the balance stays at the amount borrowed. The total interest shown is for the repayment period only.') : note('Interest builds up and is added to the balance while you are in school and during the grace period.'));
  }

  const hook = (formId, fn) => { el(formId).addEventListener('submit', (e) => { e.preventDefault(); fn(); }); fn(); };
  hook('sl1-form', simple);
  hook('sl2-form', repayment);
  hook('sl3-form', projection);
  document.querySelectorAll('input[name="sl2-option"]').forEach((r) => r.addEventListener('change', () => {
    el('sl2-extras').style.display = document.querySelector('input[name="sl2-option"]:checked').value === 'extra' ? '' : 'none';
    repayment();
  }));
  document.querySelectorAll('input[name="sl3-pay"]').forEach((r) => r.addEventListener('change', projection));
  el('sl2-extras').style.display = document.querySelector('input[name="sl2-option"]:checked').value === 'extra' ? '' : 'none';
})();
