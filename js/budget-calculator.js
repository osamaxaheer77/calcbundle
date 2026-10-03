'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('bd-form');
  if (!form) return;

  const INCOME = ['salary', 'pension', 'investment', 'otherincome'];
  const HOUSING = ['mortgage', 'propertytax', 'rental', 'houseinsurance', 'hoafee'];
  const UTIL = ['homemaintenance', 'utilities'];
  const TRANSPORT = ['autoloan', 'autoinsurance', 'gasoline', 'automaintenance', 'parkingtoll', 'othertransportation'];
  const DEBT = ['creditcard', 'studentloan', 'otherloan'];
  const LIVING = ['food', 'clothing', 'grocery', 'mealout', 'otherliving'];
  const HEALTH = ['medicalinsurance', 'medicalspending'];
  const KIDS = ['childcare', 'tuition', 'childsupport', 'othereducation'];
  const PRETAX = ['ira401k', 'collegesaving'];
  const SAVE = ['stockbond', 'othersavings'];
  const MISC = ['pet', 'giftdonation', 'hobbiesport', 'entertainment', 'vacation', 'allother'];
  const ALL = [].concat(INCOME, HOUSING, UTIL, TRANSPORT, DEBT, LIVING, HEALTH, KIDS, PRETAX, SAVE, MISC);

  const COLORS = ['#3b82f6', '#f59e0b', '#8b5cf6', '#10b981', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];
  const money = (v) => (v < 0 ? '-$' : '$') + Math.abs(Math.round(v)).toLocaleString('en-US');
  const pct = (v) => (v * 100).toFixed(2) + '%';

  function donutChart(segments) {
    const total = segments.reduce((s, x) => s + Math.max(x.value, 0), 0) || 1;
    const r = 15.9155;
    let offset = 25;
    let circles = '';
    segments.forEach((seg) => {
      const p = Math.max(seg.value, 0) / total * 100;
      circles += `<circle cx="21" cy="21" r="${r}" fill="transparent" stroke="${seg.color}" stroke-width="4" stroke-dasharray="${p} ${100 - p}" stroke-dashoffset="${offset}"></circle>`;
      offset -= p;
    });
    return `<svg viewBox="0 0 42 42" class="donut">${circles}</svg>`;
  }

  function annual(id) {
    const raw = el('bd-' + id).value.trim();
    const v = raw === '' ? 0 : Number(raw);
    if (!Number.isFinite(v) || v < 0) return NaN;
    return el('bd-p-' + id).value === 'm' ? v * 12 : v;
  }

  function calculate() {
    const a = {};
    for (const id of ALL) {
      a[id] = annual(id);
      if (Number.isNaN(a[id])) {
        el('bd-result').innerHTML = '<p class="tool-result is-error">Amounts must be numbers, 0 or more.</p>';
        return;
      }
    }
    const rawTax = el('bd-taxrate').value.trim();
    const tax = rawTax === '' ? 0 : Number(rawTax);
    if (!Number.isFinite(tax) || tax < 0 || tax > 100) {
      el('bd-result').innerHTML = '<p class="tool-result is-error">Enter an income tax rate from 0 to 100.</p>';
      return;
    }
    const keep = 1 - tax / 100;
    const sum = (ids) => ids.reduce((s, id) => s + a[id], 0);

    const gross = sum(INCOME);
    const net = gross * keep;
    const housing = sum(HOUSING) + sum(UTIL);
    const transport = sum(TRANSPORT);
    const debt = sum(DEBT);
    const living = sum(LIVING);
    const health = sum(HEALTH);
    const kids = sum(KIDS);
    const savings = sum(PRETAX) * keep + sum(SAVE);
    const misc = sum(MISC);
    const expenses = housing + transport + debt + living + health + kids + savings + misc;
    const left = net - expenses;

    const dtiNum = sum(HOUSING) + a.autoloan + sum(DEBT);
    const front = sum(HOUSING);
    const dti = gross > 0 ? dtiNum / gross : 0;
    const frontRatio = gross > 0 ? front / gross : 0;
    let dtiMsg;
    if (dti * 100 < 35) dtiMsg = 'Your DTI ratio is good.';
    else if (dti * 100 < 50) dtiMsg = 'Your DTI ratio is OK with room for improvement. Consider taking actions to improve it.';
    else dtiMsg = 'Your DTI ratio is very high, and may put you in more financially-risky situations. We recommend taking actions to lower it.';

    const cats = [
      ['Housing & Utilities', housing],
      ['Transportation', transport],
      ['Other Debt & Loan Payments', debt],
      ['Living Expenses', living],
      ['Healthcare', health],
      ['Children & Education', kids],
      ['Savings & Investments', savings],
      ['Miscellaneous Expenses', misc],
    ];
    const share = (v) => (net > 0 ? pct(v / net) : '—');
    const row = (label, v) => `<tr><td>${label}</td><td>${money(v)}</td><td>${money(v / 12)}</td></tr>`;

    const leftLabel = left < 0 ? 'Net (deficit)' : 'Net (discretionary income)';
    const mealsOut = a.food + a.mealout;
    el('bd-result').innerHTML =
      `<div class="summary-payment-box"><div class="label">${leftLabel} per month</div><div class="value" style="${left < 0 ? 'color:#ef4444' : ''}">${money(left / 12)}</div><div class="label" style="margin-top:6px;">${money(left)} per year</div></div>` +
      '<table class="bd-table"><thead><tr><th></th><th>Annual</th><th>Monthly</th></tr></thead><tbody>' +
      row('Total before-tax income', gross) + row('Total after-tax income', net) + row('Total expenses', expenses) + row(leftLabel, left) +
      '</tbody></table>' +
      '<h3 style="margin:18px 0 4px;font-size:15px;">Debt-to-income (DTI) ratio</h3>' +
      `<div class="stat-row"><span>DTI ratio</span><strong>${pct(dti)}</strong></div>` +
      `<p style="font-size:13px;line-height:1.5;margin:6px 0 10px;">${dtiMsg}</p>` +
      `<div class="stat-row"><span>Front-end DTI ratio</span><strong>${pct(frontRatio)}</strong></div>` +
      '<p style="font-size:12px;color:var(--text-secondary);margin:4px 0 0;">Housing costs divided by gross income.</p>' +
      '<h3 style="margin:18px 0 4px;font-size:15px;">Expenses breakdown</h3>' +
      '<table class="bd-table"><thead><tr><th></th><th>Annual</th><th>% of income</th></tr></thead><tbody>' +
      cats.map(([n, v]) => `<tr><td>${n}</td><td>${money(v)}</td><td>${share(v)}</td></tr>`).join('') +
      '</tbody></table>' +
      `<p style="font-size:12px;color:var(--text-secondary);margin:8px 0 0;">Percentages are shares of after-tax income. Food and meals out (${money(mealsOut)}) are part of living expenses. 401(k), IRA and college savings are tax adjusted. Saving 15% or more of income is recommended.</p>` +
      `<div class="donut-wrap" style="margin-top:16px;">${donutChart(cats.map(([, v], k) => ({ value: v, color: COLORS[k] })))}` +
      '<div class="donut-legend">' + cats.map(([n], k) => `<span class="legend-item"><span class="legend-dot" style="background:${COLORS[k]}"></span>${n}</span>`).join('') + '</div></div>';
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  calculate();
})();
