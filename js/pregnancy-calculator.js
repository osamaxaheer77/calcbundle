'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('preg-form');
  if (!form) return;

  const DAY = 24 * 60 * 60 * 1000;

  function parseDate(id) {
    const v = el(id).value;
    if (!v) return null;
    const d = new Date(v + 'T00:00:00');
    return isNaN(d) ? null : d;
  }

  function addDays(date, days) {
    return new Date(date.getTime() + days * DAY);
  }

  function fmtDate(d) {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function fmtDateShort(d) {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  const MILESTONES = {
    3: 'Baby conceived',
    4: 'Pregnancy test positive',
    6: 'Heartbeat detectable by ultrasound',
    13: 'Second trimester begins &mdash; miscarriage risk decreases',
    18: 'Baby begins making noticeable movements, can hear sounds, and gender can be found out',
    23: 'Premature baby may survive',
    28: 'Third trimester begins &mdash; baby can breathe',
    38: 'Full term',
  };

  function trimesterOf(week) {
    if (week <= 12) return 'first';
    if (week <= 27) return 'second';
    return 'third';
  }

  function calculate() {
    const mode = form.querySelector('input[name="preg-mode"]:checked').value;
    let lmp;

    if (mode === 'lastperiod') {
      lmp = parseDate('preg-lastperiod');
      if (!lmp) { showError(); return; }
    } else if (mode === 'duedate') {
      const dueDate = parseDate('preg-duedate');
      if (!dueDate) { showError(); return; }
      lmp = addDays(dueDate, -280);
    } else {
      const conception = parseDate('preg-conception');
      if (!conception) { showError(); return; }
      lmp = addDays(conception, -14);
    }

    const dueDate = addDays(lmp, 280);
    const conceptionDate = addDays(lmp, 14);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const daysSinceLMP = Math.round((today - lmp) / DAY);
    const weeksExact = Math.floor(daysSinceLMP / 7);
    const daysExact = daysSinceLMP - weeksExact * 7;
    const currentWeek = weeksExact + 1;
    const percentThrough = Math.max(0, Math.min(100, daysSinceLMP / 280 * 100));

    if (daysSinceLMP < 0 || daysSinceLMP > 320) {
      el('preg-result').innerHTML = `
        <div class="summary-payment-box">
          <div class="label">Due Date</div>
          <div class="value">${fmtDate(dueDate)}</div>
        </div>
        <div class="stat-row"><span>Estimated Last Menstrual Period</span><strong>${fmtDate(lmp)}</strong></div>
        <div class="stat-row"><span>Estimated Conception Date</span><strong>${fmtDate(conceptionDate)}</strong></div>
        <p class="tool-result" style="margin-top:12px;color:var(--text-muted);">This date is outside the typical pregnancy window relative to today, so a current-week progress summary isn't shown.</p>
      `;
      renderSchedule(lmp, null);
      return;
    }

    el('preg-result').innerHTML = `
      <div class="summary-payment-box">
        <div class="label">Current Progress</div>
        <div class="value">Week ${currentWeek}</div>
        <div style="font-size:13px;color:var(--text-muted);margin-top:4px;">${weeksExact} weeks ${daysExact} days &middot; ${trimesterOf(currentWeek)} trimester</div>
      </div>
      <div class="stat-row"><span>Due Date</span><strong>${fmtDate(dueDate)}</strong></div>
      <div class="stat-row"><span>Estimated Last Menstrual Period</span><strong>${fmtDate(lmp)}</strong></div>
      <div class="stat-row"><span>Estimated Conception Date</span><strong>${fmtDate(conceptionDate)}</strong></div>
      <div class="stat-row"><span>Progress</span><strong>${percentThrough.toFixed(0)}% through pregnancy</strong></div>
    `;

    renderSchedule(lmp, currentWeek);
  }

  function renderSchedule(lmp, currentWeek) {
    let html = '<table class="schedule-table"><thead><tr><th>Week</th><th>Date Range</th><th>Trimester</th><th>Milestones</th></tr></thead><tbody>';
    let lastTrimester = null;
    for (let w = 1; w <= 42; w++) {
      const start = addDays(lmp, (w - 1) * 7 + 1);
      const end = addDays(start, 6);
      const trimester = trimesterOf(w);
      const trimesterLabel = trimester !== lastTrimester ? trimester + ' trimester' : '';
      lastTrimester = trimester;
      const isToday = w === currentWeek;
      const milestone = MILESTONES[w] || '';
      html += `<tr${isToday ? ' style="background:var(--accent-tint);"' : ''}><td>Week ${w}</td><td>${fmtDateShort(start)} &ndash; ${fmtDateShort(end)}${isToday ? ' (today)' : ''}</td><td>${trimesterLabel}</td><td>${milestone}</td></tr>`;
    }
    html += '</tbody></table>';
    el('preg-table-wrap').innerHTML = html;
    el('preg-results-section').hidden = false;
  }

  function showError() {
    el('preg-result').innerHTML = '<p class="tool-result is-error">Enter a valid date.</p>';
    el('preg-results-section').hidden = true;
  }

  function updateVisibility() {
    const mode = form.querySelector('input[name="preg-mode"]:checked').value;
    el('preg-duedate-field').hidden = mode !== 'duedate';
    el('preg-lastperiod-field').hidden = mode !== 'lastperiod';
    el('preg-conception-field').hidden = mode !== 'conception';
  }

  form.querySelectorAll('input[name="preg-mode"]').forEach((r) => r.addEventListener('change', () => { updateVisibility(); calculate(); }));
  form.querySelectorAll('input[type="date"]').forEach((i) => i.addEventListener('change', calculate));
  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });

  updateVisibility();
  calculate();
})();
