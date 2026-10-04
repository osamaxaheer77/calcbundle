'use strict';

(function () {
  const C = window.CalcCommon;
  if (!C || !C.el('br-form')) return;
  const el = C.el;
  const EPS = 1e-9;
  const CM = 2.54;

  // Cup letters in each system, smallest first.
  const US = ['AA', 'A', 'B', 'C', 'D', 'DD/E', 'DDD/F', 'DDDD/G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R'];
  const UK = ['AA', 'A', 'B', 'C', 'D', 'DD', 'E', 'F', 'FF', 'G', 'GG', 'H', 'HH', 'J', 'JJ', 'K', 'KK', 'L', 'LL', 'M'];
  const AU = ['AA', 'A', 'B', 'C', 'D', 'DD', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'];
  const EU = ['AA', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
  const cupOf = (list, i) => (i < list.length ? list[i] : 'too big to have a cup size');

  function calc() {
    const out = 'br-result';
    const bustV = C.num('br-bust'), bandV = C.num('br-band');
    if (bustV === null || !Number.isFinite(bustV) || !(bustV > 0)) return C.error(out, 'Enter the bust size, more than 0.');
    if (bandV === null || !Number.isFinite(bandV) || !(bandV > 0)) return C.error(out, 'Enter the band size, more than 0.');
    const bustIn = el('br-bust-u').value === 'cm' ? bustV / CM : bustV;
    const bandIn = el('br-band-u').value === 'cm' ? bandV / CM : bandV;
    const diffIn = bustIn - bandIn;
    if (diffIn < -EPS) return C.error(out, 'The bust size must be larger than the band size, which is measured under the bust.');
    const diffCm = diffIn * CM;
    const inchIdx = Math.floor(diffIn + EPS), euIdx = Math.floor(diffCm / 2 + EPS);

    // Band sizes. The US and UK size comes from inches, the European one from centimeters.
    const size = 2 * Math.floor((bandIn + 1) / 2);
    const bandCm = bandIn * CM;
    const eu = 5 * Math.floor((bandCm + 2.5) / 5 + EPS) - 10;
    const euOk = eu >= 60 && eu <= 105;
    const uk = eu >= 65 ? 6 + ((eu - 65) / 5) * 2 : null;       // UK dress code
    const au = eu >= 65 ? uk + 2 : null;                          // Australia and New Zealand dress code
    const small = 'band too small to have size', big = 'band too big to have size';
    const bad = eu < 60 ? small : big;
    const rows = [
      ['US/CA', euOk ? `${size}` : bad, cupOf(US, inchIdx)],
      ['UK', euOk ? (uk === null ? `${size}` : `${size} or dress code ${uk}`) : bad, cupOf(UK, inchIdx)],
      ['US/CA (Underbust +4)*', euOk ? `${size + 4}` : bad, cupOf(US, inchIdx)],
      ['UK (Underbust +4)*', euOk ? `${size + 4}` : bad, cupOf(UK, inchIdx)],
      ['EU (EN 13402)', euOk ? `${eu} cm` : bad, cupOf(EU, euIdx)],
      ['FR/BE/ES', euOk ? `${eu + 15} cm` : bad, cupOf(EU, euIdx)],
      ['Australia/New Zealand', euOk ? (au === null ? 'too small to have a size' : `dress code ${au}`) : bad, cupOf(AU, inchIdx)],
    ];
    let html = '<div class="schedule-table-wrap"><table class="schedule-table"><thead><tr><th>Location</th><th>Size</th><th>Cup</th></tr></thead><tbody>';
    rows.forEach((r) => { html += `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`; });
    html += '</tbody></table></div>';
    html += C.note('This is only a starting point. A professional fitting, or trying on bras to see which sizes work best, is recommended.');
    html += C.note('* A few makers use the underbust +4 method, which adds four or five inches to the band size.');
    el(out).innerHTML = html;
  }

  // ---- Converter ----
  const BANDS = [
    [28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60],
    [28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60],
    [60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125, 130, 135, 140],
    [75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150, 155],
    [6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38],
    [32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 62, 64],
    [32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 62, 64],
    [4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36],
  ];
  const NAMES = ['US/CA', 'UK', 'EU (EN 13402)', 'FR/BE/ES', 'Australia/New Zealand', 'US/CA (Underbust +4)', 'UK (Underbust +4)', 'UK Dress Code'];
  const CUPS = [US.slice(0, 9), UK.slice(0, 9), EU.slice(0, 9), EU.slice(0, 9), ['AA', 'A', 'B', 'C', 'D', 'DD', 'E', 'F', 'G'], US.slice(0, 9), UK.slice(0, 9), UK.slice(0, 9)];
  const sizeText = (loc, v) => (loc === 0 || loc === 1 || loc === 5 || loc === 6 ? `${v} inches` : loc === 2 || loc === 3 ? `${v} cm` : `dress code ${v}`);
  const locSel = el('bc-loc'), sizeSel = el('bc-size'), cupSel = el('bc-cup');
  NAMES.forEach((n, i) => locSel.add(new Option(n, i)));
  function populate() {
    const loc = Number(locSel.value);
    sizeSel.innerHTML = ''; cupSel.innerHTML = '';
    BANDS[loc].forEach((v, i) => sizeSel.add(new Option(sizeText(loc, v), i)));
    CUPS[loc].forEach((c, i) => cupSel.add(new Option(c, i)));
    sizeSel.value = 3; cupSel.value = 3;
  }
  function convert() {
    const loc = Number(locSel.value), si = Number(sizeSel.value), ci = Number(cupSel.value);
    let html = `<p style="font-size:15px;margin:0 0 10px;">A bra size of <strong>${BANDS[loc][si]}${CUPS[loc][ci]}</strong> in ${NAMES[loc]} is equivalent to:</p>`;
    html += '<div class="schedule-table-wrap"><table class="schedule-table"><thead><tr><th>Location</th><th>Size</th><th>Cup</th></tr></thead><tbody>';
    NAMES.forEach((n, i) => { if (i !== loc) html += `<tr><td>${n}</td><td>${sizeText(i, BANDS[i][si])}</td><td>${CUPS[i][ci]}</td></tr>`; });
    html += '</tbody></table></div>';
    el('bc-result').innerHTML = html;
  }

  el('br-form').addEventListener('submit', (e) => { e.preventDefault(); calc(); });
  el('br-form').addEventListener('input', calc);
  el('br-form').addEventListener('change', calc);
  locSel.addEventListener('change', () => { populate(); convert(); });
  el('bc-form').addEventListener('submit', (e) => { e.preventDefault(); convert(); });
  el('bc-form').addEventListener('change', convert);
  populate();
  calc();
  convert();
})();
