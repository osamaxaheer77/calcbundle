'use strict';

(function () {
  const U = window.DateUtils;
  const el = (id) => document.getElementById(id);
  if (!U || !el('h1-form')) return;

  const error = (id, msg) => { el(id).innerHTML = `<p class="tool-result is-error">${msg}</p>`; };
  const row = (l, v) => `<div class="stat-row"><span>${l}</span><strong>${v}</strong></div>`;
  const big = (label, value, sub) => `<div class="summary-payment-box"><div class="label">${label}</div><div class="value" style="font-size:24px;overflow-wrap:anywhere;">${value}</div>${sub ? `<div class="label" style="margin-top:6px;">${sub}</div>` : ''}</div>`;
  const totals = (sec) => row('Hours and minutes', `${U.plural(Math.floor(sec / 3600), 'hour')} ${U.plural(Math.floor((sec % 3600) / 60), 'minute')}${sec % 60 ? ' ' + U.plural(sec % 60, 'second') : ''}`) +
    row('In decimal hours', `${U.dec(sec / 3600, 4)} hours`) + row('In minutes', `${U.dec(sec / 60, 2)} minutes`);

  function sameDay() {
    const s = U.parseClock(el('h1-st').value, el('h1-su').value), e = U.parseClock(el('h1-et').value, el('h1-eu').value);
    if (s === null) return error('h1-result', 'Enter a valid start time, such as 8 or 8:30.');
    if (e === null) return error('h1-result', 'Enter a valid end time, such as 5 or 5:30.');
    let diff = e - s, prev = false;
    if (diff < 0) { diff += 86400; prev = true; }
    el('h1-result').innerHTML = big('Time between', U.span(diff, {}), `${U.clockText(s)} to ${U.clockText(e)}${prev ? ' (start assumed on the previous day)' : ''}`) + totals(diff);
  }

  function twoDates() {
    const sd = U.parseIso(el('h2-sd').value), ed = U.parseIso(el('h2-ed').value);
    if (sd === null || ed === null) return error('h2-result', 'Enter a valid start date and end date.');
    const s = U.parseClock(el('h2-st').value, el('h2-su').value), e = U.parseClock(el('h2-et').value, el('h2-eu').value);
    if (s === null) return error('h2-result', 'Enter a valid start time, such as 8 or 8:30.');
    if (e === null) return error('h2-result', 'Enter a valid end time, such as 5 or 5:30.');
    const total = (ed - sd) * 86400 + (e - s);
    if (total < 0) return error('h2-result', 'The start must be earlier than the end.');
    el('h2-result').innerHTML = big('Time between', U.span(total, { days: true }), `${U.nameOf(sd)}, ${U.clockText(s)} to ${U.nameOf(ed)}, ${U.clockText(e)}`) + totals(total);
  }

  // The Now buttons fill in the current time, and the date too for the second calculator.
  function setNow(prefix) {
    const t = new Date(), h = t.getHours();
    const h12 = h % 12 === 0 ? 12 : h % 12;
    const time = `${h12}:${U.pad(t.getMinutes())}`;
    const unit = h < 12 ? 'a' : 'p';
    const [form, which] = prefix.split('-');
    el(`${form}-${which === 's' ? 'st' : 'et'}`).value = time;
    el(`${form}-${which === 's' ? 'su' : 'eu'}`).value = unit;
    if (form === 'h2') el(`h2-${which === 's' ? 'sd' : 'ed'}`).value = U.toIso(U.todayDays());
  }

  el('h2-sd').value = el('h2-ed').value = U.toIso(U.todayDays());
  document.querySelectorAll('[data-now]').forEach((b) => b.addEventListener('click', () => { setNow(b.dataset.now); sameDay(); twoDates(); }));
  el('h1-form').addEventListener('submit', (e) => { e.preventDefault(); sameDay(); });
  el('h2-form').addEventListener('submit', (e) => { e.preventDefault(); twoDates(); });
  el('h1-form').addEventListener('input', sameDay);
  el('h2-form').addEventListener('input', twoDates);
  sameDay();
  twoDates();
})();
