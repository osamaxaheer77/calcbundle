'use strict';

(function () {
  const U = window.DateUtils;
  const el = (id) => document.getElementById(id);
  if (!U || !el('d1-form')) return;

  const error = (id, msg) => { el(id).innerHTML = `<p class="tool-result is-error">${msg}</p>`; };
  const row = (l, v) => `<div class="stat-row"><span>${l}</span><strong>${v}</strong></div>`;
  const big = (label, value, sub) => `<div class="summary-payment-box"><div class="label">${label}</div><div class="value" style="font-size:22px;overflow-wrap:anywhere;">${value}</div>${sub ? `<div class="label" style="margin-top:6px;">${sub}</div>` : ''}</div>`;

  // Reads the hour, minute and second boxes with an AM/PM choice. Returns seconds or an error string.
  function read(p, who) {
    const v = ['h', 'm', 's'].map((k) => { const raw = el(`${p}-${who}${k}`).value.trim(); return raw === '' ? 0 : Number(raw); });
    const names = ['hour', 'minute', 'second'];
    for (let i = 0; i < 3; i++) if (!Number.isInteger(v[i]) || v[i] < 0 || v[i] > (i === 0 ? 23 : 59)) return `Enter a valid ${who === 's' ? 'start' : 'end'} ${names[i]}.`;
    const sec = U.parseClock(`${v[0]}:${v[1]}:${v[2]}`, el(`${p}-${who}u`).value);
    return sec === null ? `Enter a valid ${who === 's' ? 'start' : 'end'} time. Hours run from 1 to 12 with AM or PM, or 0 to 23.` : sec;
  }
  const totals = (sec) => row('In decimal hours', `${U.dec(sec / 3600, 4)} hours`) + row('In minutes', `${U.dec(sec / 60, 2)} minutes`) + row('In seconds', `${U.group(sec)} seconds`);

  function sameDay() {
    const s = read('d1', 's'), e = read('d1', 'e');
    if (typeof s === 'string') return error('d1-result', s);
    if (typeof e === 'string') return error('d1-result', e);
    let diff = e - s, prev = false;
    if (diff < 0) { diff += 86400; prev = true; }
    el('d1-result').innerHTML = big('Time between', U.span(diff, {}), `${U.clockText(s)} to ${U.clockText(e)}${prev ? ' (start assumed on the previous day)' : ''}`) + totals(diff);
  }

  function twoDates() {
    const sd = U.parseIso(el('d2-sd').value), ed = U.parseIso(el('d2-ed').value);
    if (sd === null || ed === null) return error('d2-result', 'Enter a valid start date and end date.');
    const s = read('d2', 's'), e = read('d2', 'e');
    if (typeof s === 'string') return error('d2-result', s);
    if (typeof e === 'string') return error('d2-result', e);
    const total = (ed - sd) * 86400 + (e - s);
    if (total < 0) return error('d2-result', 'The start must be earlier than the end.');
    el('d2-result').innerHTML = big('Time between', U.span(total, { days: true }), `${U.nameOf(sd)}, ${U.clockText(s)} to ${U.nameOf(ed)}, ${U.clockText(e)}`) +
      row('In days', `${U.dec(total / 86400, 4)} days`) + totals(total);
  }

  function setNow(prefix) {
    const t = new Date(), h = t.getHours();
    const [form, who] = prefix.split('-');
    el(`${form}-${who}h`).value = h % 12 === 0 ? 12 : h % 12;
    el(`${form}-${who}m`).value = t.getMinutes();
    el(`${form}-${who}s`).value = t.getSeconds();
    el(`${form}-${who}u`).value = h < 12 ? 'a' : 'p';
    if (form === 'd2') el(`d2-${who === 's' ? 'sd' : 'ed'}`).value = U.toIso(U.todayDays());
  }

  el('d2-sd').value = el('d2-ed').value = U.toIso(U.todayDays());
  document.querySelectorAll('[data-now]').forEach((b) => b.addEventListener('click', () => { setNow(b.dataset.now); sameDay(); twoDates(); }));
  el('d1-form').addEventListener('submit', (e) => { e.preventDefault(); sameDay(); });
  el('d2-form').addEventListener('submit', (e) => { e.preventDefault(); twoDates(); });
  el('d1-form').addEventListener('input', sameDay);
  el('d2-form').addEventListener('input', twoDates);
  sameDay();
  twoDates();
})();
