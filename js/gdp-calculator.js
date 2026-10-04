'use strict';

(function () {
  const C = window.CalcCommon;
  if (!C || !C.el('ex-form')) return;
  const el = C.el;

  // Sum the named fields. A blank field counts as 0. Returns an error message or the values.
  function read(ids) {
    const vals = [];
    for (const [id, label] of ids) {
      const v = C.num(id);
      if (v !== null && !Number.isFinite(v)) return { error: `${label} must be a number.` };
      vals.push(v === null ? 0 : v);
    }
    return { vals };
  }
  const clean = (v) => Number(v.toFixed(8)); // removes 0.1 + 0.2 style noise
  const money = (v) => C.dec(v, 8);

  function expenditure() {
    const r = read([['ex-pc', 'Personal consumption'], ['ex-gi', 'Gross investment'], ['ex-gc', 'Government consumption'], ['ex-ex', 'Exports'], ['ex-im', 'Imports']]);
    if (r.error) return C.error('ex-result', r.error);
    const [pc, gi, gc, ex, im] = r.vals;
    const net = clean(ex - im), gdp = clean(pc + gi + gc + net);
    if (!(Math.abs(gdp) < 1e18)) return C.error('ex-result', 'That total is too large. Check the numbers.');
    el('ex-result').innerHTML = C.big('Gross domestic product (GDP)', money(gdp), 'Personal consumption + gross investment + government consumption + net exports') +
      C.row('Personal consumption', money(pc)) + C.row('Gross investment', money(gi)) + C.row('Government consumption', money(gc)) +
      C.row('Exports', money(ex)) + C.row('Imports', money(im)) + C.row('Net exports', money(net)) +
      (net < 0 ? C.note('Net exports are negative because imports are larger than exports, which lowers GDP.') : '');
  }

  function income() {
    const r = read([['in-ec', 'Employee compensation'], ['in-pi', "Proprietors' income"], ['in-re', 'Rental income'], ['in-cp', 'Corporate profits'], ['in-ii', 'Interest income'], ['in-ib', 'Indirect business taxes'], ['in-de', 'Depreciation'], ['in-nf', 'Net income of foreigners']]);
    if (r.error) return C.error('in-result', r.error);
    const [ec, pi, re, cp, ii, ib, de, nf] = r.vals;
    const gnp = clean(ec + pi + re + cp + ii), gdp = clean(gnp + ib + de + nf);
    if (!(Math.abs(gdp) < 1e18)) return C.error('in-result', 'That total is too large. Check the numbers.');
    el('in-result').innerHTML = C.big('Gross domestic product (GDP)', money(gdp), 'GNP + indirect business taxes + depreciation + net income of foreigners') +
      C.row('Employee compensation', money(ec)) + C.row("Proprietors' income", money(pi)) + C.row('Rental income', money(re)) + C.row('Corporate profits', money(cp)) + C.row('Interest income', money(ii)) +
      C.row('Gross national product (GNP)', money(gnp)) + C.row('Indirect business taxes', money(ib)) + C.row('Depreciation', money(de)) + C.row('Net income of foreigners', money(nf));
  }

  for (const [form, fn] of [['ex-form', expenditure], ['in-form', income]]) {
    el(form).addEventListener('submit', (e) => { e.preventDefault(); fn(); });
    el(form).addEventListener('input', fn);
  }
  expenditure();
  income();
})();
