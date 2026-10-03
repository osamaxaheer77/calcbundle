'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('est-form');
  if (!form) return;

  // Federal estate tax: lifetime exemption per person and the rate above it.
  const EXEMPTION_2026 = 15000000;
  const EXEMPTION_2025 = 13990000;
  const RATE = 0.4;

  const money = (v) => (v < -0.5 ? '-$' : '$') + Math.abs(Math.round(v)).toLocaleString('en-US');

  function num(id) {
    const raw = el(id).value.trim();
    if (raw === '') return 0;
    const v = parseFloat(raw);
    return Number.isFinite(v) ? v : NaN;
  }

  const ASSETS = ['est-residence', 'est-stock', 'est-saving', 'est-vehicle', 'est-retirement', 'est-insurance', 'est-other'];
  const DEDUCTIONS = ['est-debt', 'est-funeral', 'est-charity', 'est-state'];

  function showError(msg) {
    el('est-result').innerHTML = `<p class="tool-result is-error">${msg}</p>`;
  }

  const statRow = (label, value, color) =>
    `<div class="stat-row"><span>${label}</span><strong${color ? ` style="color:${color}"` : ''}>${value}</strong></div>`;
  const note = (text) => `<p style="font-size:12px;color:var(--text-secondary);margin:12px 0 0;">${text}</p>`;

  function donut(taxShare) {
    const r = 15.9155;
    const p = Math.max(0, Math.min(100, taxShare));
    return `<div class="donut-wrap" style="margin-top:16px;"><svg viewBox="0 0 42 42" class="donut">` +
      `<circle cx="21" cy="21" r="${r}" fill="transparent" stroke="#10b981" stroke-width="4"></circle>` +
      `<circle cx="21" cy="21" r="${r}" fill="transparent" stroke="#dc2626" stroke-width="4" stroke-dasharray="${p} ${100 - p}" stroke-dashoffset="25"></circle></svg>` +
      `<div class="donut-legend"><span class="legend-item"><span class="legend-dot" style="background:#dc2626"></span>Estate tax (${Math.round(p)}%)</span>` +
      `<span class="legend-item"><span class="legend-dot" style="background:#10b981"></span>After-tax value (${Math.round(100 - p)}%)</span></div></div>`;
  }

  function calculate() {
    const assets = ASSETS.map(num);
    const deductions = DEDUCTIONS.map(num);
    const gifts = num('est-gifts');
    if ([...assets, ...deductions, gifts].some((v) => !Number.isFinite(v) || v < 0)) return showError('Enter each amount as a number, 0 or more.');

    const totalAssets = assets.reduce((a, b) => a + b, 0);
    const totalDeductions = deductions.reduce((a, b) => a + b, 0);
    const net = totalAssets - totalDeductions;
    const base = net + gifts;
    const over = Math.max(0, base - EXEMPTION_2026);
    const tax = over * RATE;

    let html;
    if (tax === 0) {
      html = `<div class="summary-payment-box"><div class="label">Federal estate tax (2026)</div><div class="value">$0</div>` +
        `<div class="label" style="margin-top:6px;">Within the ${money(EXEMPTION_2026)} exemption</div></div>` +
        statRow('Total assets', money(totalAssets)) +
        statRow('Deductions and debts', '-' + money(totalDeductions)) +
        statRow('Net estate', money(net)) +
        statRow('Lifetime gifts added back', money(gifts)) +
        statRow('Taxable estate before exemption', money(base)) +
        note('Because the taxable estate is within the 2026 exemption, no federal estate tax is due. State estate or inheritance taxes may still apply, and they have much lower thresholds.');
    } else {
      const after = net - tax;
      const taxShare = net > 0 ? (tax / net) * 100 : 100;
      const over25 = Math.max(0, base - EXEMPTION_2025);
      const tax25 = over25 * RATE;
      html = `<div class="summary-payment-box"><div class="label">Federal estate tax (2026)</div><div class="value">${money(tax)}</div>` +
        `<div class="label" style="margin-top:6px;">${net > 0 ? Math.round(taxShare * 10) / 10 + '% of your net estate' : 'Due on gifts added back to your estate'}</div></div>` +
        statRow('Total assets', money(totalAssets)) +
        statRow('Deductions and debts', '-' + money(totalDeductions)) +
        statRow('Net estate', money(net)) +
        statRow('Lifetime gifts added back', money(gifts)) +
        statRow('Taxable estate before exemption', money(base)) +
        statRow('2026 exemption', '-' + money(EXEMPTION_2026)) +
        statRow('Amount over the exemption', money(over)) +
        statRow('Estate tax at 40%', money(tax), '#dc2626') +
        statRow('Value left after tax', money(after), after < 0 ? '#dc2626' : '#10b981') +
        (net > 0 ? donut(taxShare) : '') +
        `<h4 style="margin:18px 0 4px;font-size:13px;">If the same estate were taxed in 2025</h4>` +
        statRow('2025 exemption', money(EXEMPTION_2025)) +
        statRow('Amount over the exemption', money(over25)) +
        statRow('Estate tax at 40%', money(tax25)) +
        statRow('Value left after tax', money(net - tax25)) +
        (after < 0 ? note('The tax is larger than the net estate because gifts are added back to the estate. The estate would not have enough to pay it, so check these amounts with an estate attorney.') : '');
    }
    el('est-result').innerHTML = html;
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  calculate();
})();
