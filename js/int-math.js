'use strict';

// Whole-number helpers shared by the LCM, GCF and Factor calculators.
window.IntMath = (function () {
  const gcd = (a, b) => { while (b) { [a, b] = [b, a % b]; } return a < 0n ? -a : a; };
  const lcm = (a, b) => (a / gcd(a, b)) * b;

  // Splits "12, 18 24" into positive whole numbers (BigInt). Returns null if anything else is in the text.
  function parseList(text) {
    const parts = text.split(/[\s,;]+/).filter(Boolean);
    if (!parts.length || parts.some((p) => !/^\d+$/.test(p))) return null;
    const nums = parts.map((p) => BigInt(p));
    return nums.some((n) => n === 0n) ? null : nums;
  }

  // Prime factors in order, for numbers up to about 1e13. Returns null when the number is too big.
  function primeFactors(n) {
    if (n > 10000000000000n) return null;
    let v = Number(n);
    const out = [];
    for (let p = 2; p * p <= v; p += p === 2 ? 1 : 2) {
      while (v % p === 0) { out.push(p); v /= p; }
    }
    if (v > 1) out.push(v);
    return out;
  }

  function divisors(n) {
    const small = [], large = [];
    for (let i = 1; i * i <= n; i++) {
      if (n % i === 0) { small.push(i); if (i * i !== n) large.push(n / i); }
    }
    return small.concat(large.reverse());
  }

  const times = (list) => (list.length ? list.join(' × ') : '1');
  const group = (s) => String(s).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return { gcd, lcm, parseList, primeFactors, divisors, times, group };
})();
