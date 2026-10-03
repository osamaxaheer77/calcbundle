'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('cn-form');
  if (!form) return;

  const DAY = 86400000;
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const utc = (y, m, d) => new Date(Date.UTC(y, m - 1, d));
  const add = (d, n) => new Date(d.getTime() + n * DAY);
  const fmt = (d) => `${MON[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
  const fmtShort = (d) => `${MON[d.getUTCMonth()]} ${d.getUTCDate()}`;
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  const error = (msg) => { el('cn-result').innerHTML = `<p class="tool-result is-error">${msg}</p>`; el('cn-extra').hidden = true; };
  const range = (a, b) => `${fmtShort(a)} – ${fmtShort(b)}`;
  const row = (l, v) => `<div class="stat-row"><span>${l}</span><strong>${v}</strong></div>`;

  function readDate(id) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(el(id).value);
    if (!m) return null;
    const d = utc(+m[1], +m[2], +m[3]);
    return d.getUTCMonth() === +m[2] - 1 && +m[1] >= 1900 && +m[1] <= 2200 ? d : null;
  }

  function calendar(ovulation, marks) {
    const y = ovulation.getUTCFullYear(), m = ovulation.getUTCMonth();
    const first = utc(y, m + 1, 1), days = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    el('cn-cal-title').textContent = `${MONTHS[m]} ${y}`;
    let h = '<table class="schedule-table" style="text-align:center;table-layout:fixed;"><thead><tr>' + ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d) => `<th style="text-align:center;">${d}</th>`).join('') + '</tr></thead><tbody><tr>';
    for (let i = 0; i < first.getUTCDay(); i++) h += '<td></td>';
    for (let d = 1; d <= days; d++) {
      const k = (first.getUTCDay() + d - 1) % 7;
      if (k === 0 && d > 1) h += '</tr><tr>';
      const t = utc(y, m + 1, d).getTime();
      const mk = marks.find((x) => t >= x.from.getTime() && t <= x.to.getTime());
      h += `<td style="${mk ? `background:${mk.color};color:#fff;border-radius:6px;font-weight:600;` : ''}">${d}</td>`;
    }
    h += '</tr></tbody></table>';
    el('cn-cal').innerHTML = h;
  }

  function calculate() {
    const lmp = readDate('cn-lmp');
    if (!lmp) return error('Enter the first day of your last period.');
    const cycle = parseInt(el('cn-cycle').value, 10);
    const ov = add(lmp, cycle - 14);
    const next = add(lmp, cycle);
    const due = add(lmp, 280 + (cycle - 28));
    const probable = [add(ov, -2), add(ov, 3)];
    el('cn-result').innerHTML =
      '<div class="summary-payment-box"><div class="label">Most probable conception days</div><div class="value" style="font-size:24px;">' + range(probable[0], probable[1]) + '</div></div>' +
      row('Ovulation window', range(add(ov, -2), add(ov, 2))) +
      row('Best days for intercourse', range(add(ov, -5), add(ov, 2))) +
      row('Pregnancy test', fmt(add(next, -5))) +
      row('Next period starts', fmt(next)) +
      row('Due date if pregnant', fmt(due));

    calendar(ov, [
      { from: add(ov, -5), to: add(ov, -3), color: '#3b82f6' },
      { from: add(ov, -2), to: add(ov, 3), color: '#10b981' },
      { from: add(next, -5), to: add(next, -5), color: '#f59e0b' },
      { from: next, to: next, color: '#ef4444' },
    ]);
    el('cn-cal').insertAdjacentHTML('beforeend', '<p style="font-size:12px;color:var(--text-secondary);margin:8px 0 0;"><span style="color:#3b82f6;">&#9632;</span> early fertile days &nbsp; <span style="color:#10b981;">&#9632;</span> most probable conception days &nbsp; <span style="color:#f59e0b;">&#9632;</span> pregnancy test &nbsp; <span style="color:#ef4444;">&#9632;</span> next period</p>');

    let t = '<table class="schedule-table"><thead><tr><th>Period start</th><th>Conception window</th><th>Due date</th></tr></thead><tbody>';
    for (let k = 0; k < 6; k++) {
      const start = add(lmp, k * cycle), o = add(start, cycle - 14);
      t += `<tr><td>${fmt(start)}</td><td>${range(add(o, -2), add(o, 3))}</td><td>${fmt(add(start, 280 + (cycle - 28)))}</td></tr>`;
    }
    el('cn-table').innerHTML = t + '</tbody></table>';
    el('cn-extra').hidden = false;
  }

  (function defaults() {
    const t = new Date();
    el('cn-lmp').value = iso(utc(t.getFullYear(), t.getMonth() + 1, t.getDate()));
  })();
  el('cn-cycle').addEventListener('change', calculate);
  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  calculate();
})();
