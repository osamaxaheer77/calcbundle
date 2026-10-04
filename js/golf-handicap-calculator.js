'use strict';

(function () {
  const C = window.CalcCommon;
  if (!C || !C.el('gh-form')) return;
  const el = C.el;

  // ---- Handicap of the course ----
  // Course handicap = index x slope / 113 + (course rating - par), rounded to a whole number (halves away from zero).
  function course() {
    const out = 'gh-result';
    const idx = C.num('gh-i'), cr = C.num('gh-r'), sl = C.num('gh-s'), par = C.num('gh-p');
    if (idx === null || !Number.isFinite(idx) || idx < 0) return C.error(out, 'Enter your handicap index, 0 or more.');
    if (cr === null || !Number.isFinite(cr) || cr <= 0) return C.error(out, 'Enter the course rating, more than 0.');
    if (sl === null || !Number.isFinite(sl) || sl <= 0) return C.error(out, 'Enter the course slope rating, more than 0.');
    if (par === null || !Number.isFinite(par) || par <= 0) return C.error(out, 'Enter the course par, more than 0.');
    if (idx > 1000 || cr > 1000 || sl > 1000 || par > 1000) return C.error(out, 'Enter realistic numbers. The index, rating, slope and par should each be 1,000 or less.');
    const exact = (idx * sl) / 113 + (cr - par);
    const rounded = Math.sign(exact) * Math.round(Math.abs(exact) + 1e-9);
    el(out).innerHTML = C.big('Your handicap for the course', String(rounded === 0 ? 0 : rounded), `${C.dec(exact, 2)} before rounding`) +
      C.row('Handicap index', C.dec(idx, 1)) + C.row('Slope adjustment (index × slope ÷ 113)', C.dec((idx * sl) / 113, 2)) + C.row('Rating less par', C.dec(cr - par, 1)) +
      C.note('This is the number of strokes you receive on this course. Subtract it from your gross score to get your net score.');
  }

  // ---- Handicap index from rounds ----
  const ROWS = 20;
  const DEFAULTS = [[70.3, 126, 85, '', ''], [35.3, 122, '', 41, ''], [66.8, 120, 82, '', ''], [65.9, 118, 85, '', ''], [74.3, 137, 88, '', ''], [71.1, 126, 90, '', '']];
  const body = el('gi-body');
  for (let i = 1; i <= ROWS; i++) {
    const d = DEFAULTS[i - 1] || ['', '', '', '', ''];
    const cell = (n, v, lab, step) => `<td><input type="number" id="gi-${n}${i}" value="${v}" step="${step}" aria-label="Round ${i} ${lab}" style="width:78px;"></td>`;
    body.insertAdjacentHTML('beforeend', `<tr><td>${i}</td>${cell('r', d[0], 'course rating', 'any')}${cell('l', d[1], 'slope rating', 'any')}${cell('c', d[2], '18-hole score', 'any')}${cell('n', d[3], '9-hole score', 'any')}${cell('a', d[4], 'playing condition adjustment', '1')}</tr>`);
  }
  const tenth = (v) => Math.round(v * 10 + 1e-9) / 10;
  // Rounds needed to count: [how many differentials to use, adjustment].
  function table(n) {
    if (n >= 20) return [8, 0];
    if (n >= 19) return [7, 0];
    if (n >= 17) return [6, 0];
    if (n >= 15) return [5, 0];
    if (n >= 12) return [4, 0];
    if (n >= 9) return [3, 0];
    if (n >= 7) return [2, 0];
    if (n === 6) return [2, -1];
    if (n === 5) return [1, 0];
    if (n === 4) return [1, -1];
    return [1, -2];
  }

  function index() {
    const out = 'gi-result';
    const rounds = [];
    for (let i = 1; i <= ROWS; i++) {
      const v = (k) => C.num(`gi-${k}${i}`);
      const r = v('r'), l = v('l'), c = v('c'), n = v('n'), a = v('a');
      if ([r, l, c, n, a].every((x) => x === null)) continue;
      if ([r, l, c, n, a].some((x) => x !== null && !Number.isFinite(x))) return C.error(out, `Round ${i}: enter numbers only.`);
      if (r === null || l === null) return C.error(out, `Round ${i}: enter the course rating and the slope rating.`);
      if (c !== null && n !== null) return C.error(out, `Round ${i}: enter an 18-hole score or a 9-hole score, not both.`);
      if (c === null && n === null) return C.error(out, `Round ${i}: enter a score.`);
      if (!(r > 0)) return C.error(out, `Round ${i}: the course rating must be more than 0.`);
      if (!(l > 0)) return C.error(out, `Round ${i}: the slope rating must be more than 0.`);
      const pcc = a === null ? 0 : a;
      if (!Number.isInteger(pcc) || pcc < -1 || pcc > 3) return C.error(out, `Round ${i}: the playing condition adjustment must be a whole number from -1 to 3, or blank.`);
      if (r > 1000 || l > 1000 || (c !== null && c > 1000) || (n !== null && n > 1000)) return C.error(out, `Round ${i}: enter realistic numbers, 1,000 or less.`);
      const nine = n !== null, score = nine ? n : c;
      if (score < 0) return C.error(out, `Round ${i}: the score cannot be negative.`);
      rounds.push({ i, r, l, score, nine, pcc, diff: tenth((113 / l) * (score - r - (nine ? pcc / 2 : pcc))) });
    }
    // Pair 9-hole rounds in the order they were entered. An unpaired one is left out for now.
    const counted = [];
    let held = null;
    rounds.forEach((rd) => {
      if (!rd.nine) { counted.push({ label: `${rd.i}`, diff: rd.diff }); return; }
      if (held === null) held = rd;
      else { counted.push({ label: `${held.i} + ${rd.i}`, diff: tenth(held.diff + rd.diff) }); held = null; }
    });
    if (counted.length < 3) return C.error(out, 'At least 54 holes are needed, such as 3 rounds of 18 holes. Two 9-hole rounds count as one 18-hole round.');
    const [k, adj] = table(counted.length);
    const sorted = counted.map((x, pos) => ({ ...x, pos })).sort((a, b) => a.diff - b.diff || a.pos - b.pos);
    const used = new Set(sorted.slice(0, k).map((x) => x.pos));
    const avg = sorted.slice(0, k).reduce((s, x) => s + x.diff, 0) / k;
    let result = tenth(avg + adj);
    const capped = result > 54;
    if (capped) result = 54;
    const why = k === 1 ? 'your lowest differential' : `the average of your ${k} lowest differentials`;
    let html = C.big('Your handicap index', C.dec(result, 1), `Based on ${why}${adj ? `, less ${-adj}` : ''}`);
    if (rounds.some((x) => x.nine)) html += C.note('9-hole rounds are paired in the order you entered them, and their differentials are added to make one 18-hole equivalent. A leftover 9-hole round is not used until it has a partner.');
    if (capped) html += C.note('The highest handicap index is 54.0, so the result was limited to that.');
    html += '<h3 style="font-size:15px;margin:16px 0 6px;">Differentials</h3><div class="schedule-table-wrap"><table class="schedule-table"><thead><tr><th>Round</th><th>Differential</th><th>Used</th></tr></thead><tbody>';
    counted.forEach((x, pos) => { html += `<tr><td>${x.label}</td><td>${C.dec(x.diff, 1)}</td><td>${used.has(pos) ? 'Yes' : ''}</td></tr>`; });
    html += '</tbody></table></div>';
    el(out).innerHTML = html + C.note('Differential = 113 ÷ slope × (score − course rating − playing condition adjustment).');
  }

  el('gh-form').addEventListener('submit', (e) => { e.preventDefault(); course(); });
  el('gh-form').addEventListener('input', course);
  el('gi-form').addEventListener('submit', (e) => { e.preventDefault(); index(); });
  el('gi-form').addEventListener('input', index);
  course();
  index();
})();
