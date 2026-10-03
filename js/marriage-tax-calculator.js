'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('mt-form');
  if (!form || !window.TaxEngine) return;

  const GREEN = '#10b981';
  const RED = '#dc2626';
  const money = (v) => (v < -0.5 ? '-$' : '$') + Math.abs(Math.round(v)).toLocaleString('en-US');
  const pct = (v) => Math.round(v * 1000) / 10 + '%';

  function num(id) {
    const raw = el(id).value.trim();
    if (raw === '') return 0;
    const v = parseFloat(raw);
    return Number.isFinite(v) ? v : NaN;
  }

  const FIELDS = ['salary', 'interest', 'passive', 'st', 'lt', 'qdiv', 'k401', 'deps', 'mortgage', 'charity', 'student', 'childcare', 'tuition', 'state'];
  const CAN_BE_NEGATIVE = ['passive', 'st', 'lt'];

  function readSpouse(n) {
    const s = { status: el('mt-status' + n).value, se: el('mt-se' + n).checked };
    for (const f of FIELDS) s[f] = num(`mt-${f}${n}`);
    return s;
  }

  function validate(s, label) {
    for (const f of FIELDS) {
      const v = s[f];
      if (!Number.isFinite(v) || (!CAN_BE_NEGATIVE.includes(f) && v < 0)) return `Check the ${label} amounts: each must be a number, 0 or more (gains and passive income can be negative).`;
    }
    if (s.state > 30) return `Enter a ${label} state and city tax rate of 30% or less.`;
    return null;
  }

  const otherIncome = (s) => s.interest + s.passive + s.st + s.lt + s.qdiv;
  const grossIncome = (s) => s.salary + otherIncome(s);
  const stateTax = (s) => (s.state / 100) * grossIncome(s);

  function personFields(s) {
    return {
      age: 30,
      wages: s.se ? 0 : Math.max(0, s.salary - s.k401),
      business: s.se ? s.salary : 0,
      medicareWages: s.se ? 0 : s.salary,
      stateWithheld: stateTax(s),
    };
  }

  function fica(s, year) {
    const base = window.TaxEngine.PARAMS[year].ssWageBase;
    if (s.se) { const se = 0.9235 * s.salary; return { ss: 0.124 * Math.min(se, base), med: 0.029 * se }; }
    return { ss: 0.062 * Math.min(s.salary, base), med: 0.0145 * s.salary };
  }

  const incomeTaxOf = (r) => r.taxBeforeCredits - r.creditsTotal + r.niit;

  function single(s, year) {
    const r = window.TaxEngine.compute({
      year, status: s.status, youngDeps: s.deps, otherDeps: 0, p1: personFields(s), p2: {},
      interest: s.interest, passive: s.passive, stGain: s.st, ltGain: s.lt, qualDividends: s.qdiv,
      otherAdjustments: s.se ? s.k401 : 0,
      ded: { mortgage: s.mortgage, charity: s.charity, studentLoan: s.student, childCare: s.childcare, tuition: [s.tuition] },
    });
    const f = fica(s, year);
    const fed = incomeTaxOf(r);
    const income = grossIncome(s);
    const med = f.med + r.addlMedicare;
    const st = stateTax(s);
    return { income, fed, marginal: r.marginal, ss: f.ss, med, state: st, k401: s.k401, take: income - fed - f.ss - med - st - s.k401 };
  }

  function married(a, b, year) {
    const r = window.TaxEngine.compute({
      year, status: 'mfj', youngDeps: a.deps + b.deps, otherDeps: 0, p1: personFields(a), p2: personFields(b),
      interest: a.interest + b.interest, passive: a.passive + b.passive, stGain: a.st + b.st, ltGain: a.lt + b.lt, qualDividends: a.qdiv + b.qdiv,
      otherAdjustments: (a.se ? a.k401 : 0) + (b.se ? b.k401 : 0),
      ded: { mortgage: a.mortgage + b.mortgage, charity: a.charity + b.charity, studentLoan: a.student + b.student, childCare: a.childcare + b.childcare, tuition: [a.tuition, b.tuition] },
    });
    const fa = fica(a, year), fb = fica(b, year);
    const fed = incomeTaxOf(r);
    const income = grossIncome(a) + grossIncome(b);
    const med = fa.med + fb.med + r.addlMedicare;
    const st = stateTax(a) + stateTax(b);
    const k = a.k401 + b.k401;
    return { income, fed, marginal: r.marginal, ss: fa.ss + fb.ss, med, state: st, k401: k, take: income - fed - fa.ss - fb.ss - med - st - k };
  }

  function calculate() {
    const year = parseInt(el('mt-year').value, 10);
    const a = readSpouse(1), b = readSpouse(2);
    const err = validate(a, 'Spouse 1') || validate(b, 'Spouse 2');
    if (err) { el('mt-result').innerHTML = `<p class="tool-result is-error">${err}</p>`; return; }

    const s1 = single(a, year), s2 = single(b, year), m = married(a, b, year);
    const separate = s1.fed + s2.fed;
    const diff = m.fed - separate;
    const takeSep = s1.take + s2.take;
    const row = (label, v1, v2, vs, vm) => `<tr><td>${label}</td><td>${v1}</td><td>${v2}</td><td>${vs}</td><td>${vm}</td></tr>`;
    const rows = [
      row('All income', money(s1.income), money(s2.income), money(s1.income + s2.income), money(m.income)),
      row('Federal income tax', money(s1.fed), money(s2.fed), money(separate), money(m.fed)),
      row('Marginal tax rate', pct(s1.marginal), pct(s2.marginal), '', pct(m.marginal)),
      row('Social Security tax', money(s1.ss), money(s2.ss), money(s1.ss + s2.ss), money(m.ss)),
      row('Medicare tax', money(s1.med), money(s2.med), money(s1.med + s2.med), money(m.med)),
      row('State and city income tax', money(s1.state), money(s2.state), money(s1.state + s2.state), money(m.state)),
      row('401(k), IRA and savings', money(s1.k401), money(s2.k401), money(s1.k401 + s2.k401), money(m.k401)),
      row('Final take-home pay', money(s1.take), money(s2.take), money(takeSep), money(m.take)),
    ].join('');

    const more = diff > 0.5, less = diff < -0.5;
    const headline = more ? `About ${money(diff)} more federal income tax if you marry` : less ? `About ${money(-diff)} less federal income tax if you marry` : 'About the same federal income tax if you marry';
    const sub = more ? 'A marriage penalty: the joint return costs more than two single returns' : less ? 'A marriage bonus: the joint return costs less than two single returns' : 'Filing jointly makes no difference to your federal tax';

    el('mt-result').innerHTML =
      `<div class="summary-payment-box"><div class="label">${year} federal income tax, married versus single</div><div class="value" style="font-size:24px;">${headline}</div><div class="label" style="margin-top:6px;">${sub}</div></div>` +
      `<div class="stat-row"><span>Federal tax filing separately as singles</span><strong>${money(separate)}</strong></div>` +
      `<div class="stat-row"><span>Federal tax on one joint return</span><strong>${money(m.fed)}</strong></div>` +
      `<div class="stat-row"><span>Difference in combined take-home pay</span><strong style="color:${m.take - takeSep >= 0 ? GREEN : RED}">${money(m.take - takeSep)}</strong></div>` +
      `<p style="font-size:12px;color:var(--text-secondary);margin:12px 0 0;">Married filing separately is not shown, since it rarely beats filing jointly. Payroll tax is not deductible, so it is not subtracted before income tax.</p>`;

    el('mt-table-wrap').innerHTML =
      '<table class="schedule-table"><thead><tr><th></th><th>Spouse 1</th><th>Spouse 2</th><th>Combined, Not Married</th><th>If Married</th></tr></thead><tbody>' + rows + '</tbody></table>';
    el('mt-results-section').hidden = false;
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  el('mt-year').addEventListener('change', calculate);
  calculate();
})();
