'use strict';

// Shared tools for the calculators that handle several debts at once:
// input rows, the "avalanche" payoff plan, and plain-language payment schedules.
(function () {
  const money = (v) => (v < -0.005 ? '-$' : '$') + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function monthsText(n) {
    const y = Math.floor(n / 12), m = n - y * 12;
    const parts = [];
    if (y) parts.push(`${y} ${y === 1 ? 'year' : 'years'}`);
    if (m || !y) parts.push(`${m} ${m === 1 ? 'month' : 'months'}`);
    return `${n} ${n === 1 ? 'month' : 'months'} (${parts.join(' and ')})`;
  }

  // Build up to `count` rows of name / balance / payment / rate inputs. Only the first `shown` are visible at first.
  function mountRows(container, prefix, defaults, opts) {
    const o = Object.assign({ count: 20, shown: 6, nameLabel: 'Debt name', balLabel: 'Remaining balance ($)', payLabel: 'Monthly or min. payment ($)', rateLabel: 'Interest rate (%)', namePlaceholder: '' }, opts);
    let html = '';
    for (let k = 1; k <= o.count; k++) {
      const d = defaults[k - 1] || {};
      html += `<div class="debt-row" data-row="${k}" style="${k > o.shown ? 'display:none;' : ''}">` +
        `<p style="font-size:13px;font-weight:600;color:var(--text-primary);margin:12px 0 6px;">${k}.</p>` +
        '<div class="field-row">' +
        `<div class="field-group"><label for="${prefix}-nm${k}">${o.nameLabel}</label><input type="text" id="${prefix}-nm${k}" value="${d.name || ''}" placeholder="${o.namePlaceholder}"></div>` +
        `<div class="field-group"><label for="${prefix}-bal${k}">${o.balLabel}</label><input type="number" id="${prefix}-bal${k}" value="${d.bal !== undefined ? d.bal : ''}" min="0" step="any"></div>` +
        '</div><div class="field-row">' +
        `<div class="field-group"><label for="${prefix}-min${k}">${o.payLabel}</label><input type="number" id="${prefix}-min${k}" value="${d.min !== undefined ? d.min : ''}" min="0" step="any"></div>` +
        `<div class="field-group"><label for="${prefix}-rate${k}">${o.rateLabel}</label><input type="number" id="${prefix}-rate${k}" value="${d.rate !== undefined ? d.rate : ''}" min="0" max="100" step="any"></div>` +
        '</div></div>';
    }
    html += `<div style="margin:10px 0 14px;"><button type="button" class="debt-more" style="background:none;border:1px solid var(--border);border-radius:8px;padding:6px 14px;cursor:pointer;color:var(--accent);font:inherit;">Show more input fields</button></div>`;
    container.innerHTML = html;
    // Rows that have data are always shown.
    for (let k = o.shown + 1; k <= o.count; k++) {
      if (defaults[k - 1]) container.querySelector(`[data-row="${k}"]`).style.display = '';
    }
    container.querySelector('.debt-more').addEventListener('click', (e) => {
      container.querySelectorAll('.debt-row').forEach((r) => { r.style.display = ''; });
      e.target.parentElement.style.display = 'none';
    });
  }

  // Read the rows. Returns { debts } or { error }.
  function readRows(prefix, count, what) {
    const debts = [];
    for (let k = 1; k <= count; k++) {
      const get = (id) => document.getElementById(`${prefix}-${id}${k}`);
      const bal = get('bal').value.trim(), min = get('min').value.trim(), rate = get('rate').value.trim(), name = get('nm').value.trim();
      if (bal === '' && min === '' && rate === '') continue;
      const b = Number(bal), m = Number(min), r = Number(rate);
      if (bal === '' || min === '' || rate === '' || !Number.isFinite(b) || !Number.isFinite(m) || !Number.isFinite(r)) return { error: `Row ${k} is incomplete. Fill in the balance, payment and interest rate for each ${what}, or clear the row.` };
      if (b <= 0) return { error: `The balance in row ${k} must be more than 0.` };
      if (m <= 0) return { error: `The payment in row ${k} must be more than 0.` };
      if (r < 0 || r > 100) return { error: `The interest rate in row ${k} must be between 0% and 100%.` };
      debts.push({ name: name || `${what.charAt(0).toUpperCase()}${what.slice(1)} ${k}`, bal: b, min: m, rate: r, row: k });
    }
    if (!debts.length) return { error: `Enter at least one ${what} with its balance, payment and interest rate.` };
    return { debts };
  }

  // Debt avalanche: pay every minimum, and put whatever is left of the budget on the highest-rate debt.
  // With `rollover`, a paid-off debt's payment keeps going toward the others, so the monthly total stays fixed.
  function avalanche(debts, o) {
    const opt = Object.assign({ budget: null, extraMonth: 0, extraYear: 0, oneTime: 0, oneTimeMonth: 1, rollover: true }, o);
    const cs = debts.map((d, idx) => ({ ...d, idx, work: d.bal, interest: 0, paid: 0, doneMonth: 0, pays: [] }));
    const order = cs.slice().sort((a, b) => b.rate - a.rate);
    const sumMin = cs.reduce((s, c) => s + c.min, 0);
    const base = opt.budget !== null ? opt.budget : sumMin;
    let month = 0, totalPaid = 0, totalInterest = 0;
    while (cs.some((c) => c.work > 0.005) && month < 1200) {
      month++;
      cs.forEach((c) => { if (c.work > 0.005) { const i = (c.work * c.rate) / 1200; c.work += i; c.interest += i; totalInterest += i; } });
      const active = cs.filter((c) => c.work > 0.005);
      const extras = opt.extraMonth + (month % 12 === 1 ? opt.extraYear : 0) + (month === opt.oneTimeMonth ? opt.oneTime : 0);
      let avail = (opt.rollover ? base : active.reduce((s, c) => s + c.min, 0)) + extras;
      const pays = {};
      active.forEach((c) => { const p = Math.min(c.min, c.work); c.work -= p; avail -= p; pays[c.idx] = p; });
      for (const c of order) {
        if (avail <= 0.005) break;
        if (c.work > 0.005) { const p = Math.min(avail, c.work); c.work -= p; avail -= p; pays[c.idx] = (pays[c.idx] || 0) + p; }
      }
      cs.forEach((c) => {
        const p = pays[c.idx] || 0;
        if (p > 0) { c.pays[month] = p; c.paid += p; totalPaid += p; }
        if (c.work <= 0.005 && !c.doneMonth && p > 0) c.doneMonth = month;
      });
    }
    return { months: month, totalPaid, totalInterest: totalPaid - debts.reduce((s, d) => s + d.bal, 0), rawInterest: totalInterest, debts: cs, sumMin, budget: base };
  }

  // "Pay $280.00 until month 15. Pay $274.33 at month 16 to pay off."
  function scheduleText(card) {
    const groups = [];
    for (let m = 1; m < card.pays.length; m++) {
      const p = card.pays[m];
      if (p === undefined) continue;
      const cents = Math.round(p * 100);
      const g = groups[groups.length - 1];
      if (g && g.cents === cents && g.end === m - 1) g.end = m; else groups.push({ cents, amount: p, start: m, end: m });
    }
    return groups.map((g, k) => {
      const last = k === groups.length - 1;
      const lead = k === 0 ? 'Pay' : 'Then pay';
      if (last) return g.start === g.end ? `${k === 0 ? 'Pay' : 'Pay'} ${money(g.amount)} at month ${g.end} to pay off.` : `${lead} ${money(g.amount)} until month ${g.end} to pay off.`;
      return `${lead} ${money(g.amount)} until month ${g.end}.`;
    }).join(' ');
  }

  // IRR helper: the monthly rate that makes the payments worth `cash` today.
  function monthlyIrr(cash, flows) {
    let lo = 0, hi = 1;
    for (let k = 0; k < 300; k++) {
      const m = (lo + hi) / 2;
      let pv = 0;
      for (let t = 0; t < flows.length; t++) pv += flows[t] / Math.pow(1 + m, t + 1);
      if (pv > cash) lo = m; else hi = m;
    }
    return (lo + hi) / 2;
  }

  window.DebtEngine = { money, monthsText, mountRows, readRows, avalanche, scheduleText, monthlyIrr };
})();
