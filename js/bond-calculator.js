'use strict';

/**
 * Standard fixed-rate coupon bond pricing (bonds valued on a coupon date):
 * Price = sum(couponPayment / (1+r)^t) + faceValue / (1+r)^n
 * where r is the periodic yield (annual yield / periods per year) and n is
 * the total number of coupon periods to maturity.
 */
const Bond = {
  FREQ_N: { a: 1, s: 2, q: 4, m: 12 },

  annuityFactor(r, n) {
    if (r === 0) return n;
    return (1 - Math.pow(1 + r, -n)) / r;
  },

  price(faceValue, couponPerPeriod, r, n) {
    return couponPerPeriod * this.annuityFactor(r, n) + faceValue / Math.pow(1 + r, n);
  },

  solveYield(price, faceValue, couponPerPeriod, n, freqN) {
    function priceAt(rPeriodic) {
      return couponPerPeriod * (rPeriodic === 0 ? n : (1 - Math.pow(1 + rPeriodic, -n)) / rPeriodic) + faceValue / Math.pow(1 + rPeriodic, n);
    }
    let lo = -0.5, hi = 5;
    const decreasing = priceAt(lo) > priceAt(hi);
    for (let i = 0; i < 200; i++) {
      const mid = (lo + hi) / 2;
      if ((priceAt(mid) > price) === decreasing) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2 * freqN * 100;
  },

  solveYears(price, faceValue, couponPerPeriod, r, freqN) {
    function priceAtN(n) {
      return couponPerPeriod * (r === 0 ? n : (1 - Math.pow(1 + r, -n)) / r) + faceValue / Math.pow(1 + r, n);
    }
    let lo = 0.01, hi = 200;
    const decreasing = priceAtN(lo) > priceAtN(hi);
    for (let i = 0; i < 200; i++) {
      const mid = (lo + hi) / 2;
      if ((priceAtN(mid) > price) === decreasing) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2 / freqN;
  },
};

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('bond-form');
  if (!form) return;

  const currency = (v) => '$' + v.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 });

  function num(id, fallback = 0) {
    const field = el(id);
    if (!field) return fallback;
    const v = parseFloat(field.value);
    return Number.isFinite(v) ? v : fallback;
  }

  let solveFor = 'price';

  function calculate() {
    const freqKey = el('bond-frequency').value;
    const freqN = Bond.FREQ_N[freqKey];
    const couponUnit = el('bond-coupon-unit').value; // pct | amt

    const faceValue = num('bond-face', 100);
    const yieldPct = num('bond-yield', 0);
    const years = num('bond-years', 0);
    const couponInput = num('bond-coupon', 0);
    const priceInput = num('bond-price', 0);

    const r = yieldPct / 100 / freqN;
    const n = years * freqN;
    const couponPerPeriod = (couponUnit === 'pct' ? faceValue * couponInput / 100 : couponInput) / freqN;

    let result, label;

    if (solveFor === 'price') {
      result = Bond.price(faceValue, couponPerPeriod, r, n);
      label = 'Price';
    } else if (solveFor === 'face') {
      // Price = couponPerPeriod*AF + FV/(1+r)^n; couponPerPeriod may itself depend on FV if % mode.
      const af = Bond.annuityFactor(r, n);
      const df = Math.pow(1 + r, -n);
      if (couponUnit === 'pct') {
        const couponRatePerPeriod = couponInput / 100 / freqN;
        result = priceInput / (couponRatePerPeriod * af + df);
      } else {
        result = (priceInput - couponPerPeriod * af) / df;
      }
      label = 'Face Value';
    } else if (solveFor === 'yield') {
      result = Bond.solveYield(priceInput, faceValue, couponPerPeriod, n, freqN);
      label = 'Yield';
    } else if (solveFor === 'years') {
      result = Bond.solveYears(priceInput, faceValue, couponPerPeriod, r, freqN);
      label = 'Time to Maturity';
    } else {
      const af = Bond.annuityFactor(r, n);
      const df = Math.pow(1 + r, -n);
      const couponPerPeriodSolved = (priceInput - faceValue * df) / af;
      result = couponUnit === 'pct' ? (couponPerPeriodSolved * freqN / faceValue) * 100 : couponPerPeriodSolved * freqN;
      label = 'Annual Coupon';
    }

    let displayValue;
    if (solveFor === 'yield') displayValue = result.toFixed(4) + '%';
    else if (solveFor === 'years') displayValue = result.toFixed(3) + ' years';
    else if (solveFor === 'coupon') displayValue = couponUnit === 'pct' ? result.toFixed(4) + '%' : currency(result);
    else displayValue = currency(result);

    el('bond-result').innerHTML = `
      <div class="summary-payment-box">
        <div class="label">${label}</div>
        <div class="value">${displayValue}</div>
      </div>
      <p class="headline-sub">Given the other four values, the ${label.toLowerCase()} of this bond is <strong>${displayValue}</strong>.</p>
    `;
  }

  function updateFieldVisibility() {
    el('bond-price-field').hidden = solveFor === 'price';
    el('bond-face-field').hidden = solveFor === 'face';
    el('bond-yield-field').hidden = solveFor === 'yield';
    el('bond-years-field').hidden = solveFor === 'years';
    el('bond-coupon-field').hidden = solveFor === 'coupon';
  }

  form.querySelectorAll('input[name="bond-tab"]').forEach((r) => {
    r.addEventListener('change', () => { solveFor = r.value; updateFieldVisibility(); calculate(); });
  });
  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });

  updateFieldVisibility();
  calculate();
})();
