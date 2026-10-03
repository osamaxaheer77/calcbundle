'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  if (!el('tc-form')) return;

  const DAYS = 7;
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const error = (msg) => { el('tc-result').innerHTML = `<p class="tool-result is-error">${msg}</p>`; };
  const money = (v) => '$' + (Math.round(v * 100 + 1e-7) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const hm = (sec) => { sec = Math.round(sec / 60) * 60; if (sec <= 0) return '0'; const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60); return (h ? h + 'h' : '') + (h && m ? ' ' : '') + (m ? m + 'm' : ''); };
  const rate = (v) => String(Math.round(v * 1e6) / 1e6);

  // A time like 8:00AM, 8.30, 8:30 or 15:30, as seconds since midnight. Without AM or PM it is read as 24-hour time.
  function parseTime(text) {
    const t = text.trim().toUpperCase().replace(/\s+/g, '');
    const m = /^(\d{1,2})(?:[:.](\d{1,2}))?(AM|PM|A|P)?$/.exec(t);
    if (!m) return null;
    let h = +m[1];
    const mi = m[2] === undefined ? 0 : +m[2];
    if (mi > 59) return null;
    if (m[3]) {
      if (h < 1 || h > 12) return null;
      h = (h % 12) + (m[3][0] === 'P' ? 12 : 0);
    } else if (h > 23) return null;
    return h * 3600 + mi * 60;
  }
  // A break like 0:30 or 30 (minutes). Empty means no break.
  function parseBreak(text) {
    const t = text.trim();
    if (t === '') return 0;
    let m = /^(\d{1,2})[:.](\d{1,2})$/.exec(t);
    if (m) return +m[2] > 59 ? null : (+m[1] * 60 + +m[2]) * 60;
    m = /^(\d{1,4})$/.exec(t);
    return m ? +m[1] * 60 : null;
  }
  const round = (sec, step) => (step > 0 ? Math.round(sec / (step * 60)) * step * 60 : sec);

  function calculate() {
    const days = [];
    for (let i = 1; i <= DAYS; i++) {
      const label = el('tc-l' + i).value.trim() || 'Day ' + i, f = el('tc-f' + i).value, t = el('tc-t' + i).value, b = el('tc-b' + i).value;
      if (f.trim() === '' && t.trim() === '') { days.push({ label, blank: true }); continue; }
      if (f.trim() === '' || t.trim() === '') return error(`${esc(label)} needs both a From time and a To time.`);
      const from = parseTime(f), to = parseTime(t), brk = parseBreak(b);
      if (from === null) return error(`The From time for ${esc(label)} is not a valid time.`);
      if (to === null) return error(`The To time for ${esc(label)} is not a valid time.`);
      if (brk === null) return error(`The break for ${esc(label)} is not valid. Use a format such as 0:30 or 30.`);
      let span = to - from;
      if (span < 0) span += 86400;
      days.push({ label, from: f.trim(), to: t.trim(), brk, raw: Math.max(0, span - brk) });
    }
    const worked = days.filter((d) => !d.blank);
    if (!worked.length) return error('Enter the From and To times for at least one day.');

    const pay = el('tc-pay').checked, mode = el('tc-ot').value, step = parseInt(el('tc-round').value, 10);
    const r = pay ? Number(el('tc-rate').value) : 0, mult = Number(el('tc-mult').value), dLim = Number(el('tc-d').value) * 3600, wLim = Number(el('tc-w').value) * 3600;
    if (pay) {
      if (!Number.isFinite(r) || r < 0 || el('tc-rate').value.trim() === '') return error('Enter a base pay rate of 0 or more.');
      if ((mode === 'd' || mode === 'nd') && (!Number.isFinite(dLim) || dLim < 0)) return error('Enter the hours per day, 0 or more.');
      if ((mode === 'w' || mode === 'nw') && (!Number.isFinite(wLim) || wLim < 0)) return error('Enter the hours per week, 0 or more.');
      if (mode !== 'n' && mode !== 'nd' && mode !== 'nw' && (!Number.isFinite(mult) || mult < 0)) return error('Enter an overtime rate of 0 or more.');
    }
    const daily = mode === 'd' || mode === 'nd';
    worked.forEach((d) => { d.hours = daily ? round(d.raw, step) : d.raw; });
    const totalRaw = worked.reduce((s, d) => s + d.raw, 0);
    const total = daily ? worked.reduce((s, d) => s + d.hours, 0) : round(totalRaw, step);
    const rounded = step > 0 && total !== totalRaw;

    // Pay
    let baseSec = 0, otSec = 0, paidBase = 0, otPay = 0, dayPay = null;
    if (pay) {
      if (mode === 'n') { baseSec = total; paidBase = (total / 3600) * r; }
      else if (mode === 'nw') { baseSec = Math.min(total, wLim); paidBase = (baseSec / 3600) * r; }
      else if (mode === 'w') { baseSec = Math.min(total, wLim); otSec = Math.max(0, total - wLim); paidBase = (baseSec / 3600) * r; otPay = (otSec / 3600) * r * mult; }
      else {
        dayPay = worked.map((d) => { const b = Math.min(d.hours, dLim), o = mode === 'd' ? Math.max(0, d.hours - dLim) : 0; return { b, o, bp: (b / 3600) * r, op: (o / 3600) * r * mult }; });
        baseSec = dayPay.reduce((s, d) => s + d.b, 0); otSec = dayPay.reduce((s, d) => s + d.o, 0);
        paidBase = dayPay.reduce((s, d) => s + d.bp, 0); otPay = dayPay.reduce((s, d) => s + d.op, 0);
      }
    }

    const showBlank = el('tc-blank').checked;
    let wi = 0;
    const head = `<tr><th>Date</th><th>Time</th><th>Hours</th>${daily && step > 0 ? '<th>Rounded</th>' : ''}${dayPay ? '<th>Base pay</th>' + (mode === 'd' ? '<th>Overtime</th>' : '') + '<th>Total</th>' : ''}</tr>`;
    const body = days.map((d) => {
      if (d.blank) return showBlank ? `<tr><td>${esc(d.label)}</td><td colspan="${2 + (daily && step > 0 ? 1 : 0) + (dayPay ? (mode === 'd' ? 3 : 2) : 0)}" style="color:var(--text-muted);">0</td></tr>` : '';
      const p = dayPay ? dayPay[wi] : null; wi += 1;
      return `<tr><td>${esc(d.label)}</td><td>${esc(d.from)}–${esc(d.to)}${d.brk ? `<br><span style="font-size:12px;color:var(--text-secondary);">${Math.round(d.brk / 60)} min break</span>` : ''}</td><td>${hm(d.raw)}</td>` +
        (daily && step > 0 ? `<td>${hm(d.hours)}</td>` : '') +
        (p ? `<td>${hm(p.b)} × ${money(r)}<br>= ${money(p.bp)}</td>` + (mode === 'd' ? `<td>${p.o ? `${hm(p.o)} × ${money(r)} × ${rate(mult)}<br>= ${money(p.op)}` : '0'}</td>` : '') + `<td>${money(p.bp + p.op)}</td>` : '') + '</tr>';
    }).join('');
    let html = '';
    const hdr = el('tc-header').value.trim();
    if (hdr) html += `<h3 style="margin:0 0 10px;font-size:17px;">${esc(hdr)}</h3>`;
    html += `<div class="summary-payment-box"><div class="label">Total hours</div><div class="value">${hm(total)}</div>${pay ? `<div class="label" style="margin-top:6px;">Total pay ${money(paidBase + otPay)}</div>` : ''}</div>` +
      `<div class="schedule-table-wrap" style="max-height:none;overflow-x:auto;margin-top:12px;"><table class="schedule-table"><thead>${head}</thead><tbody>${body}</tbody></table></div>`;
    const line = (l, v) => `<div class="stat-row"><span>${l}</span><strong>${v}</strong></div>`;
    html += line('Total hours', hm(totalRaw));
    if (rounded && !daily) html += line('Rounded hours', hm(total));
    if (pay) {
      if (mode === 'nw') html += line('Paid hours', `${hm(baseSec)} × ${money(r)}`);
      else html += line('Base pay', `${hm(baseSec)} × ${money(r)} = ${money(paidBase)}`);
      if (mode === 'w') html += line('Overtime pay', otSec ? `${hm(otSec)} × ${money(r)} × ${rate(mult)} = ${money(otPay)}` : '0');
      if (mode === 'd') html += line('Overtime pay', otSec ? `${hm(otSec)} × ${money(r)} × ${rate(mult)} = ${money(otPay)}` : '0');
      html += line('Total pay', money(paidBase + otPay));
    }
    const note = el('tc-note').value.trim();
    if (note) html += `<p style="font-size:13px;line-height:1.5;margin:12px 0 0;">${esc(note)}</p>`;
    el('tc-result').innerHTML = html;
  }

  function applyMode() {
    const mode = el('tc-ot').value, pay = el('tc-pay').checked;
    el('tc-pay-box').style.display = pay ? '' : 'none';
    el('tc-d-box').style.display = mode === 'd' || mode === 'nd' ? '' : 'none';
    el('tc-w-box').style.display = mode === 'w' || mode === 'nw' ? '' : 'none';
    el('tc-mult-box').style.display = mode === 'd' || mode === 'w' ? '' : 'none';
  }

  // Saving (only when the box is ticked)
  const KEY = 'cb-timecard';
  const FIELDS = [];
  for (let i = 1; i <= DAYS; i++) ['l', 'f', 't', 'b'].forEach((k) => FIELDS.push('tc-' + k + i));
  FIELDS.push('tc-round', 'tc-header', 'tc-note', 'tc-rate', 'tc-ot', 'tc-d', 'tc-w', 'tc-mult');
  const CHECKS = ['tc-pay', 'tc-blank'];
  function save() {
    try {
      if (!el('tc-save').checked) { localStorage.removeItem(KEY); return; }
      const data = { on: true, v: {}, c: {} };
      FIELDS.forEach((id) => { data.v[id] = el(id).value; });
      CHECKS.forEach((id) => { data.c[id] = el(id).checked; });
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) { /* storage may be unavailable */ }
  }
  function restore() {
    try {
      const data = JSON.parse(localStorage.getItem(KEY));
      if (!data || !data.on) return;
      FIELDS.forEach((id) => { if (data.v[id] !== undefined) el(id).value = data.v[id]; });
      CHECKS.forEach((id) => { if (data.c[id] !== undefined) el(id).checked = data.c[id]; });
      el('tc-save').checked = true;
    } catch (e) { /* nothing saved */ }
  }

  el('tc-copy').addEventListener('click', () => {
    for (let i = 2; i <= DAYS; i++) ['f', 't', 'b'].forEach((k) => { el('tc-' + k + i).value = el('tc-' + k + '1').value; });
    calculate(); save();
  });
  el('tc-clear').addEventListener('click', () => {
    for (let i = 1; i <= DAYS; i++) ['f', 't', 'b'].forEach((k) => { el('tc-' + k + i).value = ''; });
    el('tc-result').innerHTML = '<p class="tool-result is-error">Enter the From and To times for at least one day.</p>'; save();
  });
  el('tc-print').addEventListener('click', () => { calculate(); window.print(); });
  el('tc-form').addEventListener('submit', (e) => { e.preventDefault(); calculate(); save(); });
  el('tc-form').addEventListener('input', () => { applyMode(); calculate(); save(); });
  el('tc-form').addEventListener('change', () => { applyMode(); calculate(); save(); });
  restore();
  applyMode();
  calculate();
})();
