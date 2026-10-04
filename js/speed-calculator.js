'use strict';

(function () {
  const C = window.CalcCommon;
  if (!C || !C.el('sp-form')) return;
  const el = C.el;

  // Speed units in meters per second: key, label, factor.
  const MI = 1609.344, FT = 0.3048, YD = 0.9144, IN = 0.0254;
  const SPEED = [
    ['ms', 'meters/second [m/s]', 1], ['kmh', 'kilometers/hour [km/h]', 1000 / 3600], ['mph', 'miles/hour [mph]', MI / 3600], ['kn', 'knots [kn]', 1852 / 3600],
    ['fts', 'feet/second [ft/s]', FT], ['kmmin', 'kilometers/minute [km/min]', 1000 / 60], ['kms', 'kilometers/second [km/s]', 1000],
    ['mh', 'meters/hour [m/h]', 1 / 3600], ['mmin', 'meters/minute [m/min]', 1 / 60],
    ['cmh', 'centimeters/hour [cm/h]', 0.01 / 3600], ['cmmin', 'centimeters/minute [cm/min]', 0.01 / 60], ['cms', 'centimeters/second [cm/s]', 0.01],
    ['mmh', 'millimeters/hour [mm/h]', 0.001 / 3600], ['mmmin', 'millimeters/minute [mm/min]', 0.001 / 60], ['mms', 'millimeters/second [mm/s]', 0.001],
    ['mimin', 'miles/minute [mi/min]', MI / 60], ['mis', 'miles/second [mi/s]', MI],
    ['ydh', 'yards/hour [yd/h]', YD / 3600], ['ydmin', 'yards/minute [yd/min]', YD / 60], ['yds', 'yards/second [yd/s]', YD],
    ['fth', 'feet/hour [ft/h]', FT / 3600], ['ftmin', 'feet/minute [ft/min]', FT / 60],
    ['inh', 'inches/hour [in/h]', IN / 3600], ['inmin', 'inches/minute [in/min]', IN / 60], ['ins', 'inches/second [in/s]', IN],
    ['c', 'light speed [c]', 299792458],
  ];
  const DIST = [
    ['mm', 'millimeters [mm]', 0.001], ['cm', 'centimeters [cm]', 0.01], ['m', 'meters [m]', 1], ['km', 'kilometers [km]', 1000],
    ['in', 'inches [in]', IN], ['ft', 'feet [ft]', FT], ['yd', 'yards [yd]', YD], ['mi', 'miles [mi]', MI], ['nmi', 'nautical miles [nmi]', 1852], ['ly', 'light years [ly]', 9460730472580800],
  ];
  const SBY = {}, DBY = {};
  SPEED.forEach((u) => { SBY[u[0]] = u; }); DIST.forEach((u) => { DBY[u[0]] = u; });
  const short = (u) => u[1].replace(/^.*\[(.*)\]$/, '$1');
  const fill = (id, list, sel) => { const s = el(id); list.forEach((u) => s.add(new Option(u[1], u[0]))); s.value = sel; };
  fill('sp-su', SPEED, 'ms'); fill('sp-du', DIST, 'm'); fill('cv-from', SPEED, 'mph'); fill('cv-to', SPEED, 'kmh');

  // Hours, minutes and seconds text for a number of seconds.
  function hms(sec) {
    const total = Math.round(sec * 1e6) / 1e6;
    const h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60);
    const s = Math.round((total - h * 3600 - m * 60) * 1e6) / 1e6;
    const parts = [];
    if (h) parts.push(`${C.group(h)} hr`);
    if (m) parts.push(`${m} min`);
    if (s || !parts.length) parts.push(`${C.dec(s, 6)} sec`);
    return parts.join(' ');
  }
  const stepBox = (lines) => `<div style="font-size:13px;line-height:1.7;margin:12px 0 4px;"><strong>Steps</strong><br>${lines.join('<br>')}</div>`;
  const alt = (title, items) => `<h3 style="font-size:15px;margin:16px 0 4px;">${title}</h3>` + items.map(([n, v]) => C.row(n, v)).join('');

  function run() {
    const out = 'sp-result', mode = el('sp-mode').value;
    const speed = C.num('sp-s'), dist = C.num('sp-d');
    const th = C.num('sp-th') || 0, tm = C.num('sp-tm') || 0, ts = C.num('sp-ts') || 0;
    const timeBad = [th, tm, ts].some((v) => !Number.isFinite(v) || v < 0);
    const sec = th * 3600 + tm * 60 + ts;
    const su = SBY[el('sp-su').value], du = DBY[el('sp-du').value];

    if (mode !== 'speed' && (speed === null || !Number.isFinite(speed) || speed < 0 || (mode === 'time' && speed === 0))) return C.error(out, mode === 'time' ? 'Enter the speed, more than 0.' : 'Enter the speed, 0 or more.');
    if (mode !== 'distance' && (dist === null || !Number.isFinite(dist) || dist < 0)) return C.error(out, 'Enter the distance, 0 or more.');
    if (mode !== 'time' && (timeBad || !(sec > 0))) return C.error(out, timeBad ? 'Enter the time with 0 or more hours, minutes and seconds.' : 'Enter a time of more than 0.');

    const timeText = `${C.sig(sec)} sec`;
    let html;
    if (mode === 'speed') {
      const mps = (dist * du[2]) / sec;
      if (!Number.isFinite(mps)) return C.error(out, 'That is too large to calculate.');
      html = C.big('Speed', `${C.sig(mps)} meters/second`) +
        stepBox(['speed = distance ÷ time', `= ${C.sig(dist)} ${short(du)} ÷ ${timeText}`, `= ${C.sig(mps)} meters/second`]) +
        alt('Speed in other units', [['kilometers/hour', C.sig(mps / SBY.kmh[2])], ['miles/hour', C.sig(mps / SBY.mph[2])], ['knots', C.sig(mps / SBY.kn[2])], ['feet/second', C.sig(mps / SBY.fts[2])]]);
    } else if (mode === 'distance') {
      const m = speed * su[2] * sec;
      if (!Number.isFinite(m)) return C.error(out, 'That is too large to calculate.');
      html = C.big('Distance', `${C.sig(m)} meters`) +
        stepBox(['distance = speed × time', `= ${C.sig(speed)} ${short(su)} × ${timeText}`, `= ${C.sig(m)} meters`]) +
        alt('Distance in other units', [['kilometers', C.sig(m / 1000)], ['miles', C.sig(m / MI)], ['feet', C.sig(m / FT)], ['yards', C.sig(m / YD)], ['nautical miles', C.sig(m / 1852)]]);
    } else {
      const t = (dist * du[2]) / (speed * su[2]);
      if (!Number.isFinite(t) || t > 1e15) return C.error(out, 'That is too large to calculate.');
      html = C.big('Time', hms(t), `${C.sig(t)} seconds`) +
        stepBox(['time = distance ÷ speed', `= ${C.sig(dist)} ${short(du)} ÷ ${C.sig(speed)} ${short(su)}`, `= ${C.sig(t)} sec`, `= ${hms(t)}`]) +
        alt('Time in other units', [['minutes', C.sig(t / 60)], ['hours', C.sig(t / 3600)], ['days', C.sig(t / 86400)]]);
    }
    el(out).innerHTML = html;
  }

  function convert() {
    const out = 'cv-result', v = C.num('cv-v');
    if (v === null) return C.error(out, 'Enter a value to convert.');
    if (!Number.isFinite(v)) return C.error(out, 'Enter a number no larger than 1,000,000,000,000,000.');
    const f = SBY[el('cv-from').value], t = SBY[el('cv-to').value];
    const r = (v * f[2]) / t[2];
    if (!Number.isFinite(r)) return C.error(out, 'That is too large to convert.');
    const name = (u) => u[1].replace(/ \[.*\]$/, '');
    el(out).innerHTML = C.big(`${C.sig(v)} ${name(f)} =`, `${C.sig(r)} ${name(t)}`, `1 ${short(f)} = ${C.sig(f[2] / t[2])} ${short(t)}`);
  }

  function applyMode() {
    const mode = el('sp-mode').value;
    el('sp-s-box').style.display = mode === 'speed' ? 'none' : '';
    el('sp-d-box').style.display = mode === 'distance' ? 'none' : '';
    el('sp-t-box').style.display = mode === 'time' ? 'none' : '';
  }
  el('sp-form').addEventListener('submit', (e) => { e.preventDefault(); run(); });
  el('sp-form').addEventListener('input', run);
  el('sp-form').addEventListener('change', () => { applyMode(); run(); });
  el('cv-form').addEventListener('submit', (e) => { e.preventDefault(); convert(); });
  el('cv-form').addEventListener('input', convert);
  el('cv-form').addEventListener('change', convert);
  applyMode();
  run();
  convert();
})();
