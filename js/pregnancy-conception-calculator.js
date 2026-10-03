'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('pcn-form');
  if (!form) return;

  const DAY = 86400000;
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const utc = (y, m, d) => new Date(Date.UTC(y, m - 1, d));
  const add = (d, n) => new Date(d.getTime() + n * DAY);
  const fmt = (d) => `${MON[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
  const pad = (n) => String(n).padStart(2, '0');
  const error = (msg) => { el('pcn-result').innerHTML = `<p class="tool-result is-error">${msg}</p>`; };

  function readDate(id) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(el(id).value);
    if (!m) return null;
    const d = utc(+m[1], +m[2], +m[3]);
    return d.getUTCMonth() === +m[2] - 1 && +m[1] >= 1900 && +m[1] <= 2200 ? d : null;
  }

  function calculate() {
    const method = el('pcn-method').value;
    let conception;
    if (method === 'due') {
      const due = readDate('pcn-due');
      if (!due) return error('Enter your due date.');
      conception = add(due, -266);
    } else if (method === 'lmp') {
      const lmp = readDate('pcn-lmp');
      if (!lmp) return error('Enter the first day of your last period.');
      conception = add(lmp, parseInt(el('pcn-cycle').value, 10) - 14);
    } else {
      const us = readDate('pcn-us-date');
      const w = Number(el('pcn-us-weeks').value), d = Number(el('pcn-us-days').value);
      if (!us) return error('Enter the ultrasound date.');
      if (!Number.isInteger(w) || w < 0 || w > 42 || !Number.isInteger(d) || d < 0 || d > 6) return error('Enter the pregnancy length as whole weeks (0 to 42) and days (0 to 6).');
      conception = add(us, -(w * 7 + d) + 14);
    }
    const range = (a, b) => `${fmt(add(conception, a))} – ${fmt(add(conception, b))}`;
    el('pcn-result').innerHTML =
      `<div class="summary-payment-box"><div class="label">Most probable conception dates</div><div class="value" style="font-size:22px;">${range(-2, 2)}</div></div>` +
      `<div class="stat-row" style="display:block;"><span>Most probable dates of intercourse</span><br><strong>${range(-5, 2)}</strong></div>` +
      `<div class="stat-row" style="display:block;"><span>Possible conception dates</span><br><strong>${range(-3, 7)}</strong></div>` +
      `<div class="stat-row" style="display:block;"><span>Possible dates of intercourse</span><br><strong>${range(-8, 7)}</strong></div>` +
      '<p style="font-size:12px;color:var(--text-secondary);margin:12px 0 0;">These dates are estimates only.</p>';
  }

  function applyMethod() {
    const m = el('pcn-method').value;
    el('pcn-due-box').style.display = m === 'due' ? '' : 'none';
    el('pcn-lmp-box').style.display = m === 'lmp' ? '' : 'none';
    el('pcn-us-box').style.display = m === 'us' ? '' : 'none';
  }

  (function defaults() {
    const t = new Date();
    const today = utc(t.getFullYear(), t.getMonth() + 1, t.getDate());
    const iso = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
    el('pcn-due').value = iso(add(today, 180));
    el('pcn-lmp').value = iso(add(today, -100));
    el('pcn-us-date').value = iso(today);
  })();
  el('pcn-method').addEventListener('change', () => { applyMethod(); calculate(); });
  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  applyMethod();
  calculate();
})();
