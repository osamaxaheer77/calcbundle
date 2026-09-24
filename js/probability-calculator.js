'use strict';

(function () {
  const el = (id) => document.getElementById(id);

  function num(id, fallback = null) {
    const field = el(id);
    if (!field) return fallback;
    const v = parseFloat(field.value);
    return Number.isFinite(v) ? v : fallback;
  }

  function fmt(n, dp = 5) {
    return n.toLocaleString('en-US', { maximumFractionDigits: dp });
  }

  /* ---------- Panel 1: Probability of Two Events ---------- */
  const form1 = el('prob1-form');
  if (form1) {
    function calc1() {
      const pa = num('prob1-a');
      const pb = num('prob1-b');
      if (pa === null || pb === null || pa < 0 || pa > 1 || pb < 0 || pb > 1) {
        el('prob1-result').innerHTML = '<p class="tool-result is-error">Enter P(A) and P(B) as values between 0 and 1.</p>';
        return;
      }
      const notA = 1 - pa;
      const notB = 1 - pb;
      const intersection = pa * pb;
      const union = pa + pb - intersection;
      const xor = pa + pb - 2 * intersection;
      const neither = 1 - union;

      el('prob1-result').innerHTML = `
        <div class="summary-payment-box">
          <div class="label">P(A &cap; B) &mdash; Both Occur</div>
          <div class="value">${fmt(intersection)}</div>
        </div>
        <div class="stat-row"><span>P(A') &mdash; A does not occur</span><strong>${fmt(notA)}</strong></div>
        <div class="stat-row"><span>P(B') &mdash; B does not occur</span><strong>${fmt(notB)}</strong></div>
        <div class="stat-row"><span>P(A &cup; B) &mdash; A or B or both</span><strong>${fmt(union)}</strong></div>
        <div class="stat-row"><span>P(A &Delta; B) &mdash; A or B, not both</span><strong>${fmt(xor)}</strong></div>
        <div class="stat-row"><span>P((A &cup; B)') &mdash; Neither occurs</span><strong>${fmt(neither)}</strong></div>
      `;
    }
    form1.addEventListener('submit', (e) => { e.preventDefault(); calc1(); });
    calc1();
  }

  /* ---------- Panel 2: Normal Distribution ---------- */
  const form2 = el('prob2-form');
  if (form2) {
    function erf(x) {
      const sign = x < 0 ? -1 : 1;
      x = Math.abs(x);
      const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
      const t = 1 / (1 + p * x);
      const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
      return sign * y;
    }
    function normalCdf(x) {
      return 0.5 * (1 + erf(x / Math.SQRT2));
    }
    function parseBound(str) {
      const s = str.trim().toLowerCase();
      if (s === '-inf' || s === '-infinity') return -Infinity;
      if (s === 'inf' || s === 'infinity' || s === '+inf') return Infinity;
      const v = parseFloat(s);
      return Number.isFinite(v) ? v : null;
    }

    function calc2() {
      const mean = num('prob2-mean', 0);
      const sd = num('prob2-sd');
      const leftStr = el('prob2-left').value;
      const rightStr = el('prob2-right').value;
      const left = parseBound(leftStr);
      const right = parseBound(rightStr);

      if (sd === null || sd <= 0 || left === null || right === null) {
        el('prob2-result').innerHTML = '<p class="tool-result is-error">Enter a positive standard deviation and valid bounds (numbers, or -inf / inf).</p>';
        return;
      }
      if (left >= right) {
        el('prob2-result').innerHTML = '<p class="tool-result is-error">The left bound must be less than the right bound.</p>';
        return;
      }

      const zLeft = left === -Infinity ? -Infinity : (left - mean) / sd;
      const zRight = right === Infinity ? Infinity : (right - mean) / sd;
      const cdfLeft = zLeft === -Infinity ? 0 : normalCdf(zLeft);
      const cdfRight = zRight === Infinity ? 1 : normalCdf(zRight);
      const p = cdfRight - cdfLeft;

      el('prob2-result').innerHTML = `
        <div class="summary-payment-box">
          <div class="label">P(${leftStr} &lt; X &lt; ${rightStr})</div>
          <div class="value">${fmt(p, 5)}</div>
          <div style="font-size:13px;color:var(--text-muted);margin-top:4px;">${(p * 100).toFixed(3)}%</div>
        </div>
        <div class="stat-row"><span>z (left bound)</span><strong>${zLeft === -Infinity ? '-&infin;' : fmt(zLeft, 4)}</strong></div>
        <div class="stat-row"><span>z (right bound)</span><strong>${zRight === Infinity ? '&infin;' : fmt(zRight, 4)}</strong></div>
      `;
    }
    form2.addEventListener('submit', (e) => { e.preventDefault(); calc2(); });
    calc2();
  }
})();
