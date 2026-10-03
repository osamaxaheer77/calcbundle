'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('th-form');
  if (!form || !window.TaxEngine) return;

  const money = (v) => (v < -0.005 ? '-$' : '$') + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const money0 = (v) => (v < -0.5 ? '-$' : '$') + Math.abs(Math.round(v)).toLocaleString('en-US');

  const PERIODS = { daily: 260, weekly: 52, biweekly: 26, semimonthly: 24, monthly: 12, quarterly: 4, semiannual: 2, annual: 1 };
  const NAME = { daily: 'daily', weekly: 'weekly', biweekly: 'bi-weekly', semimonthly: 'semi-monthly', monthly: 'monthly', quarterly: 'quarterly', semiannual: 'semi-annual', annual: 'annual' };

  function num(id) {
    const raw = el(id).value.trim();
    if (raw === '') return 0;
    const v = parseFloat(raw);
    return Number.isFinite(v) ? v : NaN;
  }

  const NUMBER_IDS = ['th-income', 'th-children', 'th-other-deps', 'th-nonjob', 'th-pretax', 'th-notheld', 'th-itemized', 'th-job2', 'th-job3', 'th-state', 'th-city', 'th-tips', 'th-overtime', 'th-car', 'th-gifts'];

  function showError(msg) {
    el('th-result').innerHTML = `<p class="tool-result is-error">${msg}</p>`;
  }

  function calculate() {
    if (NUMBER_IDS.some((id) => !Number.isFinite(num(id)) || num(id) < 0)) return showError('Enter each amount as a number, 0 or more.');
    const income = num('th-income');
    if (income <= 0) return showError('Enter your yearly job income.');
    if (num('th-state') > 30 || num('th-city') > 30) return showError('Enter state and city tax rates of 30% or less.');
    if (num('th-pretax') > income) return showError('Pre-tax deductions cannot be more than your income.');

    const year = parseInt(el('th-year').value, 10);
    const freq = el('th-frequency').value;
    const status = el('th-status').value;
    const joint = status === 'mfj';
    const se = el('th-se').checked;
    const periods = PERIODS[freq];
    const P = window.TaxEngine.PARAMS[year];
    const pretax = num('th-pretax');
    const otherJobs = el('th-has-other').checked ? num('th-job2') + num('th-job3') : 0;
    const age1 = el('th-age65').checked ? 65 : 40;
    const age2 = joint && el('th-spouse65').checked ? 65 : 40;

    const build = (withOtherJobs) => ({
      year, status, youngDeps: Math.floor(num('th-children')), otherDeps: Math.floor(num('th-other-deps')),
      p1: {
        age: age1,
        wages: se ? 0 : Math.max(0, income - pretax) + (withOtherJobs && !joint ? otherJobs : 0),
        business: se ? income : 0,
        medicareWages: se ? 0 : income + (withOtherJobs && !joint ? otherJobs : 0),
      },
      p2: joint ? { age: age2, wages: withOtherJobs ? otherJobs : 0, medicareWages: withOtherJobs ? otherJobs : 0 } : {},
      otherIncome: num('th-nonjob'),
      otherAdjustments: num('th-notheld') + (se ? pretax : 0),
      ded: { tips: num('th-tips'), overtime: num('th-overtime'), carLoan: num('th-car'), charity: num('th-gifts'), other: num('th-itemized') },
    });

    const r = window.TaxEngine.compute(build(true));
    const r0 = otherJobs > 0 ? window.TaxEngine.compute(build(false)) : r;
    const incomeTax = (x) => x.taxBeforeCredits - x.credits.nonrefundable + x.niit;

    // Payroll taxes on this job's pay
    const seEarnings = 0.9235 * income;
    const ss = se ? 0.124 * Math.min(seEarnings, P.ssWageBase) : 0.062 * Math.min(income, P.ssWageBase);
    const medicare = (se ? 0.029 * seEarnings : 0.0145 * income) + r.addlMedicare;
    const state = (num('th-state') / 100) * income;
    const city = (num('th-city') / 100) * income;
    const fed = Math.max(0, incomeTax(r));
    const net = income - fed - ss - medicare - state - city - pretax;
    const per = (v) => v / periods;

    const rows = [
      ['Gross pay', income],
      ['Federal income tax', fed],
      ['Social Security tax', ss],
      ['Medicare tax', medicare],
      ['State income tax', state],
      ['City income tax', city],
      ['Pre-tax deductions', pretax],
    ].map(([label, v]) => `<tr><td>${label}</td><td>${money(per(v))}</td><td>${money(v)}</td></tr>`).join('') +
      `<tr style="font-weight:700;"><td>Take-home pay</td><td>${money(per(net))}</td><td>${money(net)}</td></tr>`;

    const stepB = Math.max(0, r.deduction - P.stdDed[status]) + r.special + r.adjustments;
    const extra = otherJobs > 0 ? Math.max(0, incomeTax(r) - incomeTax(r0)) : 0;
    const step3 = Math.floor(num('th-children')) * P.ctc + Math.floor(num('th-other-deps')) * P.odc;

    el('th-result').innerHTML =
      `<div class="summary-payment-box"><div class="label">${year} ${NAME[freq]} take-home pay</div><div class="value">${money(per(net))}</div>` +
      `<div class="label" style="margin-top:6px;">${money0(net)} a year after tax and deductions</div></div>` +
      `<div class="schedule-table-wrap" style="max-height:none;"><table class="schedule-table"><thead><tr><th></th><th>Per ${NAME[freq]} paycheck</th><th>Per year</th></tr></thead><tbody>${rows}</tbody></table></div>` +
      `<h4 style="margin:18px 0 4px;font-size:13px;">If you are filling in a ${year} W-4 for your highest-paying job</h4>` +
      `<div class="stat-row"><span>Step 3: Claim dependents</span><strong>${money0(step3)}</strong></div>` +
      `<div class="stat-row"><span>Step 4(a): Other income</span><strong>${money0(num('th-nonjob'))}</strong></div>` +
      `<div class="stat-row"><span>Step 4(b): Deductions</span><strong>${money0(stepB)}</strong></div>` +
      `<div class="stat-row"><span>Step 4(c): Extra withholding per paycheck</span><strong>${money(per(extra))}</strong></div>` +
      `<p style="font-size:12px;color:var(--text-secondary);margin:12px 0 0;">Federal tax is your estimated yearly income tax divided across your paychecks, so it can differ a little from what your employer's payroll system withholds. Payroll taxes are worked out on your gross pay.</p>`;
  }

  function applyVisibility() {
    const joint = el('th-status').value === 'mfj';
    form.querySelectorAll('[data-other-jobs]').forEach((n) => { n.hidden = !el('th-has-other').checked; });
    form.querySelectorAll('[data-joint]').forEach((n) => { n.hidden = !joint; });
  }

  ['th-status', 'th-has-other'].forEach((id) => el(id).addEventListener('change', () => { applyVisibility(); calculate(); }));
  ['th-frequency', 'th-year'].forEach((id) => el(id).addEventListener('change', calculate));
  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  applyVisibility();
  calculate();
})();
