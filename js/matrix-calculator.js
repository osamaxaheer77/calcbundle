'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const MC = window.MatrixCore;
  if (!el('mx-form') || !MC) return;
  const MAX = 10;
  const state = { A: { r: 2, c: 2 }, B: { r: 2, c: 2 } };
  const defaults = { A: [[1, 2], [3, 4]], B: [[5, 6], [7, 8]] };

  // ---------- grids ----------
  function build(name) {
    const { r, c } = state[name]; const box = el(`mx-${name}-grid`);
    const old = read(name, true);
    let html = '<table class="mx-grid"><tbody>';
    for (let i = 0; i < r; i++) {
      html += '<tr>';
      for (let j = 0; j < c; j++) html += `<td><input type="text" class="mx-cell" id="mx-${name}-${i}-${j}" inputmode="decimal" autocomplete="off" aria-label="Matrix ${name}, row ${i + 1}, column ${j + 1}" value="${old[i] && old[i][j] !== undefined ? old[i][j] : ''}"></td>`;
      html += '</tr>';
    }
    box.innerHTML = html + '</tbody></table>';
  }
  // raw strings currently in the grid
  function read(name, quiet) {
    const { r, c } = state[name]; const out = [];
    for (let i = 0; i < r; i++) { out.push([]); for (let j = 0; j < c; j++) { const e = el(`mx-${name}-${i}-${j}`); out[i].push(e ? e.value : ''); } }
    return out;
  }
  function parsed(name) {
    const raw = read(name); const { r, c } = state[name]; const M = [];
    for (let i = 0; i < r; i++) { M.push([]); for (let j = 0; j < c; j++) { const v = MC.parse(raw[i][j]); if (v === null) return { error: `Matrix ${name}, row ${i + 1}, column ${j + 1} is not a number. Use whole numbers, decimals or fractions like 1/2.` }; M[i].push(v); } }
    return { M };
  }
  function setSize(name) {
    const r = Number(el(`mx-${name}-rows`).value), c = Number(el(`mx-${name}-cols`).value);
    if (!Number.isInteger(r) || !Number.isInteger(c) || r < 1 || c < 1 || r > MAX || c > MAX) { el('mx-result').innerHTML = `<p class="tool-result is-error">Matrix ${name} can have between 1 and ${MAX} rows and columns.</p>`; return; }
    state[name] = { r, c }; build(name);
  }
  function fill(name, how) {
    const { r, c } = state[name];
    for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) el(`mx-${name}-${i}-${j}`).value = how === 'clear' ? '' : how === 'zero' ? '0' : how === 'one' ? '1' : String(Math.floor(Math.random() * 19) - 9);
  }
  function load(name, M) { state[name] = { r: M.length, c: M[0].length }; el(`mx-${name}-rows`).value = M.length; el(`mx-${name}-cols`).value = M[0].length; build(name); M.forEach((row, i) => row.forEach((v, j) => { el(`mx-${name}-${i}-${j}`).value = v; })); }

  // ---------- output ----------
  const fmt = () => document.querySelector('input[name="mx-fmt"]:checked').value;
  const show = (a) => (fmt() === 'dec' ? MC.decimal(a, 6) : MC.text(a));
  const showText = (a) => MC.text(a);
  function table(M) {
    return '<div class="mx-out"><table class="mx-grid mx-res"><tbody>' + M.map((row) => '<tr>' + row.map((v) => `<td>${show(v)}</td>`).join('') + '</tr>').join('') + '</tbody></table></div>';
  }
  const out = (title, body) => { el('mx-result').innerHTML = `<h3 style="margin:0 0 8px;font-size:16px;">${title}</h3>${body}`; };
  const err = (msg) => { el('mx-result').innerHTML = `<p class="tool-result is-error">${msg}</p>`; };
  const dims = (name) => `${state[name].r}×${state[name].c}`;

  function detSteps(M) {
    const n = M.length, t = showText;
    if (n === 1) return `|A| = ${t(M[0][0])}`;
    if (n === 2) return `|A| = ad − bc = (${t(M[0][0])})(${t(M[1][1])}) − (${t(M[0][1])})(${t(M[1][0])}) = ${t(MC.det(M))}`;
    if (n === 3) {
      const m = (i, j) => `(${t(M[i][j])})`;
      return `|A| = a(ei − fh) − b(di − fg) + c(dh − eg)<br>= ${m(0, 0)}(${m(1, 1)}${m(2, 2)} − ${m(1, 2)}${m(2, 1)}) − ${m(0, 1)}(${m(1, 0)}${m(2, 2)} − ${m(1, 2)}${m(2, 0)}) + ${m(0, 2)}(${m(1, 0)}${m(2, 1)} − ${m(1, 1)}${m(2, 0)})<br>= ${t(MC.det(M))}`;
    }
    return `Found by row reduction: |A| = ${t(MC.det(M))}`;
  }

  // ---------- single-matrix operations ----------
  function single(name, op) {
    const p = parsed(name); if (p.error) return err(p.error);
    const M = p.M, sq = M.length === M[0].length;
    const label = { det: 'The determinant', inverse: 'The inverse', power: 'A power', trace: 'The trace' }[op] || 'This operation';
    const need = () => err(`${label} needs a square matrix. Matrix ${name} is ${dims(name)}.`);
    if (op === 'transpose') return out(`${name}<sup>T</sup> (transpose of ${name})`, table(MC.transpose(M)));
    if (op === 'rank') return out(`Rank of ${name}`, `<div class="summary-payment-box"><div class="label">rank(${name})</div><div class="value">${MC.rank(M)}</div></div>`);
    if (op === 'rref') return out(`Reduced row echelon form of ${name}`, table(MC.rref(M)));
    if (op === 'trace') { if (!sq) return need(); return out(`Trace of ${name}`, `<div class="summary-payment-box"><div class="label">tr(${name}) = sum of the diagonal</div><div class="value">${show(MC.trace(M))}</div></div>`); }
    if (op === 'det') { if (!sq) return need(); const d = MC.det(M); return out(`Determinant of ${name}`, `<div class="summary-payment-box"><div class="label">|${name}|</div><div class="value">${show(d)}</div></div><div class="callout" style="margin-top:12px;overflow-wrap:anywhere;">${detSteps(M)}</div>`); }
    if (op === 'inverse') {
      if (!sq) return need();
      const d = MC.det(M); if (MC.isZero(d)) return out(`Inverse of ${name}`, `<p class="tool-result is-error">The determinant is 0, so matrix ${name} is singular and has no inverse.</p>`);
      return out(`Inverse of ${name}`, table(MC.inverse(M)) + `<p style="font-size:13px;color:var(--text-secondary);margin:10px 0 0;">|${name}| = ${showText(d)}, and ${name} × ${name}<sup>−1</sup> = I.</p>`);
    }
    if (op === 'power') {
      if (!sq) return need();
      const raw = el(`mx-${name}-pow`).value.trim(); const k = Number(raw);
      if (raw === '' || !Number.isInteger(k) || Math.abs(k) > 200) return err('Enter a whole-number power between −200 and 200.');
      const R = MC.power(M, k); if (!R) return err(`${name} has no inverse, so it cannot be raised to a negative power.`);
      return out(`${name}<sup>${k}</sup>`, table(R));
    }
    if (op === 'times') {
      const raw = el(`mx-${name}-k`).value.trim(); const k = MC.parse(raw);
      if (raw === '' || k === null) return err('Enter a number (a whole number, decimal or fraction) to multiply by.');
      return out(`${raw} × ${name}`, table(MC.scale(M, k)));
    }
  }

  // ---------- two-matrix operations ----------
  function pair(op) {
    const a = parsed('A'); if (a.error) return err(a.error); const b = parsed('B'); if (b.error) return err(b.error);
    const A = a.M, B = b.M;
    if (op === 'add' || op === 'sub') {
      if (A.length !== B.length || A[0].length !== B[0].length) return err(`${op === 'add' ? 'A + B' : 'A − B'} needs two matrices of the same size. A is ${dims('A')} and B is ${dims('B')}.`);
      return out(op === 'add' ? 'A + B' : 'A − B', table(op === 'add' ? MC.addM(A, B) : MC.subM(A, B)));
    }
    const [X, Y, nx, ny] = op === 'mul' ? [A, B, 'A', 'B'] : [B, A, 'B', 'A'];
    if (X[0].length !== Y.length) return err(`${nx}${ny} needs the number of columns of ${nx} to equal the number of rows of ${ny}. ${nx} is ${dims(nx)} and ${ny} is ${dims(ny)}.`);
    return out(`${nx}${ny} (${nx} × ${ny})`, table(MC.multiply(X, Y)));
  }

  // ---------- wiring ----------
  let lastRun = null; const run = (fn) => { lastRun = fn; fn(); };
  ['A', 'B'].forEach((n) => {
    el(`mx-${n}-rows`).addEventListener('change', () => setSize(n)); el(`mx-${n}-cols`).addEventListener('change', () => setSize(n));
    [['clear', 'clear'], ['zero', 'zero'], ['one', 'one'], ['rand', 'rand']].forEach(([id, how]) => el(`mx-${n}-${id}`).addEventListener('click', () => fill(n, how)));
    ['transpose', 'det', 'inverse', 'rank', 'trace', 'rref', 'power', 'times'].forEach((op) => el(`mx-${n}-op-${op}`).addEventListener('click', () => run(() => single(n, op))));
  });
  [['add', 'mx-add'], ['sub', 'mx-sub'], ['mul', 'mx-mul'], ['mulba', 'mx-mulba']].forEach(([op, id]) => el(id).addEventListener('click', () => run(() => pair(op))));
  el('mx-swap').addEventListener('click', () => { const a = parsed('A'), b = parsed('B'); if (a.error || b.error) return err(a.error || b.error); const ra = read('A'), rb = read('B'); load('A', rb); load('B', ra); });
  el('mx-copy').addEventListener('click', () => { const ra = read('A'); load('B', ra); });
  document.querySelectorAll('input[name="mx-fmt"]').forEach((r) => r.addEventListener('change', () => { if (lastRun) lastRun(); }));
  el('mx-form').addEventListener('submit', (e) => { e.preventDefault(); run(() => pair('mul')); });

  load('A', defaults.A.map((r) => r.map(String))); load('B', defaults.B.map((r) => r.map(String)));
  run(() => pair('mul'));
})();
