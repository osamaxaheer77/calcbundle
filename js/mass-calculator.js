'use strict';

(function () {
  const C = window.CalcCommon;
  if (!C || !C.el('ms-form')) return;
  const el = C.el;

  // Mass units in kilograms: [label shown in the density list, name used in the result, kilograms]
  const G = 9.80665;
  const MASS = {
    kg: ['kilogram', 1], g: ['gram', 1e-3], mg: ['milligram', 1e-6],
    Eg: ['exagram', 1e15], Pg: ['petagram', 1e12], Tg: ['teragram', 1e9], Gg: ['gigagram', 1e6], Mg: ['megagram', 1e3],
    hg: ['hectogram', 0.1], dag: ['dekagram', 0.01], dg: ['decigram', 1e-4], cg: ['centigram', 1e-5],
    ug: ['microgram', 1e-9], ng: ['nanogram', 1e-12], pg: ['picogram', 1e-15], fg: ['femtogram', 1e-18], ag: ['attogram', 1e-21],
    lb: ['pound', 0.45359237], oz: ['ounce', 0.028349523125], gr: ['grain', 6.479891e-5],
    tonS: ['ton (short)', 907.18474], tonL: ['ton (long)', 1016.0469088], slug: ['slug', (0.45359237 * G) / 0.3048],
  };
  // Volume units in cubic meters.
  const VOL = {
    m3: ['cubic meter', 'm³', 1], ft3: ['cubic foot', 'ft³', 0.028316846592], yd3: ['cubic yard', 'yd³', 0.764554857984], in3: ['cubic inch', 'in³', 1.6387064e-5],
    km3: ['cubic kilometer', 'km³', 1e9], mi3: ['cubic mile', 'mi³', 1609.344 ** 3], cm3: ['cubic centimeter', 'cm³', 1e-6], mm3: ['cubic millimeter', 'mm³', 1e-9],
    L: ['liter', 'L', 1e-3], mL: ['milliliter', 'mL', 1e-6], pt: ['pint', 'pt', 0.000473176473], qt: ['quart', 'qt', 0.000946352946],
    galUS: ['gallon (US)', 'gal', 0.003785411784], galUK: ['gallon (UK)', 'gal', 0.00454609],
  };
  // Density units: [label, mass key, volume key]. The last one is a pressure gradient.
  const D = [];
  const dd = (label, m, v) => D.push({ key: D.length, label, m, v });
  dd('kilogram/cubic meter [kg/m³]', 'kg', 'm3'); dd('kilogram/cubic centimeter [kg/cm³]', 'kg', 'cm3');
  dd('gram/cubic meter [g/m³]', 'g', 'm3'); dd('gram/cubic centimeter [g/cm³]', 'g', 'cm3'); dd('gram/cubic millimeter [g/mm³]', 'g', 'mm3');
  dd('milligram/cubic meter [mg/m³]', 'mg', 'm3'); dd('milligram/cubic centimeter [mg/cm³]', 'mg', 'cm3'); dd('milligram/cubic millimeter [mg/mm³]', 'mg', 'mm3');
  [['Eg', 'exagram'], ['Pg', 'petagram'], ['Tg', 'teragram'], ['Gg', 'gigagram'], ['Mg', 'megagram'], ['kg', 'kilogram'], ['hg', 'hectogram'], ['dag', 'dekagram'], ['g', 'gram'], ['dg', 'decigram'], ['cg', 'centigram'], ['mg', 'milligram'], ['ug', 'microgram'], ['ng', 'nanogram'], ['pg', 'picogram'], ['fg', 'femtogram'], ['ag', 'attogram']]
    .forEach(([k, n]) => dd(`${n}/liter [${k === 'ug' ? 'µg' : k}/L]`, k, 'L'));
  dd('pound/cubic inch [lb/in³]', 'lb', 'in3'); dd('pound/cubic foot [lb/ft³]', 'lb', 'ft3'); dd('pound/cubic yard [lb/yd³]', 'lb', 'yd3');
  dd('pound/gallon (US)', 'lb', 'galUS'); dd('pound/gallon (UK)', 'lb', 'galUK');
  dd('ounce/cubic inch [oz/in³]', 'oz', 'in3'); dd('ounce/cubic foot [oz/ft³]', 'oz', 'ft3'); dd('ounce/gallon (US)', 'oz', 'galUS'); dd('ounce/gallon (UK)', 'oz', 'galUK');
  dd('grain/gallon (US)', 'gr', 'galUS'); dd('grain/gallon (UK)', 'gr', 'galUK'); dd('grain/cubic foot [gr/ft³]', 'gr', 'ft3');
  dd('ton (short)/cubic yard', 'tonS', 'yd3'); dd('ton (long)/cubic yard', 'tonL', 'yd3'); dd('slug/cubic foot [slug/ft³]', 'slug', 'ft3');
  const PSI = D.length;
  D.push({ key: PSI, label: 'psi/1000 feet', psi: true });
  const kgPerM3 = (d) => (d.psi ? 6894.757293168 / 304.8 / G : MASS[d.m][1] / VOL[d.v][2]);

  // Other units shown at the bottom.
  const OTHER = [['kilogram', 1], ['gram', 1e-3], ['milligram', 1e-6], ['metric ton', 1e3], ['pound (lb)', 0.45359237], ['ounce (oz)', 0.028349523125], ['carat', 2e-4], ['grain', 6.479891e-5], ['atomic mass unit', 1.66053906660e-27]];

  const dSel = el('ms-du'), vSel = el('ms-vu');
  D.forEach((d) => dSel.add(new Option(d.label, d.key)));
  Object.keys(VOL).forEach((k) => vSel.add(new Option(`${VOL[k][0]} [${VOL[k][1]}]`, k)));
  dSel.value = 0; vSel.value = 'm3';

  function run() {
    const out = 'ms-result';
    const dens = C.num('ms-d'), vol = C.num('ms-v');
    if (dens === null || !Number.isFinite(dens) || dens < 0) return C.error(out, 'Enter the density, 0 or more.');
    if (vol === null || !Number.isFinite(vol) || vol < 0) return C.error(out, 'Enter the volume, 0 or more.');
    const d = D[Number(dSel.value)], vKey = vSel.value;
    const kg = vol * VOL[vKey][2] * dens * kgPerM3(d);
    if (!Number.isFinite(kg) || kg > 1e60) return C.error(out, 'That is too large to calculate. Check the numbers.');

    let main, steps = '';
    if (d.psi) {
      main = `${C.sig(kg)} kilogram`;
    } else {
      const mName = MASS[d.m][0], vName = d.v ? VOL[d.v][0] : '';
      const volInDensityUnit = (vol * VOL[vKey][2]) / VOL[d.v][2];
      const massInUnit = volInDensityUnit * dens;
      main = `${C.sig(massInUnit)} ${mName}`;
      const densName = d.label.replace(/ \[.*\]$/, '');
      const lines = [`m = V × ρ`, `= ${C.sig(vol)} ${VOL[vKey][0]} × ${C.sig(dens)} ${densName}`];
      if (vKey !== d.v) lines.push(`= ${C.sig(volInDensityUnit)} ${vName} × ${C.sig(dens)} ${densName}`);
      lines.push(`= ${C.sig(massInUnit)} ${mName}`);
      steps = `<div style="font-size:13px;line-height:1.7;margin:12px 0 4px;"><strong>Steps</strong><br>${lines.join('<br>')}</div>`;
    }
    let html = C.big('Mass', main) + steps + `<h3 style="font-size:15px;margin:16px 0 4px;">Mass in other units</h3>`;
    OTHER.forEach(([name, f]) => { html += C.row(name, C.sig(kg / f)); });
    el(out).innerHTML = html;
  }
  el('ms-form').addEventListener('submit', (e) => { e.preventDefault(); run(); });
  el('ms-form').addEventListener('input', run);
  el('ms-form').addEventListener('change', run);
  run();
})();
