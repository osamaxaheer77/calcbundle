'use strict';

(function () {
  const C = window.CalcCommon;
  if (!C || !C.el('sh-form')) return;
  const el = C.el;
  const CM = 2.54;
  const r5 = (v) => Math.round(v * 2) / 2;          // nearest half size, halves go up
  const r1 = (v) => Math.round(v);                  // nearest whole size, halves go up
  const clean = (v) => (v === 0 ? 0 : v);           // never print -0

  // Each size system turns a foot length in cm into { v: size, ok: inside the chart range } and a size back into cm.
  // The kids systems use the little-kid formula up to size 13.5, then restart with the big-kid formula.
  const kids = (offLittle, offBig, bigMax) => (cm) => {
    const L = cm / CM, little = r5(3 * L - offLittle);
    if (little <= 13.5) return { v: little, ok: little > -0.25 };
    const big = r5(3 * L - offBig);
    return { v: big, ok: big <= bigMax };
  };
  const SYS = {
    usw: { name: 'US/Canada women', size: (cm) => { const v = r5((3 * cm) / CM - 21); return { v, ok: v >= 1 }; }, toCm: (s) => ((s + 21) / 3) * CM },
    usm: { name: 'US/Canada men', size: (cm) => { const v = r5((3 * cm) / CM - 22); return { v, ok: v >= 1 }; }, toCm: (s) => ((s + 22) / 3) * CM },
    uk: { name: 'UK/India', size: (cm) => { const v = r5((3 * cm) / CM - 23); return { v, ok: v >= 1 }; }, toCm: (s) => ((s + 23) / 3) * CM },
    eu: { name: 'EU', size: (cm) => { const v = r1(1.5 * cm + 2); return { v, ok: v >= 10 }; }, toCm: (s) => (s - 2) / 1.5 },
    jp: { name: 'Japan/Mexico', size: (cm) => ({ v: r5(cm), ok: cm >= 5 }), toCm: (s) => s },
    cn: { name: 'China', size: (cm) => { const v = r1(2 * cm - 10); return { v, ok: v >= 5 }; }, toCm: (s) => (s + 10) / 2 },
    usk: { name: 'US/Canada kids', size: kids(9.75, 22.75, 7), toCm: (s) => ((s <= 7 ? s + 22.75 : s + 9.75) / 3) * CM, max: 13.5 },
    ukk: { name: 'UK/India kids', size: kids(10.75, 23.75, 6), toCm: (s) => ((s <= 6 ? s + 23.75 : s + 10.75) / 3) * CM, max: 13.5 },
    usi: { name: 'US/Canada infants/toddlers', size: (cm) => { const v = r5((3 * cm) / CM - 9.75); return { v, ok: v > -0.25 && v <= 13.5 }; }, toCm: (s) => ((s + 9.75) / 3) * CM, max: 13.5 },
    uki: { name: 'UK/India infants/toddlers', size: (cm) => { const v = r5((3 * cm) / CM - 10.75); return { v, ok: v > -0.25 && v <= 13.5 }; }, toCm: (s) => ((s + 10.75) / 3) * CM, max: 13.5 },
  };
  // The range of sizes each box accepts.
  const LIM = { usw: [0, 20], usm: [0, 20], uk: [0, 20], eu: [10, 60], jp: [6, 60], cn: [3, 60], usk: [0, 13.5], ukk: [0, 13.5], usi: [0, 13.5], uki: [0, 13.5] };
  const FOOT = { cm: [5, 50], mm: [50, 500], in: [2, 20] };
  const GROUPS = {
    a: ['usw', 'usm', 'uk', 'eu', 'jp', 'cn'],
    k: ['usk', 'ukk', 'eu', 'jp', 'cn'],
    i: ['usi', 'uki', 'eu', 'jp', 'cn'],
  };

  const group = el('sh-group'), basis = el('sh-basis'), unit = el('sh-unit');
  function applyBasis() {
    const isLen = basis.value === 'fl';
    el('sh-unit-box').style.display = isLen ? '' : 'none';
    el('sh-v-label').textContent = isLen ? 'Foot Length' : `${SYS[basis.value].name} Shoe Size`;
  }
  function fillBasis() {
    const keep = basis.value;
    basis.innerHTML = '';
    basis.add(new Option('Foot length', 'fl'));
    GROUPS[group.value].forEach((k) => basis.add(new Option(`${SYS[k].name} shoe size`, k)));
    if ([...basis.options].some((o) => o.value === keep)) basis.value = keep;
    applyBasis();
  }

  function run() {
    const out = 'sh-result';
    const g = group.value, b = basis.value;
    const raw = C.num('sh-v');
    if (raw === null || !Number.isFinite(raw)) return C.error(out, 'Enter a number.');
    let cm, head;
    if (b === 'fl') {
      const u = unit.value, f = FOOT[u];
      if (raw < f[0] || raw > f[1]) return C.error(out, `Enter a foot length from ${f[0]} to ${f[1]} ${u === 'in' ? 'inches' : u}.`);
      cm = u === 'cm' ? raw : u === 'mm' ? raw / 10 : raw * CM;
      head = `Foot length of ${C.dec(raw, 2)} ${u === 'in' ? 'inches' : u}`;
    } else {
      const s = SYS[b];
      const lim = LIM[b];
      if (raw < lim[0] || raw > lim[1]) return C.error(out, `Enter a ${s.name} size from ${lim[0]} to ${lim[1]}.`);
      cm = s.toCm(raw);
      head = `${s.name} shoe size of ${C.dec(raw, 2)}`;
    }
    if (!(cm > 0) || cm > 100) return C.error(out, 'That is outside the range this calculator covers.');

    let html = `<p style="font-size:15px;margin:0 0 10px;"><strong>${head}</strong> is equivalent to:</p>`;
    GROUPS[g].forEach((k) => {
      if (k === b) return;
      const r = SYS[k].size(cm);
      html += C.row(SYS[k].name, r.ok ? C.dec(clean(r.v), 1) : 'out of scope');
    });
    html += C.row('Foot length', `${C.fixed(cm / CM, 1)} inches`) + C.row('', `${C.fixed(cm, 1)} cm`) + C.row('', `${C.fixed(cm * 10, 0)} mm`);
    html += C.note('Shoe sizes are only a guide, because there is no global standard and every brand cuts its shoes differently. Try shoes on, and measure your feet in the afternoon, when they are largest.');
    el(out).innerHTML = html;
  }

  group.addEventListener('change', () => { fillBasis(); run(); });
  basis.addEventListener('change', () => { applyBasis(); run(); });
  unit.addEventListener('change', run);
  el('sh-form').addEventListener('submit', (e) => { e.preventDefault(); run(); });
  el('sh-form').addEventListener('input', run);
  fillBasis();
  run();
})();
