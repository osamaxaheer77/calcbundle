'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const S = window.StatsCommon;
  if (!el('zs-form') || !S) return;

  // Probabilities: five significant digits down to 0.0001, then five decimal places.
  function p(v) {
    if (!(v >= 0)) v = 0;
    if (v > 1) v = 1;
    const s = v >= 1e-4 ? v.toPrecision(5) : v.toFixed(5);
    return String(Number(s));
  }
  // Z-scores: five significant digits for a positive value below 1, otherwise five decimal places.
  const z5 = (v) => String(Number(v > 0 && v < 1 ? v.toPrecision(5) : v.toFixed(5)));
  // Z from a probability: three significant digits for a positive value below 1, otherwise three decimals.
  const z3 = (v) => String(Number(v > 0 && v < 1 ? v.toPrecision(3) : v.toFixed(3)));
  const raw = (id) => el(id).value.trim();
  const toNum = (s) => (s === '' ? NaN : Number(s));
  const error = (id, msg) => { el(id).innerHTML = `<p class="tool-result is-error">${msg}</p>`; };
  const line = (t) => `<div class="stat-row"><span>${t[0]}</span><strong>${t[1]}</strong></div>`;

  // ---- 1. Z-score from a raw score ----
  function zScore() {
    const x = toNum(raw('zs-x')), mu = toNum(raw('zs-mean')), sd = toNum(raw('zs-sd'));
    if (!Number.isFinite(x)) return error('zs-result', 'Please provide a numerical raw score value.');
    if (!Number.isFinite(mu)) return error('zs-result', 'Please provide a numerical population mean value.');
    if (!Number.isFinite(sd) || sd <= 0) return error('zs-result', 'Please provide a numerical and positive standard deviation value.');
    const z = (x - mu) / sd;
    const lower = S.cdf(z), upper = S.sf(z);
    const mid = Math.abs(lower - 0.5);
    const lo = Math.min(x, mu), hi = Math.max(x, mu);
    const dp = (v) => String(Number(v.toPrecision(12)));
    el('zs-result').innerHTML =
      `<div class="summary-payment-box"><div class="label">Z-score</div><div class="value" style="overflow-wrap:anywhere;">${z5(z)}</div></div>` +
      line([`Probability of x &lt; ${dp(x)}`, p(lower)]) +
      line([`Probability of x &gt; ${dp(x)}`, p(upper)]) +
      line([`Probability of ${dp(lo)} &lt; x &lt; ${dp(hi)}`, p(mid)]) +
      `<div class="callout" style="margin-top:14px;overflow-wrap:anywhere;"><strong>Steps:</strong> z = (x &minus; &mu;) &divide; &sigma; = (${dp(x)} &minus; ${dp(mu)}) &divide; ${dp(sd)} = ${z5(z)}.<br>` +
      `P(x &lt; ${dp(x)}) = ${p(lower)} and P(x &gt; ${dp(x)}) = 1 &minus; ${p(lower)} = ${p(upper)}.<br>` +
      `The probability between the mean and your score is ${p(mid)}.</div>`;
  }

  // ---- 2. Z-score and probability converter ----
  function converter() {
    const fields = ['zc-z', 'zc-p', 'zc-pg', 'zc-p0', 'zc-pin', 'zc-pout'];
    const first = fields.find((id) => raw(id) !== '');
    if (!first) return error('zc-result', 'Please provide one value to calculate.');
    const v = toNum(raw(first));
    if (!Number.isFinite(v)) return error('zc-result', 'Please provide a numerical value.');
    let z, given;
    const ranges = {
      'zc-p': ['P(x&lt;Z)', 0, 1], 'zc-pg': ['P(x&gt;Z)', 0, 1], 'zc-p0': ['P(0 to Z or Z to 0)', 0, 0.5],
      'zc-pin': ['P(-Z&lt;x&lt;Z)', 0, 1], 'zc-pout': ['P(x&lt;-Z or x&gt;Z)', 0, 1],
    };
    if (first === 'zc-z') { z = v; given = `Z = ${String(Number(v.toPrecision(12)))}`; }
    else {
      const [label, lo, hi] = ranges[first];
      if (v < lo || v > hi) return error('zc-result', `Please provide a ${label} value between ${lo} and ${hi}.`);
      given = `${label} = ${raw(first)}`;
      if (first === 'zc-p') z = S.inv(v);
      else if (first === 'zc-pg') z = -S.inv(v);
      else if (first === 'zc-p0') z = S.inv(0.5 + v);
      else if (first === 'zc-pin') z = S.inv(0.5 + v / 2);
      else z = S.inv(1 - v / 2);
    }
    const zShow = z === Infinity ? '∞' : z === -Infinity ? '-∞' : z3(z);
    const az = Math.abs(z);
    const lower = S.cdf(z), upper = S.sf(z), between = S.cdf(az) - 0.5, inside = 1 - 2 * S.sf(az), outside = 2 * S.sf(az);
    const zeroLabel = z < 0 ? 'P(Z&lt;x&lt;0)' : 'P(0&lt;x&lt;Z)';
    el('zc-result').innerHTML =
      `<div class="summary-payment-box"><div class="label">Given ${given}</div><div class="value" style="overflow-wrap:anywhere;">Z = ${zShow}</div>${first !== 'zc-z' ? `<div class="label" style="margin-top:6px;">More precisely, Z = ${z5(z)}</div>` : ''}</div>` +
      line(['P(x&lt;Z)', p(lower)]) + line(['P(x&gt;Z)', p(upper)]) + line([zeroLabel, p(between)]) +
      line(['P(-Z&lt;x&lt;Z)', p(inside)]) + line(['P(x&lt;-Z or x&gt;Z)', p(outside)]);
  }

  // ---- 3. Probability between two z-scores ----
  function between() {
    const a = toNum(raw('zr-z1')), b = toNum(raw('zr-z2'));
    if (!Number.isFinite(a) || !Number.isFinite(b)) return error('zr-result', 'Please provide numerical values for both z-scores.');
    const lo = Math.min(a, b), hi = Math.max(a, b);
    const inside = S.cdf(hi) - S.cdf(lo);
    const num = (v) => String(Number(v.toPrecision(12)));
    el('zr-result').innerHTML =
      `<div class="summary-payment-box"><div class="label">P(${num(lo)} &lt; x &lt; ${num(hi)})</div><div class="value" style="overflow-wrap:anywhere;">${p(inside)}</div></div>` +
      line([`P(x &lt; ${num(lo)} or x &gt; ${num(hi)})`, p(1 - inside)]) +
      line([`P(x &lt; ${num(lo)})`, p(S.cdf(lo))]) +
      line([`P(x &gt; ${num(hi)})`, p(S.sf(hi))]);
  }

  [['zs-form', zScore], ['zc-form', converter], ['zr-form', between]].forEach(([id, fn]) => {
    el(id).addEventListener('submit', (e) => { e.preventDefault(); fn(); });
  });
  // Typing in one converter box clears the others, so only one value is ever used.
  const boxes = ['zc-z', 'zc-p', 'zc-pg', 'zc-p0', 'zc-pin', 'zc-pout'];
  boxes.forEach((id) => el(id).addEventListener('input', () => { if (raw(id) !== '') boxes.forEach((o) => { if (o !== id) el(o).value = ''; }); }));
  zScore(); converter(); between();
})();
