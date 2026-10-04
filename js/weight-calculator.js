'use strict';

(function () {
  const C = window.CalcCommon;
  if (!C || !C.el('wt-form')) return;
  const el = C.el;

  // Units and their size in kilograms.
  const UNITS = [
    ['kilogram', 'kilogram', 1], ['gram', 'gram', 1e-3], ['milligram', 'milligram', 1e-6],
    ['ton', 'ton (metric)', 1e3], ['tonS', 'ton (short, US)', 907.18474], ['tonL', 'ton (long, UK)', 1016.0469088],
    ['pound', 'pound (lb)', 0.45359237], ['ounce', 'ounce', 0.028349523125], ['carat', 'carat', 2e-4],
    ['amu', 'atomic mass unit', 1.66053906660e-27], ['grain', 'grain', 6.479891e-5],
    ['qUS', 'quarter [US]', 25 * 0.45359237], ['qUK', 'quarter [UK]', 28 * 0.45359237],
    ['sUS', 'stone [US]', 12.5 * 0.45359237], ['sUK', 'stone [UK]', 14 * 0.45359237],
  ];
  const BY = {}; UNITS.forEach((u) => { BY[u[0]] = u; });
  const from = el('wt-from'), to = el('wt-to');
  UNITS.forEach((u) => { from.add(new Option(u[1], u[0])); to.add(new Option(u[1], u[0])); });
  from.value = 'pound'; to.value = 'kilogram';

  function run() {
    const out = 'wt-result';
    const v = C.num('wt-v');
    if (v === null) return C.error(out, 'Enter a value to convert.');
    if (!Number.isFinite(v)) return C.error(out, 'Enter a number no larger than 1,000,000,000,000,000.');
    const kg = v * BY[from.value][2];
    const result = kg / BY[to.value][2];
    if (!Number.isFinite(result) || Math.abs(result) > 1e90) return C.error(out, 'That is too large to convert. Check the number.');
    const f = BY[from.value][1], t = BY[to.value][1];
    let html = C.big(`${C.sig(v)} ${f} =`, `${C.sig(result)} ${t}`, `1 ${f} = ${C.sig(BY[from.value][2] / BY[to.value][2])} ${t}`);
    html += '<h3 style="font-size:15px;margin:16px 0 4px;">In every unit</h3>';
    UNITS.forEach((u) => { html += C.row(u[1], C.sig(kg / u[2])); });
    el(out).innerHTML = html;
  }
  el('wt-form').addEventListener('submit', (e) => { e.preventDefault(); run(); });
  el('wt-form').addEventListener('input', run);
  el('wt-form').addEventListener('change', run);
  run();
})();
