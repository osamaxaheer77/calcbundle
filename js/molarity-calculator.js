'use strict';

(function () {
  const C = window.CalcCommon;
  if (!C || !C.el('mo-form')) return;
  const el = C.el;

  // Unit tables: [key, label, factor]. Mass in grams, volume in liters.
  const MASS = [['t', 't [metric ton]', 1e6], ['kg', 'kg [kilogram]', 1e3], ['g', 'g [gram]', 1], ['mg', 'mg [milligram]', 1e-3], ['ug', 'μg [microgram]', 1e-6], ['Da', 'Da [atomic mass unit]', 1.66053906892e-24], ['lb', 'lb [pound]', 453.59237], ['oz', 'oz [ounce]', 28.349523125]];
  const MW = [['gm', 'g/mol [gram/mole]', 1], ['kgm', 'kg/mol [kilogram/mole]', 1000]];
  const VOL = [['m', 'm³ [cubic meter]', 1000], ['cm', 'cm³ [cubic centimeter]', 1e-3], ['mm', 'mm³ [cubic millimeter]', 1e-6], ['L', 'L [liter]', 1], ['mL', 'mL [milliliter]', 1e-3], ['gal', 'gal [US gallon]', 3.785411784], ['qt', 'qt [US quart]', 0.946352946], ['pt', 'pt [US pint]', 0.473176473], ['c', 'c [US cup]', 0.2365882365], ['floz', 'fl oz [US fluid ounce]', 0.0295735295625], ['yd', 'yd³ [cubic yard]', 764.554857984], ['ft', 'ft³ [cubic foot]', 28.316846592], ['in', 'in³ [cubic inch]', 0.016387064]];
  // Concentration: molar units are in mol/L, mass units in g/L. ppm and ppb assume a water-like solution (1 L is 1 kg).
  const CONC = [['M', 'M [molar, mole/liter]', 1, 'molar'], ['mM', 'mM [millimolar, millimole/liter]', 1e-3, 'molar'], ['uM', 'μM [micromolar, micromole/liter]', 1e-6, 'molar'], ['nM', 'nM [nanomolar, nanomole/liter]', 1e-9, 'molar'], ['molm', 'mol/m³ [mole/cubic meter]', 1e-3, 'molar'],
    ['kgl', 'kg/L [kilogram/liter]', 1000, 'mass'], ['gl', 'g/L [gram/liter]', 1, 'mass'], ['mgl', 'mg/L [milligram/liter]', 1e-3, 'mass'], ['ppm', 'ppm [parts per million]', 1e-3, 'mass'], ['ppb', 'ppb [parts per billion]', 1e-6, 'mass'], ['kgm', 'kg/m³ [kilogram/cubic meter]', 1, 'mass'], ['gm3', 'g/m³ [gram/cubic meter]', 1e-3, 'mass']];
  const by = (t) => { const m = {}; t.forEach((u) => { m[u[0]] = u; }); return m; };
  const MB = by(MASS), WB = by(MW), VB = by(VOL), CB = by(CONC);
  const fill = (id, t, sel) => { const s = el(id); t.forEach((u) => s.add(new Option(u[1], u[0]))); s.value = sel; };
  fill('mo-mu', MASS, 'g'); fill('mo-wu', MW, 'gm'); fill('mo-vu', VOL, 'L'); fill('mo-cu', CONC, 'M');
  const sym = (u) => u[1].replace(/^(.*?) \[.*\]$/, '$1');
  const f = (id) => C.num(id);
  const sig = C.sig;
  const stepBox = (lines) => `<div style="font-size:13px;line-height:1.7;margin:12px 0 4px;"><strong>Steps</strong><br>${lines.join('<br>')}</div>`;

  function run() {
    const out = 'mo-result';
    const raw = { mass: f('mo-m'), mw: f('mo-w'), vol: f('mo-v'), conc: f('mo-c') };
    const names = { mass: 'mass', mw: 'molecular weight', vol: 'volume', conc: 'concentration' };
    for (const k of Object.keys(raw)) if (raw[k] !== null && !(raw[k] > 0)) return C.error(out, `The ${names[k]} must be a number more than 0, or left blank.`);
    const cuKey = CB[el('mo-cu').value];
    let blank = Object.keys(raw).filter((k) => raw[k] === null);
    // With a mass concentration (g/L and similar) the mass or the volume can be found without the molecular weight.
    if (blank.length === 2 && cuKey[3] === 'mass' && blank.includes('mw') && (blank.includes('mass') || blank.includes('vol'))) blank = blank.filter((k) => k !== 'mw');
    if (blank.length > 1) return C.error(out, 'Fill in at least three of the four boxes. Leave the one you want to find blank.');

    const mu = MB[el('mo-mu').value], wu = WB[el('mo-wu').value], vu = VB[el('mo-vu').value], cu = CB[el('mo-cu').value];
    const g = raw.mass === null ? null : raw.mass * mu[2];            // grams
    const w = raw.mw === null ? null : raw.mw * wu[2];                // g/mol
    const L = raw.vol === null ? null : raw.vol * vu[2];              // liters
    const molarC = cu[3] === 'molar';
    const c = raw.conc === null ? null : raw.conc * cu[2];            // mol/L or g/L
    const target = blank.length ? blank[0] : 'conc';
    let html, note = '';
    if (!blank.length) note = C.note('All four boxes are filled in, so the concentration was worked out again from the mass, molecular weight and volume.');

    if (target === 'conc') {
      const mol = g / w, molarity = mol / L, massConc = g / L;
      if (![mol, molarity, massConc].every(Number.isFinite)) return C.error(out, 'That is too large to calculate.');
      const first = molarC ? ['Molarity', `${sig(molarity / cu[2])} ${sym(cu)}`] : ['Mass concentration', `${sig(massConc / cu[2])} ${sym(cu)}`];
      html = C.big(first[0], first[1]) +
        (molarC ? C.row('Mass concentration', `${sig(massConc)} g/L`) : C.row('Molarity', `${sig(molarity)} M`)) + C.row('Moles of solute', `${sig(mol)} mol`) +
        stepBox(['molarity = mass ÷ (molecular weight × volume)', `= ${sig(raw.mass)} ${sym(mu)} ÷ (${sig(raw.mw)} ${sym(wu)} × ${sig(raw.vol)} ${sym(vu)})`, `= ${sig(molarity)} M`, 'mass concentration = mass ÷ volume', `= ${sig(massConc)} g/L`, 'moles = mass ÷ molecular weight', `= ${sig(mol)} mol`]) + note;
    } else if (target === 'mass') {
      let grams, mol = null;
      if (molarC) { if (w === null) return C.error(out, 'Enter the molecular weight to find the mass from a molar concentration.'); mol = c * L; grams = mol * w; }
      else { grams = c * L; if (w !== null) mol = grams / w; }
      if (!Number.isFinite(grams)) return C.error(out, 'That is too large to calculate.');
      html = C.big('Mass', `${sig(grams / mu[2])} ${sym(mu)}`) + (mol === null ? '' : C.row('Moles of solute', `${sig(mol)} mol`)) +
        stepBox(molarC ? ['mass = volume × molarity × molecular weight', `= ${sig(raw.vol)} ${sym(vu)} × ${sig(raw.conc)} ${sym(cu)} × ${sig(raw.mw)} ${sym(wu)}`, `= ${sig(grams / mu[2])} ${sym(mu)}`] : ['mass = volume × mass concentration', `= ${sig(raw.vol)} ${sym(vu)} × ${sig(raw.conc)} ${sym(cu)}`, `= ${sig(grams / mu[2])} ${sym(mu)}`]);
    } else if (target === 'vol') {
      let liters, mol = null;
      if (molarC) { if (w === null) return C.error(out, 'Enter the molecular weight to find the volume from a molar concentration.'); mol = g / w; liters = mol / c; }
      else { liters = g / c; if (w !== null) mol = g / w; }
      if (!Number.isFinite(liters)) return C.error(out, 'That is too large to calculate.');
      html = C.big('Volume', `${sig(liters / vu[2])} ${sym(vu)}`) + (mol === null ? '' : C.row('Moles of solute', `${sig(mol)} mol`)) +
        stepBox(molarC ? ['volume = mass ÷ (molecular weight × molarity)', `= ${sig(raw.mass)} ${sym(mu)} ÷ (${sig(raw.mw)} ${sym(wu)} × ${sig(raw.conc)} ${sym(cu)})`, `= ${sig(liters / vu[2])} ${sym(vu)}`] : ['volume = mass ÷ mass concentration', `= ${sig(raw.mass)} ${sym(mu)} ÷ ${sig(raw.conc)} ${sym(cu)}`, `= ${sig(liters / vu[2])} ${sym(vu)}`]);
    } else {
      if (!molarC) return C.error(out, 'The molecular weight cannot be found from a mass concentration. Enter the concentration in a molar unit, such as M.');
      const mol = c * L, weight = g / mol;
      if (!Number.isFinite(weight)) return C.error(out, 'That is too large to calculate.');
      html = C.big('Molecular weight', `${sig(weight / wu[2])} ${sym(wu)}`) + C.row('Moles of solute', `${sig(mol)} mol`) +
        stepBox(['molecular weight = mass ÷ (volume × molarity)', `= ${sig(raw.mass)} ${sym(mu)} ÷ (${sig(raw.vol)} ${sym(vu)} × ${sig(raw.conc)} ${sym(cu)})`, `= ${sig(weight / wu[2])} ${sym(wu)}`]);
    }
    el(out).innerHTML = html;
  }
  el('mo-form').addEventListener('submit', (e) => { e.preventDefault(); run(); });
  el('mo-form').addEventListener('input', run);
  el('mo-form').addEventListener('change', run);
  run();
})();
