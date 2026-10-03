'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  if (!el('cm1-form')) return;

  const money = (v) => '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const moneyShort = (v) => '$' + v.toLocaleString('en-US', { maximumFractionDigits: 2 });
  const pct = (v) => `${Math.round(v * 10000) / 10000}%`;
  const read = (id) => { const raw = el(id).value.trim(); if (raw === '') return null; const v = Number(raw); return Number.isFinite(v) ? v : NaN; };
  const error = (id, msg) => { el(id).innerHTML = `<p class="tool-result is-error">${msg}</p>`; };
  const row = (label, v, c) => `<div class="stat-row"><span>${label}</span><strong${c ? ` style="color:${c}"` : ''}>${v}</strong></div>`;
  const TIERS = 8;

  // ---------- Simple commission: any two of sales price, rate, commission ----------
  function simple() {
    const price = read('cm1-price'), rate = read('cm1-rate'), comm = read('cm1-comm');
    const v = [price, rate, comm];
    if (v.some((x) => Number.isNaN(x))) return error('cm1-result', 'Enter numbers only in the boxes you fill in.');
    if (v.filter((x) => x !== null).length < 2) return error('cm1-result', 'Fill in any two of the three boxes, and leave the one you want to find empty.');
    if (v.some((x) => x !== null && x < 0)) return error('cm1-result', 'Values cannot be negative.');
    let title, value, steps;
    if (price !== null && rate !== null) {
      const c = (price * rate) / 100;
      title = 'Commission'; value = money(c);
      steps = `commission = sales price × commission rate = ${moneyShort(price)} × ${pct(rate)} = ${moneyShort(c)}`;
    } else if (comm !== null && rate !== null) {
      if (rate === 0) return error('cm1-result', 'A commission rate of 0% pays nothing, so the sales price cannot be found. Enter a rate above 0.');
      const p = comm / (rate / 100);
      title = 'Sales price'; value = money(p);
      steps = `sales price = commission ÷ commission rate = ${moneyShort(comm)} ÷ ${pct(rate)} = ${moneyShort(p)}`;
    } else {
      if (price === 0) return error('cm1-result', 'The sales price must be more than 0 to find a rate.');
      const r = (comm / price) * 100;
      title = 'Commission rate'; value = pct(r);
      steps = `commission rate = commission ÷ sales price = ${moneyShort(comm)} ÷ ${moneyShort(price)} = ${pct(r)}`;
    }
    el('cm1-result').innerHTML =
      `<div class="summary-payment-box"><div class="label">${title}</div><div class="value">${value}</div></div>` +
      `<p style="font-size:13px;line-height:1.5;margin:14px 0 0;"><strong>Steps:</strong> ${steps}</p>` +
      (v.filter((x) => x !== null).length === 3 ? '<p style="font-size:12px;color:var(--text-secondary);margin:12px 0 0;">You filled in all three boxes, so the commission was worked out again from the sales price and the rate.</p>' : '');
  }

  // ---------- Tiered commission ----------
  function applyVisibility() {
    const hasBase = document.querySelector('input[name="cm2-base"]:checked').value === 'y';
    const vary = document.querySelector('input[name="cm2-vary"]:checked').value === 'y';
    el('cm2-base-box').style.display = hasBase ? '' : 'none';
    el('cm2-fixed-box').style.display = vary ? 'none' : '';
    el('cm2-tier-box').style.display = vary ? '' : 'none';
  }

  function fromUnit(v, unit, whole) { return unit === 'p' ? (whole * v) / 100 : v; }

  function tiered() {
    const sales = read('cm2-price');
    if (sales === null || Number.isNaN(sales) || sales < 0) return error('cm2-result', 'Enter the sales price, 0 or more.');
    const hasBase = document.querySelector('input[name="cm2-base"]:checked').value === 'y';
    const vary = document.querySelector('input[name="cm2-vary"]:checked').value === 'y';
    const lines = [];
    let total = 0;
    if (hasBase) {
      const b = read('cm2-base');
      if (b === null || Number.isNaN(b) || b < 0) return error('cm2-result', 'Enter the base commission, 0 or more.');
      const amount = fromUnit(b, el('cm2-base-unit').value, sales);
      lines.push(['Base commission', amount]); total += amount;
    }
    if (!vary) {
      const f = read('cm2-fixed');
      if (f === null || Number.isNaN(f) || f < 0) return error('cm2-result', 'Enter the commission, 0 or more.');
      const amount = fromUnit(f, el('cm2-fixed-unit').value, sales);
      lines.push(['Additional commission', amount]); total += amount;
    } else {
      let from = 0;
      for (let k = 1; k <= TIERS; k++) {
        const to = read(`cm2-t${k}`), c = read(`cm2-c${k}`), unit = el(`cm2-u${k}`).value;
        if (c === null && to === null) break;
        if (Number.isNaN(to) || Number.isNaN(c) || (c !== null && c < 0) || (to !== null && to < 0)) return error('cm2-result', `Check the numbers in tier ${k}.`);
        if (c === null) return error('cm2-result', `Tier ${k} has an upper limit but no commission. Enter a commission or clear the row.`);
        if (to !== null && to <= from) return error('cm2-result', `The upper limit of tier ${k} must be higher than the one before it.`);
        const top = to === null ? Infinity : to;
        const inTier = Math.max(0, Math.min(sales, top) - from);
        let amount = 0;
        if (unit === 'p') amount = (inTier * c) / 100; else if (sales > from) amount = c;
        const range = to === null ? `${moneyShort(from)} and up` : `${moneyShort(from)} to ${moneyShort(to)}`;
        lines.push([`${range} at ${unit === 'p' ? pct(c) : moneyShort(c) + ' flat'}`, amount]); total += amount;
        if (to === null) break;
        from = to;
      }
      if (!lines.length) return error('cm2-result', 'Define at least one commission tier.');
    }
    el('cm2-result').innerHTML =
      `<div class="summary-payment-box"><div class="label">Total commission</div><div class="value">${money(total)}</div><div class="label" style="margin-top:6px;">On sales of ${money(sales)}</div></div>` +
      lines.map(([l, a]) => row(l, money(a))).join('') + row('Total', money(total), '#10b981');
  }

  // Build the tier rows.
  (function buildTiers() {
    let html = '<div class="schedule-table-wrap" style="max-height:none;"><table class="schedule-table"><thead><tr><th>From</th><th>To</th><th>Commission</th></tr></thead><tbody>';
    const defs = [{ t: 20000, c: 3 }, { t: '', c: 5 }];
    for (let k = 1; k <= TIERS; k++) {
      const d = defs[k - 1] || { t: '', c: '' };
      const fromCell = k === 1 ? '$0' : `<span id="cm2-from${k}"></span>`;
      html += `<tr><td>${fromCell}</td><td><input type="number" id="cm2-t${k}" value="${d.t}" min="0" step="any" style="width:100px;"></td>` +
        `<td style="white-space:nowrap;"><input type="number" id="cm2-c${k}" value="${d.c}" min="0" step="any" style="width:80px;"> <select id="cm2-u${k}" class="unit-select" style="width:auto;display:inline-block;"><option value="p">%</option><option value="d">$</option></select></td></tr>`;
    }
    el('cm2-tiers').innerHTML = html + '</tbody></table></div>';
    const sync = () => { for (let k = 2; k <= TIERS; k++) { const prev = read(`cm2-t${k - 1}`); el(`cm2-from${k}`).textContent = prev === null || Number.isNaN(prev) ? '' : '$' + prev.toLocaleString('en-US'); } };
    for (let k = 1; k <= TIERS; k++) el(`cm2-t${k}`).addEventListener('input', sync);
    sync();
  })();

  el('cm1-form').addEventListener('submit', (e) => { e.preventDefault(); simple(); });
  el('cm2-form').addEventListener('submit', (e) => { e.preventDefault(); tiered(); });
  document.querySelectorAll('input[name="cm2-base"], input[name="cm2-vary"]').forEach((n) => n.addEventListener('change', () => { applyVisibility(); tiered(); }));
  el('cm1-clear').addEventListener('click', () => { ['cm1-price', 'cm1-rate', 'cm1-comm'].forEach((id) => { el(id).value = ''; }); el('cm1-result').innerHTML = ''; });
  applyVisibility();
  simple();
  tiered();
})();
