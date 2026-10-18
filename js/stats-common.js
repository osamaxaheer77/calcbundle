'use strict';

// Normal and Student t helpers shared by the Z-score and Confidence Interval calculators.
window.StatsCommon = (function () {
  const SQRT2PI = Math.sqrt(2 * Math.PI);
  const pdf = (x) => Math.exp(-0.5 * x * x) / SQRT2PI;

  // Upper tail Q(x) = P(Z > x) for x >= 0. A series for small x, a continued fraction for the tail.
  function upperTail(x) {
    if (x < 3) {
      let term = x, sum = x;
      for (let k = 1; k < 400; k++) { term *= (x * x) / (2 * k + 1); sum += term; if (term < 1e-17 * sum) break; }
      return 0.5 - pdf(x) * sum;
    }
    let f = x;
    for (let k = 120; k >= 1; k--) f = x + k / f;
    return pdf(x) / f;
  }
  // P(Z < x)
  function cdf(x) {
    if (x === Infinity) return 1;
    if (x === -Infinity) return 0;
    return x >= 0 ? 1 - upperTail(x) : upperTail(-x);
  }
  // P(Z > x), accurate in the tail
  const sf = (x) => cdf(-x);

  // Inverse of the normal CDF by bisection on the tail-accurate function.
  function inv(p) {
    if (p <= 0) return -Infinity;
    if (p >= 1) return Infinity;
    let lo = -40, hi = 40;
    for (let i = 0; i < 200; i++) {
      const mid = (lo + hi) / 2;
      if (cdf(mid) < p) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }

  // ---- Student t ----
  function lgamma(x) {
    const c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
    let y = x, tmp = x + 5.5; tmp -= (x + 0.5) * Math.log(tmp);
    let ser = 1.000000000190015;
    for (let j = 0; j < 6; j++) ser += c[j] / ++y;
    return -tmp + Math.log(2.5066282746310005 * ser / x);
  }
  function betacf(a, b, x) {
    const FPMIN = 1e-300; let qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap;
    if (Math.abs(d) < FPMIN) d = FPMIN; d = 1 / d; let h = d;
    for (let m = 1; m <= 500; m++) {
      const m2 = 2 * m; let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN; c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN; d = 1 / d; h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN; c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN; d = 1 / d;
      const del = d * c; h *= del; if (Math.abs(del - 1) < 3e-16) break;
    }
    return h;
  }
  function ibeta(x, a, b) {
    if (x <= 0) return 0; if (x >= 1) return 1;
    const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b;
  }
  // P(T > t) for t >= 0
  const tUpper = (t, df) => 0.5 * ibeta(df / (df + t * t), df / 2, 0.5);
  // Two-sided critical value: P(|T| < t) = level
  function tCritical(level, df) {
    const target = (1 - level) / 2; let lo = 0, hi = 1;
    while (tUpper(hi, df) > target && hi < 1e8) hi *= 2;
    for (let i = 0; i < 200; i++) { const mid = (lo + hi) / 2; if (tUpper(mid, df) > target) lo = mid; else hi = mid; }
    return (lo + hi) / 2;
  }

  return { cdf, sf, inv, tCritical, pdf };
})();
