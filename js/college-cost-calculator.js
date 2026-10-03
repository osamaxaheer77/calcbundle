'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('cc-form');
  if (!form) return;

  const money = (v) => '$' + Math.round(v).toLocaleString('en-US');
  const num = (id) => { const raw = el(id).value.trim(); if (raw === '') return NaN; const v = Number(raw); return Number.isFinite(v) ? v : NaN; };
  const row = (label, v, c) => `<div class="stat-row"><span>${label}</span><strong${c ? ` style="color:${c}"` : ''}>${v}</strong></div>`;
  const error = (msg) => { el('cc-result').innerHTML = `<p class="tool-result is-error">${msg}</p>`; };
  const years = (n) => `${n} year${n === 1 ? '' : 's'}`;

  function calculate() {
    const cost = num('cc-cost'), inc = num('cc-inc'), len = num('cc-len'), share = num('cc-share');
    const bal = num('cc-bal'), ret = num('cc-ret'), tax = num('cc-tax'), start = num('cc-start');
    if (!(cost > 0)) return error('Enter today’s annual college cost.');
    if (!Number.isFinite(inc) || inc <= -100) return error('Enter the yearly cost increase, above -100%.');
    if (!Number.isInteger(len) || len < 1 || len > 10) return error('Enter how long college lasts as a whole number of years, 1 to 10.');
    if (!Number.isFinite(share) || share < 0 || share > 100) return error('Enter the share paid from savings, 0 to 100%.');
    if (!Number.isFinite(bal) || bal < 0) return error('Enter your savings balance, 0 or more.');
    if (!Number.isFinite(ret) || ret <= -100) return error('Enter the investment return rate.');
    if (!Number.isFinite(tax) || tax < 0 || tax > 100) return error('Enter the tax rate on returns, 0 to 100%.');
    if (!Number.isInteger(start) || start < 0 || start > 60) return error('Enter the years until college starts as a whole number, 0 to 60.');

    const ra = (ret * (1 - tax / 100)) / 100; // after-tax annual return
    const costs = [];
    for (let k = 0; k < len; k++) costs.push(cost * Math.pow(1 + inc / 100, start + k));
    const total = costs.reduce((s, c) => s + c, 0);
    const pv = costs.reduce((s, c, k) => s + c / Math.pow(1 + ra, start + k), 0);
    const n = (start + len) * 12;
    const rm = ra / 12;
    const annuity = Math.abs(rm) < 1e-12 ? n : (1 - Math.pow(1 + rm, -n)) / rm;
    const horizon = `per month for ${years(start + len)}`;

    // Savings needed to reach a target (in today's money), after the balance already saved.
    function plan(targetToday) {
      if (bal >= targetToday) return '<p style="font-size:13px;line-height:1.5;margin:6px 0;color:#10b981;">Your college savings balance now is enough to cover it already!</p>';
      const extra = targetToday - bal;
      return (bal > 0 ? row('Additional amount to save in today’s money', money(extra)) : '') +
        row('Equivalent monthly saving', `${money(extra / annuity)} ${horizon}`, '#10b981');
    }

    const first = costs[0];
    let html =
      '<h3 style="margin:0 0 6px;font-size:15px;">If paying college costs in full</h3>' +
      row('Total college cost', money(total)) +
      row('Total college cost in today’s money', money(pv)) +
      plan(pv) +
      (start > 0 ? row(`Freshman year cost (${inc >= 0 ? 'rise' : 'change'} ${Math.round(inc * 100) / 100}% for ${years(start)})`, `${money(first)} vs. ${money(cost)} now`) : '');
    if (share > 0 && share < 100) {
      const f = share / 100;
      html += `<h3 style="margin:18px 0 6px;font-size:15px;">If ${Math.round(share * 100) / 100}% of college costs come from savings</h3>` +
        '<p style="font-size:12px;color:var(--text-secondary);margin:0 0 6px;">The rest may be paid by grants, scholarships, student loans or other aid.</p>' +
        row('You will need to save', money(total * f)) +
        row('Your target saving in today’s money', money(pv * f)) +
        plan(pv * f) +
        row('Amount needed in freshman year', money(first * f));
    }
    el('cc-result').innerHTML = html;
  }

  el('cc-avg').addEventListener('change', () => { if (el('cc-avg').value) { el('cc-cost').value = el('cc-avg').value; calculate(); } });
  el('cc-cost').addEventListener('input', () => {
    const v = el('cc-cost').value;
    el('cc-avg').value = [...el('cc-avg').options].some((o) => o.value === v && v !== '') ? v : '';
  });
  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  calculate();
})();
