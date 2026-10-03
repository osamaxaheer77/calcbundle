'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  if (!el('pc-form')) return;

  const MILE = 1609.344, YARD = 0.9144, MARATHON = 42195, HALF = 21097.5;
  const DIST_UNITS = { Miles: MILE, Kilometers: 1000, Meters: 1, Yards: YARD };
  const PACE_UNITS = {
    tpm: { name: 'per mile', time: true, toSpm: (v) => v / MILE, fromSpm: (s) => s * MILE },
    tpk: { name: 'per kilometer', time: true, toSpm: (v) => v / 1000, fromSpm: (s) => s * 1000 },
    mph: { name: 'miles per hour', toSpm: (v) => 3600 / (v * MILE), fromSpm: (s) => 3600 / (s * MILE) },
    kph: { name: 'kilometers per hour', toSpm: (v) => 3600 / (v * 1000), fromSpm: (s) => 3600 / (s * 1000) },
    mpm: { name: 'meters per minute', toSpm: (v) => 60 / v, fromSpm: (s) => 60 / s },
    mps: { name: 'meters per second', toSpm: (v) => 1 / v, fromSpm: (s) => 1 / s },
    ypm: { name: 'yards per minute', toSpm: (v) => 60 / (v * YARD), fromSpm: (s) => 60 / (s * YARD) },
    yps: { name: 'yards per second', toSpm: (v) => 1 / (v * YARD), fromSpm: (s) => 1 / (s * YARD) },
  };

  const row = (label, v, c) => `<div class="stat-row"><span>${label}</span><strong${c ? ` style="color:${c}"` : ''}>${v}</strong></div>`;
  const error = (id, msg) => { el(id).innerHTML = `<p class="tool-result is-error">${msg}</p>`; };
  const num = (id) => { const raw = el(id).value.trim(); if (raw === '') return NaN; const v = Number(raw); return Number.isFinite(v) ? v : NaN; };
  const pad2 = (n) => String(n).padStart(2, '0');

  // "50:25" = 50 minutes 25 seconds, "1:50:25" = hours too, "45" = seconds.
  function parseTime(str) {
    const s = String(str).trim();
    if (!s) return NaN;
    const parts = s.split(':');
    if (parts.length > 3 || parts.some((p) => !/^\d*\.?\d*$/.test(p.trim()) || p.trim() === '' || p.trim() === '.')) return NaN;
    return parts.reduce((t, p) => t * 60 + Number(p), 0);
  }
  const trim = (v, d) => { const s = v.toFixed(d); return s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s; };
  const group = (s) => s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const fixed = (v, d) => { const s = trim(v, d); const [i, f] = s.split('.'); return group(i) + (f ? '.' + f : ''); };
  function sig(v, small, big) { // 3 significant digits below 1, 4 from 1 up
    if (v === 0) return '0';
    const n = v < 1 ? small : big;
    const d = Math.max(0, n - 1 - Math.floor(Math.log10(v)));
    return fixed(v, d);
  }

  function clock(sec) {
    const t = Math.round(sec);
    const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
    return h > 0 ? `${h}:${pad2(m)}:${pad2(s)}` : `${m}:${pad2(s)}`;
  }
  function words(sec) {
    let t = Math.round(sec * 100) / 100;
    const h = Math.floor(t / 3600); t -= h * 3600;
    const m = Math.floor(t / 60); const s = Math.round((t - m * 60) * 100) / 100;
    const parts = [];
    if (h) parts.push(`${h} hour${h === 1 ? '' : 's'}`);
    if (m) parts.push(`${m} minute${m === 1 ? '' : 's'}`);
    if (s || !parts.length) parts.push(`${trim(s, 2)} second${s === 1 ? '' : 's'}`);
    if (parts.length === 1) return parts[0];
    if (parts.length === 2) return parts.join(' and ');
    return `${parts[0]}, ${parts[1]}, and ${parts[2]}`;
  }
  // Pace value in a unit: a time for per-distance units, a number for speeds.
  function paceWords(spm, u, decimals) {
    const unit = PACE_UNITS[u], v = unit.fromSpm(spm);
    return unit.time ? `${words(v)} ${unit.name}` : `${fixed(v, decimals)} ${unit.name}`;
  }
  function paceShort(spm, u) {
    const unit = PACE_UNITS[u], v = unit.fromSpm(spm);
    if (!unit.time) return fixed(v, 2);
    const m = Math.floor(v / 60), s = Math.round((v - m * 60) * 100) / 100;
    return `${m}:${s < 10 ? '0' : ''}${trim(s, 2)}`;
  }
  function parsePace(id, u) {
    const unit = PACE_UNITS[u];
    const raw = el(id).value;
    const v = unit.time ? parseTime(raw) : (raw.trim() === '' ? NaN : Number(raw));
    if (!Number.isFinite(v) || v <= 0) return NaN;
    return unit.toSpm(v);
  }

  // ---------- Pace / time / distance ----------
  function metersText(m) {
    return `<div class="stat-row" style="display:block;"><strong>${sig(m / MILE, 3, 4)}</strong> miles, <strong>${sig(m / 1000, 3, 4)}</strong> kilometers,<br><strong>${fixed(m, 1)}</strong> meters, <strong>${fixed(m / YARD, 1)}</strong> yards</div>`;
  }
  function racesAndSplits(spm, totalM) {
    const races = [['1K', 1000], ['1 mile', MILE], ['3K', 3000], ['3 miles', 3 * MILE], ['5K', 5000], ['5 miles', 5 * MILE], ['10K', 10000], ['10 miles', 10 * MILE], ['Marathon', MARATHON], ['½ Marathon', HALF], ['400 meters', 400], ['800 meters', 800]];
    let html = '<h3 style="margin:18px 0 6px;font-size:15px;">Times for popular race distances at this pace</h3><div class="schedule-table-wrap" style="max-height:none;overflow-x:auto;"><table class="schedule-table"><tbody>';
    for (let i = 0; i < races.length; i += 2) {
      html += `<tr><td>${races[i][0]}</td><td>${clock(races[i][1] * spm)}</td><td>${races[i + 1][0]}</td><td>${clock(races[i + 1][1] * spm)}</td></tr>`;
    }
    html += '</tbody></table></div>';
    const CAP = 300;
    const split = (unitM, label) => {
      const n = Math.floor(totalM / unitM + 1e-9);
      if (n < 1) return '';
      let t = '<table class="schedule-table"><thead><tr><th>' + label + '</th><th>Time</th></tr></thead><tbody>';
      for (let k = 1; k <= Math.min(n, CAP); k++) t += `<tr><td>${k}${label === 'Kilometers' ? 'K' : ' mile' + (k > 1 ? 's' : '')}</td><td>${clock(k * unitM * spm)}</td></tr>`;
      return t + '</tbody></table>' + (n > CAP ? `<p style="font-size:12px;color:var(--text-secondary);">Showing the first ${CAP} splits.</p>` : '');
    };
    const km = split(1000, 'Kilometers'), mi = split(MILE, 'Miles');
    if (km || mi) html += '<h3 style="margin:18px 0 6px;font-size:15px;">Splits</h3>' + km + (mi ? '<div style="height:10px"></div>' + mi : '');
    return html;
  }

  function mainCalc() {
    const mode = el('pc-mode').value;
    const needTime = mode !== 'time', needDist = mode !== 'distance', needPace = mode !== 'pace';
    const unitKey = el('pc-dunit').value, pu = el('pc-punit').value;
    let secs, meters, spm;
    if (needTime) { secs = parseTime(el('pc-time').value); if (!(secs > 0)) return error('pc-result', 'Enter the time as hh:mm:ss, mm:ss or seconds, more than 0.'); }
    if (needDist) { const d = num('pc-dist'); if (!(d > 0)) return error('pc-result', 'Enter a distance more than 0.'); meters = d * DIST_UNITS[unitKey]; }
    if (needPace) { spm = parsePace('pc-pace', pu); if (!(spm > 0)) return error('pc-result', PACE_UNITS[pu].time ? 'Enter the pace as mm:ss, more than 0.' : 'Enter a pace more than 0.'); }
    let head;
    if (mode === 'pace') {
      spm = secs / meters;
      head = '<h3 style="margin:0 0 6px;font-size:15px;">Pace in different units</h3>' +
        ['tpm', 'tpk', 'mph', 'kph', 'mpm', 'mps'].map((u) => row(PACE_UNITS[u].name.charAt(0).toUpperCase() + PACE_UNITS[u].name.slice(1), PACE_UNITS[u].time ? words(PACE_UNITS[u].fromSpm(spm)) : fixed(PACE_UNITS[u].fromSpm(spm), 2))).join('');
    } else if (mode === 'time') {
      secs = meters * spm;
      head = `<div class="summary-payment-box"><div class="label">Time required</div><div class="value">${clock(secs)}</div><div class="label" style="margin-top:6px;">${words(secs)}</div></div>`;
    } else {
      meters = secs / spm;
      head = '<div class="summary-payment-box"><div class="label">Distance traveled</div><div class="value">' + sig(meters / MILE, 3, 4) + ' miles</div></div>' + metersText(meters);
    }
    el('pc-result').innerHTML = head + racesAndSplits(spm, meters);
  }

  function applyMode() {
    const mode = el('pc-mode').value;
    el('pc-time-box').style.display = mode === 'time' ? 'none' : '';
    el('pc-dist-box').style.display = mode === 'distance' ? 'none' : '';
    el('pc-pace-box').style.display = mode === 'pace' ? 'none' : '';
  }
  const EVENTS = { M: [42.195, 'Kilometers'], HM: [21.0975, 'Kilometers'], '1K': [1, 'Kilometers'], '5K': [5, 'Kilometers'], '10K': [10, 'Kilometers'], '1M': [1, 'Miles'], '5M': [5, 'Miles'], '10M': [10, 'Miles'], '800m': [800, 'Meters'], '1500m': [1500, 'Meters'] };
  el('pc-event').addEventListener('change', () => {
    const e = EVENTS[el('pc-event').value];
    if (e) { el('pc-dist').value = e[0]; el('pc-dunit').value = e[1]; }
  });
  el('pc-form').addEventListener('submit', (ev) => { ev.preventDefault(); mainCalc(); });
  el('pc-mode').addEventListener('change', () => { applyMode(); mainCalc(); });
  applyMode();
  mainCalc();

  // ---------- Multipoint ----------
  const MP_ROWS = 12;
  (function buildRows() {
    const defs = [[1, '3:25'], [2, '6:55'], [3, '10:25'], [4, '14:01'], [5, '17:25']];
    let html = '<div class="schedule-table-wrap" style="max-height:none;"><table class="schedule-table"><thead><tr><th>#</th><th>Distance</th><th></th><th>Time</th></tr></thead><tbody>';
    for (let k = 1; k <= MP_ROWS; k++) {
      const d = defs[k - 1] || ['', ''];
      html += `<tr><td>${k}.</td><td><input type="number" id="mp-d${k}" value="${d[0]}" min="0" step="any" style="width:80px;" aria-label="Distance ${k}"></td>` +
        `<td><select id="mp-u${k}" class="unit-select" style="width:auto;" aria-label="Unit ${k}"><option>Kilometers</option><option>Miles</option><option>Meters</option><option>Yards</option></select></td>` +
        `<td><input type="text" id="mp-t${k}" value="${d[1]}" placeholder="hh:mm:ss" style="width:90px;" aria-label="Time ${k}"></td></tr>`;
    }
    el('mp-rows').innerHTML = html + '</tbody></table></div>';
  })();
  function multipoint() {
    const pu = el('mp-punit').value;
    const pts = [];
    for (let k = 1; k <= MP_ROWS; k++) {
      const dRaw = el(`mp-d${k}`).value.trim(), tRaw = el(`mp-t${k}`).value.trim();
      if (dRaw === '' && tRaw === '') continue;
      const d = Number(dRaw), t = parseTime(tRaw);
      if (dRaw === '' || !(d > 0) || !(t > 0)) return error('mp-result', `Check the distance and time on row ${k}. Both are needed and must be more than 0.`);
      pts.push({ k, m: d * DIST_UNITS[el(`mp-u${k}`).value], t });
    }
    if (!pts.length) return error('mp-result', 'Enter at least one distance and time.');
    for (let i = 1; i < pts.length; i++) {
      if (pts[i].m <= pts[i - 1].m || pts[i].t <= pts[i - 1].t) return error('mp-result', `Row ${pts[i].k} must be farther and later than the row before it, because the distances and times are totals from the start.`);
    }
    const first = el(`mp-u${pts[0].k}`).value;
    let html = `<table class="schedule-table"><thead><tr><th></th><th>This section</th><th></th><th></th><th>Accumulated</th></tr><tr><th>#</th><th>Distance (${first})</th><th>Time</th><th>Pace (${PACE_UNITS[pu].name})</th><th>Pace</th></tr></thead><tbody>`;
    let pm = 0, pt = 0;
    pts.forEach((p, i) => {
      const dm = p.m - pm, dt = p.t - pt;
      html += `<tr><td>${i + 1}.</td><td>${fixed(dm / DIST_UNITS[first], 2)}</td><td>${clock(dt)}</td><td>${paceShort(dt / dm, pu)}</td><td>${paceShort(p.t / p.m, pu)}</td></tr>`;
      pm = p.m; pt = p.t;
    });
    const last = pts[pts.length - 1];
    el('mp-result').innerHTML =
      `<div class="summary-payment-box"><div class="label">Average pace</div><div class="value" style="font-size:22px;">${paceWords(last.t / last.m, pu, 2)}</div><div class="label" style="margin-top:6px;">Over ${fixed(last.m / DIST_UNITS[first], 2)} ${first.toLowerCase()} in ${words(last.t)}</div></div>` +
      '<div class="schedule-table-wrap" style="max-height:none;margin-top:14px;">' + html + '</tbody></table></div>';
  }
  el('mp-form').addEventListener('submit', (ev) => { ev.preventDefault(); multipoint(); });
  multipoint();

  // ---------- Pace converter ----------
  function converter() {
    const from = el('cv-from-unit').value, to = el('cv-to-unit').value;
    const spm = parsePace('cv-value', from);
    if (!(spm > 0)) return error('cv-result', PACE_UNITS[from].time ? 'Enter the pace as mm:ss, more than 0.' : 'Enter a pace more than 0.');
    const a = paceWords(spm, from, 3), b = paceWords(spm, to, 3);
    el('cv-result').innerHTML = `<div class="summary-payment-box"><div class="label">${a}</div><div class="value" style="font-size:22px;">= ${b}</div></div>`;
  }
  el('cv-form').addEventListener('submit', (ev) => { ev.preventDefault(); converter(); });
  converter();

  // ---------- Finish time ----------
  function finish() {
    const dn = num('ft-now'), df = num('ft-full'), t = parseTime(el('ft-time').value);
    if (!(dn > 0)) return error('ft-result', 'Enter the distance covered so far, more than 0.');
    if (!(t > 0)) return error('ft-result', 'Enter the elapsed time as hh:mm:ss, mm:ss or seconds, more than 0.');
    if (!(df > 0)) return error('ft-result', 'Enter the full distance, more than 0.');
    const un = el('ft-now-unit').value, uf = el('ft-full-unit').value;
    const spm = t / (dn * DIST_UNITS[un]);
    const total = spm * df * DIST_UNITS[uf];
    el('ft-result').innerHTML =
      `<div class="summary-payment-box"><div class="label">Estimated finish time</div><div class="value">${clock(total)}</div><div class="label" style="margin-top:6px;">At the current pace it will take ${words(total)} to finish ${fixed(df, 4)} ${uf.toLowerCase()}.</div></div>` +
      '<h3 style="margin:18px 0 6px;font-size:15px;">Your pace so far</h3>' +
      ['tpm', 'tpk', 'mph', 'kph', 'mpm', 'mps', 'ypm', 'yps'].map((u) => row(PACE_UNITS[u].name.charAt(0).toUpperCase() + PACE_UNITS[u].name.slice(1), PACE_UNITS[u].time ? words(PACE_UNITS[u].fromSpm(spm)) : fixed(PACE_UNITS[u].fromSpm(spm), 2))).join('');
  }
  el('ft-form').addEventListener('submit', (ev) => { ev.preventDefault(); finish(); });
  finish();
})();
