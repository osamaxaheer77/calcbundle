'use strict';

(function () {
  const C = window.CalcCommon;
  if (!C || !C.el('mw-form')) return;
  const el = C.el;

  // Abridged standard atomic weights (IUPAC), in g/mol: [symbol, name, weight].
  const ELEMENTS = [
    ["H","Hydrogen",1.008],
    ["He","Helium",4.0026],
    ["Li","Lithium",6.94],
    ["Be","Beryllium",9.0122],
    ["B","Boron",10.81],
    ["C","Carbon",12.011],
    ["N","Nitrogen",14.007],
    ["O","Oxygen",15.999],
    ["F","Fluorine",18.998],
    ["Ne","Neon",20.18],
    ["Na","Sodium",22.99],
    ["Mg","Magnesium",24.305],
    ["Al","Aluminium",26.982],
    ["Si","Silicon",28.085],
    ["P","Phosphorus",30.974],
    ["S","Sulfur",32.06],
    ["Cl","Chlorine",35.45],
    ["Ar","Argon",39.95],
    ["K","Potassium",39.098],
    ["Ca","Calcium",40.078],
    ["Sc","Scandium",44.956],
    ["Ti","Titanium",47.867],
    ["V","Vanadium",50.942],
    ["Cr","Chromium",51.996],
    ["Mn","Manganese",54.938],
    ["Fe","Iron",55.845],
    ["Co","Cobalt",58.933],
    ["Ni","Nickel",58.693],
    ["Cu","Copper",63.546],
    ["Zn","Zinc",65.38],
    ["Ga","Gallium",69.723],
    ["Ge","Germanium",72.63],
    ["As","Arsenic",74.922],
    ["Se","Selenium",78.971],
    ["Br","Bromine",79.904],
    ["Kr","Krypton",83.798],
    ["Rb","Rubidium",85.468],
    ["Sr","Strontium",87.62],
    ["Y","Yttrium",88.906],
    ["Zr","Zirconium",91.224],
    ["Nb","Niobium",92.906],
    ["Mo","Molybdenum",95.95],
    ["Tc","Technetium",97],
    ["Ru","Ruthenium",101.07],
    ["Rh","Rhodium",102.91],
    ["Pd","Palladium",106.42],
    ["Ag","Silver",107.87],
    ["Cd","Cadmium",112.41],
    ["In","Indium",114.82],
    ["Sn","Tin",118.71],
    ["Sb","Antimony",121.76],
    ["Te","Tellurium",127.6],
    ["I","Iodine",126.9],
    ["Xe","Xenon",131.29],
    ["Cs","Caesium",132.91],
    ["Ba","Barium",137.33],
    ["La","Lanthanum",138.91],
    ["Ce","Cerium",140.12],
    ["Pr","Praseodymium",140.91],
    ["Nd","Neodymium",144.24],
    ["Pm","Promethium",145],
    ["Sm","Samarium",150.36],
    ["Eu","Europium",151.96],
    ["Gd","Gadolinium",157.25],
    ["Tb","Terbium",158.93],
    ["Dy","Dysprosium",162.5],
    ["Ho","Holmium",164.93],
    ["Er","Erbium",167.26],
    ["Tm","Thulium",168.93],
    ["Yb","Ytterbium",173.05],
    ["Lu","Lutetium",174.97],
    ["Hf","Hafnium",178.49],
    ["Ta","Tantalum",180.95],
    ["W","Tungsten",183.84],
    ["Re","Rhenium",186.21],
    ["Os","Osmium",190.23],
    ["Ir","Iridium",192.22],
    ["Pt","Platinum",195.08],
    ["Au","Gold",196.97],
    ["Hg","Mercury",200.59],
    ["Tl","Thallium",204.38],
    ["Pb","Lead",207.2],
    ["Bi","Bismuth",208.98],
    ["Po","Polonium",209],
    ["At","Astatine",210],
    ["Rn","Radon",222],
    ["Fr","Francium",223],
    ["Ra","Radium",226],
    ["Ac","Actinium",227],
    ["Th","Thorium",232.04],
    ["Pa","Protactinium",231.04],
    ["U","Uranium",238.03],
    ["Np","Neptunium",237],
    ["Pu","Plutonium",244],
    ["Am","Americium",243],
    ["Cm","Curium",247],
    ["Bk","Berkelium",247],
    ["Cf","Californium",251],
    ["Es","Einsteinium",252],
    ["Fm","Fermium",257],
    ["Md","Mendelevium",258],
    ["No","Nobelium",259],
    ["Lr","Lawrencium",266],
    ["Rf","Rutherfordium",267],
    ["Db","Dubnium",268],
    ["Sg","Seaborgium",267],
    ["Bh","Bohrium",270],
    ["Hs","Hassium",271],
    ["Mt","Meitnerium",278],
    ["Ds","Darmstadtium",281],
    ["Rg","Roentgenium",282],
    ["Cn","Copernicium",285],
    ["Nh","Nihonium",286],
    ["Fl","Flerovium",289],
    ["Mc","Moscovium",290],
    ["Lv","Livermorium",293],
    ["Ts","Tennessine",294],
    ["Og","Oganesson",294]
  ];
  const BY = {};
  ELEMENTS.forEach((e) => { BY[e[0]] = e; });

  const CHEMICALS = [
    ['H2O', 'Water'], ['CO2', 'Carbon Dioxide'], ['NH3', 'Ammonia'], ['NaCl', 'Table Salt (Sodium Chloride)'], ['H2SO4', 'Sulfuric Acid'], ['HCl', 'Hydrochloric Acid'], ['HNO3', 'Nitric Acid'],
    ['NaHCO3', 'Sodium Bicarbonate (Baking Soda)'], ['CaCO3', 'Calcium Carbonate'], ['KCl', 'Potassium Chloride'], ['[Co(NH3)6]Cl3', 'Hexaamminecobalt(III) chloride'], ['KMnO4', 'Potassium permanganate'],
    ['CuSO4.5H2O', 'Copper(II) sulfate pentahydrate'], ['CH4', 'Methane'], ['C2H5OH', 'Ethanol'], ['C2H4O2', 'Acetic Acid'], ['C6H12O6', 'Glucose'], ['C6H6', 'Benzene'], ['C8H18', 'Octane'],
    ['C12H22O11', 'Sucrose'], ['C9H8O4', 'Aspirin'], ['C6H8O7', 'Citric Acid'], ['CH4N2O', 'Urea'],
  ];
  const sel = el('mw-common');
  sel.add(new Option('-- Select --', ''));
  CHEMICALS.forEach((c) => sel.add(new Option(`${c[0]} (${c[1]})`, c[0])));

  const OPEN = { '(': ')', '[': ']', '{': '}' };
  const MAX_COUNT = 1e9;

  // Adds the elements of one frame into another, multiplied by k. Keeps first-seen order.
  function merge(into, from, k) {
    for (const [sym, n] of from) into.set(sym, (into.get(sym) || 0) + n * k);
  }
  // Reads a whole number starting at i. Returns [value or null, next index].
  function readInt(s, i) {
    let j = i;
    while (j < s.length && s[j] >= '0' && s[j] <= '9') j++;
    if (j === i) return [null, i];
    if (j - i > 9) return [NaN, j];
    return [Number(s.slice(i, j)), j];
  }

  // Parses one formula without hydrate dots. Returns { map } or { error }.
  function parseGroup(s) {
    const stack = [{ map: new Map(), close: null }];
    let i = 0;
    while (i < s.length) {
      const ch = s[i];
      if (OPEN[ch]) { stack.push({ map: new Map(), close: OPEN[ch] }); i++; continue; }
      if (ch === ')' || ch === ']' || ch === '}') {
        const top = stack.pop();
        if (stack.length === 0 || top.close !== ch) return { error: `The brackets do not match near "${ch}".` };
        let [k, j] = readInt(s, i + 1);
        if (Number.isNaN(k) || k === 0 || (k !== null && k > MAX_COUNT)) return { error: 'A number after a bracket must be a whole number from 1 to 1,000,000,000.' };
        merge(stack[stack.length - 1].map, top.map, k === null ? 1 : k);
        i = j; continue;
      }
      if (/[A-Za-z]/.test(ch)) {
        let sym = ch.toUpperCase(), len = 1;
        const next = s[i + 1];
        if (next && /[a-z]/.test(next) && BY[sym + next]) { sym += next; len = 2; }
        if (!BY[sym]) return { error: `"${s.slice(i, i + 2).replace(/[^A-Za-z]/g, '')}" is not an element symbol. Remember that symbols are case-sensitive, like Co and CO.` };
        let [k, j] = readInt(s, i + len);
        if (Number.isNaN(k) || k === 0 || (k !== null && k > MAX_COUNT)) return { error: 'A subscript must be a whole number from 1 to 1,000,000,000.' };
        const m = stack[stack.length - 1].map;
        m.set(sym, (m.get(sym) || 0) + (k === null ? 1 : k));
        i = j; continue;
      }
      if (ch >= '0' && ch <= '9') return { error: 'A number must follow an element or a closing bracket.' };
      return { error: `The character "${ch}" is not allowed in a formula.` };
    }
    if (stack.length !== 1) return { error: 'A bracket was opened but not closed.' };
    return { map: stack[0].map };
  }

  // Full formula with hydrate parts, such as CuSO4.5H2O. Returns { map, html } or { error }.
  function parse(input) {
    const s = input.replace(/\s+/g, '').replace(/[·•*]/g, '.');
    if (!s) return { error: 'Enter a molecular formula, such as H2O.' };
    const parts = s.split('.').filter((p) => p !== '');
    if (!parts.length) return { error: 'Enter a molecular formula, such as H2O.' };
    const total = new Map();
    const htmlParts = [];
    for (const part of parts) {
      let [k, j] = readInt(part, 0);
      if (Number.isNaN(k) || k === 0 || (k !== null && k > MAX_COUNT)) return { error: 'A leading number must be a whole number from 1 to 1,000,000,000.' };
      const body = part.slice(j);
      if (!body) return { error: `The number ${part} has no formula after it.` };
      const g = parseGroup(body);
      if (g.error) return g;
      merge(total, g.map, k === null ? 1 : k);
      let h = '';
      for (let x = 0; x < body.length; x++) {
        const c = body[x];
        if (c >= '0' && c <= '9') { let y = x; while (y < body.length && body[y] >= '0' && body[y] <= '9') y++; h += `<sub>${body.slice(x, y)}</sub>`; x = y - 1; } else h += c;
      }
      htmlParts.push((k === null ? '' : k) + h);
    }
    return { map: total, html: htmlParts.join('·') };
  }

  function run() {
    const out = 'mw-result';
    const r = parse(el('mw-f').value);
    if (r.error) return C.error(out, r.error);
    let weight = 0, atoms = 0;
    const rows = [];
    for (const [sym, n] of r.map) {
      const e = BY[sym], sub = e[2] * n;
      weight += sub; atoms += n; rows.push([sym, e[1], n, e[2], sub]);
    }
    if (!(weight < 1e15) || !(atoms < 1e15)) return C.error(out, 'That formula is too large to calculate.');
    const clean = (v) => C.dec(Number(v.toFixed(6)), 6);
    let html = C.big(`Molecular weight of ${r.html}`, `${clean(weight)} g/mol`);
    html += '<div class="schedule-table-wrap" style="margin-top:14px;"><table class="schedule-table"><thead><tr><th>Atom</th><th>Count</th><th>Atomic weight (g/mol)</th><th>Mass subtotal (g/mol)</th></tr></thead><tbody>';
    rows.forEach(([sym, name, n, aw, sub]) => {
      html += `<tr><td>${sym} (${name})</td><td>${C.group(n)}</td><td>${clean(aw)}</td><td>${clean(sub)} (${C.fixed((sub / weight) * 100, 2)}%)</td></tr>`;
    });
    html += `<tr><td><strong>Total</strong></td><td><strong>${C.group(atoms)}</strong></td><td></td><td><strong>${clean(weight)} (100%)</strong></td></tr></tbody></table></div>`;
    html += C.note('Atomic weights are the abridged IUPAC standard values. Molecular weight and molar mass are used here to mean the same thing, in grams per mole.');
    el(out).innerHTML = html;
  }

  sel.addEventListener('change', () => { if (sel.value) { el('mw-f').value = sel.value; run(); } });
  el('mw-form').addEventListener('submit', (e) => { e.preventDefault(); run(); });
  el('mw-f').addEventListener('input', () => { sel.value = ''; run(); });
  run();
})();
