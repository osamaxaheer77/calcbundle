'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  if (!el('cb-form')) return;

  const LB_PER_KG = 2.2046226218;
  // Calories burned in one hour at body weights of 125, 155 and 185 pounds.
  const GROUPS = [
    ['Walking, Running, Cycling, Swimming', [
      ['Walking: slow', 127.32, 147.64, 172.62], ['Walking: moderate', 165.52, 191.94, 224.4], ['Walking: fast', 214, 266, 318], ['Walking: very fast', 270, 350, 378],
      ['Hiking: cross-country', 340, 432, 504],
      ['Running: slow', 480, 576, 672], ['Running: moderate', 615, 738, 861], ['Running: fast', 750, 900, 1050], ['Running: very fast', 906, 1124, 1342], ['Running: cross-country', 510, 632, 754],
      ['Cycling: slow', 480, 576, 672], ['Cycling: moderate', 600, 720, 840], ['Cycling: fast', 720, 864, 1008], ['Cycling: very fast', 990, 1188, 1386], ['Cycling: BMX or mountain', 510, 612, 714],
      ['Swimming: moderate', 360, 432, 504], ['Swimming: laps, vigorous', 600, 720, 840]]],
    ['Gym Activities', [
      ['Aerobics: low impact', 330, 396, 462], ['Aerobics: high impact', 420, 504, 588], ['Aerobics: water', 240, 288, 336],
      ['Aerobics, step: low impact', 420, 504, 588], ['Aerobics, step: high impact', 600, 720, 840],
      ['Calisthenics: moderate', 270, 324, 378], ['Calisthenics: vigorous', 480, 612, 672],
      ['Circuit training: general', 480, 556.6, 650.76],
      ['Cycling, stationary: moderate', 420, 504, 588], ['Cycling, stationary: vigorous', 630, 756, 882],
      ['Elliptical trainer: general', 540, 648, 756],
      ['Rowing, stationary: moderate', 420, 504, 588], ['Rowing, stationary: vigorous', 510, 612, 714],
      ['Ski machine: general', 570, 684, 798], ['Stair step machine: general', 360, 432, 504],
      ['Stretching, hatha yoga', 240, 288, 336],
      ['Weight lifting: general', 180, 216, 252], ['Weight lifting: vigorous', 360, 432, 504]]],
    ['Training and Sports Activities', [
      ['Badminton: general', 228, 282, 336], ['Basketball: playing a game', 480, 576, 672], ['Basketball: wheelchair', 390, 468, 546],
      ['Billiards', 159.16, 184.56, 215.77], ['Bowling', 180, 216, 244.03], ['Boxing: sparring', 540, 648, 756],
      ['Dancing: slow, waltz, foxtrot', 180, 216, 250], ['Dancing: disco, ballroom, square', 330, 396, 462], ['Dancing: fast, ballet, twist', 360, 432, 504],
      ['Fencing: general', 381.97, 442.93, 517.86],
      ['Football: touch, flag, general', 480, 576, 672], ['Football: competitive', 540, 648, 756],
      ['Frisbee', 170, 210, 250],
      ['Golf: using cart', 210, 252, 294], ['Golf: carrying clubs', 330, 396, 462],
      ['Gymnastics: general', 240, 288, 336], ['Handball: general', 720, 864, 1008], ['Hockey: field and ice', 480, 576, 672],
      ['Horseback riding: general', 114, 140, 168], ['Ice skating: general', 420, 504, 588],
      ['Kayaking', 300, 360, 420], ['Martial arts: judo, karate, kickbox', 600, 720, 840],
      ['Racquetball: casual, general', 420, 504, 586], ['Racquetball: competitive', 600, 720, 840],
      ['Rock climbing: ascending', 452, 562, 670], ['Rock climbing: rappelling', 454, 564, 672],
      ['Rollerblading or skating: casual', 622, 772, 922], ['Rollerblading or skating: fast', 680, 842, 1006],
      ['Rope jumping: slow', 452, 562, 670], ['Rope jumping: fast', 680, 842, 1006],
      ['Rugby: competitive', 636.62, 738.22, 863.09], ['Scuba or skin diving', 420, 504, 588],
      ['Skateboarding', 300, 360, 420], ['Skiing: cross-country', 396, 492, 586], ['Skiing: downhill', 360, 432, 504],
      ['Sledding, luge, toboggan', 398, 494, 588], ['Snow shoeing', 480, 576, 672], ['Soccer: general', 420, 504, 588],
      ['Softball: general play', 282, 360, 420], ['Tai chi', 240, 288, 336], ['Tennis: general', 420, 504, 588],
      ['Volleyball: non-competitive, general play', 180, 216, 252], ['Volleyball: competitive, gymnasium play', 452, 562, 670], ['Volleyball: beach', 480, 576, 672],
      ['Water polo', 600, 720, 840], ['Water skiing', 360, 432, 504], ['Water volleyball', 180, 216, 252],
      ['Whitewater: rafting, kayaking', 300, 360, 420], ['Wrestling', 360, 432, 504]]],
    ['Outdoor Activities', [
      ['Carrying and stacking wood', 284, 352, 420], ['Chopping and splitting wood', 360, 432, 504], ['Fishing', 286.48, 332.2, 388.39],
      ['Gardening: general', 270, 324, 378], ['Mowing lawn: push, hand', 330, 396, 462], ['Mowing lawn: push, power', 270, 324, 378],
      ['Operate snow blower: walking', 270, 324, 378], ['Raking lawn', 240, 288, 336], ['Shoveling snow: by hand', 360, 432, 504]]],
    ['Home and Daily Life Activities', [
      ['Cooking', 114, 140, 168], ['Food shopping: with cart', 170, 212, 252], ['Heavy cleaning: wash car, windows', 270, 324, 378],
      ['Moving: carrying boxes', 420, 504, 588], ['Moving: household furniture', 340, 422, 504],
      ['Paint, paper, remodel: inside', 284, 352, 420], ['Playing with kids: moderate effort', 228, 282, 336],
      ['Reading: sitting', 68, 80, 94], ['Sex', 369.24, 428.17, 500.59], ['Sleeping', 38, 44, 52],
      ['Standing in line', 56, 70, 82], ['Watching TV', 63.66, 73.82, 86.31]]],
  ];
  const BY_NAME = {};
  GROUPS.forEach(([, list]) => list.forEach((a) => { BY_NAME[a[0]] = a; }));

  const ANCH_LB = [125, 155, 185];
  const ANCH_KG = ANCH_LB.map((w) => w / LB_PER_KG);
  // Calories per hour for an activity at a body weight. The per-kilogram rate is held flat below
  // 125 lb and above 185 lb and moves in a straight line between the anchor weights.
  function perHour(a, kg) {
    const rate = [1, 2, 3].map((i) => a[i] / ANCH_KG[i - 1]);
    const lb = kg * LB_PER_KG;
    let r;
    if (lb <= ANCH_LB[0]) r = rate[0];
    else if (lb >= ANCH_LB[2]) r = rate[2];
    else if (lb <= ANCH_LB[1]) r = rate[0] + ((lb - ANCH_LB[0]) / (ANCH_LB[1] - ANCH_LB[0])) * (rate[1] - rate[0]);
    else r = rate[1] + ((lb - ANCH_LB[1]) / (ANCH_LB[2] - ANCH_LB[1])) * (rate[2] - rate[1]);
    return r * kg;
  }

  const num = (id) => { const raw = el(id).value.trim(); if (raw === '') return NaN; const v = Number(raw); return Number.isFinite(v) ? v : NaN; };
  const error = (id, msg) => { el(id).innerHTML = `<p class="tool-result is-error">${msg}</p>`; };
  const group = (s) => s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const cal = (v) => (v < 10 ? (Math.round(v * 10) / 10).toString() : group(String(Math.round(v))));
  const plural = (n, w) => `${n} ${w}${Number(n) === 1 ? '' : 's'}`;
  const trim = (v) => String(Math.round(v * 100) / 100);

  function readWeight(idp) {
    const w = num(idp + '-weight'), unit = el(idp + '-wunit').value;
    if (!Number.isFinite(w)) return { err: 'Enter your body weight.' };
    if (unit === 'k') { if (w < 35 || w > 160) return { err: 'Enter a body weight between 35 and 160 kilograms.' }; return { kg: w }; }
    if (w < 80 || w > 350) return { err: 'Enter a body weight between 80 and 350 pounds.' };
    return { kg: w / LB_PER_KG };
  }

  // ---------- By duration ----------
  function buildActivity() {
    const g = GROUPS[Number(el('cb-group').value)][1];
    el('cb-activity').innerHTML = g.map((a) => `<option>${a[0]}</option>`).join('');
  }
  function byDuration() {
    const a = BY_NAME[el('cb-activity').value];
    const h = el('cb-hours').value.trim() === '' ? 0 : num('cb-hours'), m = el('cb-mins').value.trim() === '' ? 0 : num('cb-mins');
    if (!Number.isFinite(h) || !Number.isFinite(m) || h < 0 || m < 0) return error('cb-result', 'Enter a valid duration, 0 or more.');
    if (h * 60 + m <= 0) return error('cb-result', 'Enter a duration.');
    const wt = readWeight('cb');
    if (wt.err) return error('cb-result', wt.err);
    const hours = h + m / 60;
    const total = perHour(a, wt.kg) * hours;
    const parts = [];
    if (h) parts.push(plural(trim(h), 'hour'));
    if (m) parts.push(plural(trim(m), 'minute'));
    el('cb-result').innerHTML =
      `<div class="summary-payment-box"><div class="label">Calories burned</div><div class="value">${cal(total)}</div><div class="label" style="margin-top:6px;">${a[0]} for ${parts.join(' and ')}</div></div>` +
      `<div class="stat-row"><span>Per hour at this weight</span><strong>${cal(perHour(a, wt.kg))}</strong></div>` +
      `<div class="stat-row"><span>Per minute</span><strong>${cal(perHour(a, wt.kg) / 60)}</strong></div>`;
  }

  // ---------- By distance ----------
  const PACE = { w: ['Walking', 0.5, 8, [['Walking: slow', 2], ['Walking: moderate', 2.8], ['Walking: fast', 3.5], ['Walking: very fast', 4]]],
    r: ['Running', 2, 13, [['Running: slow', 5], ['Running: moderate', 6], ['Running: fast', 7.5], ['Running: very fast', 10]]],
    b: ['Cycling', 5.5, 35, [['Cycling: slow', 13], ['Cycling: moderate', 15], ['Cycling: fast', 17.5], ['Cycling: very fast', 21]]] };
  const MPH = { mph: (v) => v, kph: (v) => v * 0.621371192, mps: (v) => v * 2.2369362921, yps: (v) => v * 2.0454545455, mpm: (v) => 60 / v, mpk: (v) => 60 * 0.621371192 / v };
  const SPEED_NAMES = { mph: 'miles per hour', kph: 'kilometers per hour', mps: 'meters per second', yps: 'yards per second', mpm: 'minutes per mile', mpk: 'minutes per kilometer' };
  const MILES = { i: 1, y: 1 / 1760, k: 0.621371192, m: 0.000621371192 };
  const DIST_NAMES = { i: 'mile', y: 'yard', k: 'kilometer', m: 'meter' };

  function perHourAtSpeed(act, mph, kg) {
    const pts = PACE[act][3].map(([name, s]) => [s, perHour(BY_NAME[name], kg)]);
    let i = 0;
    if (mph > pts[1][0]) i = 1;
    if (mph > pts[2][0]) i = 2;
    const [s0, c0] = pts[i], [s1, c1] = pts[i + 1];
    return c0 + ((mph - s0) / (s1 - s0)) * (c1 - c0);
  }
  function byDistance() {
    const act = el('cb2-act').value, unit = el('cb2-sunit').value, dunit = el('cb2-dunit').value;
    const s = num('cb2-speed'), d = num('cb2-dist');
    if (!(s > 0)) return error('cb2-result', 'Enter a speed or pace, more than 0.');
    if (!(d > 0)) return error('cb2-result', 'Enter a distance, more than 0.');
    const wt = readWeight('cb2');
    if (wt.err) return error('cb2-result', wt.err);
    const mph = MPH[unit](s);
    const [name, lo, hi] = PACE[act];
    if (mph < lo - 1e-9 || mph > hi + 1e-9) return error('cb2-result', `Enter a reasonable ${name.toLowerCase()} speed. This calculator accepts ${lo} to ${hi} miles per hour.`);
    const hours = (d * MILES[dunit]) / mph;
    const total = perHourAtSpeed(act, mph, wt.kg) * hours;
    const mins = Math.round(hours * 60);
    const timeText = mins >= 60 ? `${plural(Math.floor(mins / 60), 'hour')}${mins % 60 ? ' and ' + plural(mins % 60, 'minute') : ''}` : plural(mins, 'minute');
    el('cb2-result').innerHTML =
      `<div class="summary-payment-box"><div class="label">Calories burned</div><div class="value">${cal(total)}</div><div class="label" style="margin-top:6px;">${name} at ${trim(s)} ${SPEED_NAMES[unit]} for ${trim(d)} ${DIST_NAMES[dunit]}${d === 1 ? '' : 's'}</div></div>` +
      `<div class="stat-row"><span>Time taken</span><strong>about ${timeText}</strong></div>`;
  }
  const SPEED_PRESETS = { w: [2, 2.8, 3.5, 4], r: [5, 6, 7.5, 10], b: [13, 15, 17.5, 21] };
  function applyPreset(i) {
    const mph = SPEED_PRESETS[el('cb2-act').value][i];
    const unit = el('cb2-sunit').value;
    const v = unit === 'mph' ? mph : unit === 'kph' ? mph / 0.621371192 : unit === 'mps' ? mph / 2.2369362921 : unit === 'yps' ? mph / 2.0454545455 : unit === 'mpm' ? 60 / mph : (60 * 0.621371192) / mph;
    el('cb2-speed').value = Math.round(v * 1000) / 1000;
    byDistance();
  }

  // ---------- Wiring ----------
  el('cb-group').innerHTML = GROUPS.map((g, i) => `<option value="${i}">${g[0]}</option>`).join('');
  buildActivity();
  el('cb-group').addEventListener('change', () => { buildActivity(); byDuration(); });
  el('cb-activity').addEventListener('change', byDuration);
  el('cb-form').addEventListener('submit', (e) => { e.preventDefault(); byDuration(); });
  el('cb2-form').addEventListener('submit', (e) => { e.preventDefault(); byDistance(); });
  document.querySelectorAll('[data-cb2-preset]').forEach((b) => b.addEventListener('click', () => applyPreset(Number(b.dataset.cb2Preset))));
  el('cb2-act').addEventListener('change', () => applyPreset(0));
  byDuration();
  byDistance();
})();
