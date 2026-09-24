'use strict';

const InvestMath = {
  COMPOUND_N: { annually: 1, semiannually: 2, quarterly: 4, monthly: 12, semimonthly: 24, biweekly: 26, weekly: 52, daily: 365 },

  periodicRate(ratePct, compoundKey, contribN) {
    if (compoundKey === 'continuously') {
      const effAnnual = Math.exp(ratePct / 100) - 1;
      return Math.pow(1 + effAnnual, 1 / contribN) - 1;
    }
    const cN = this.COMPOUND_N[compoundKey];
    const effAnnual = Math.pow(1 + ratePct / 100 / cN, cN) - 1;
    return Math.pow(1 + effAnnual, 1 / contribN) - 1;
  },

  annuityFactor(i, n, due) {
    if (i === 0) return n;
    return ((Math.pow(1 + i, n) - 1) / i) * (due ? (1 + i) : 1);
  },

  solveFV(pv, pmt, i, n, due) {
    return pv * Math.pow(1 + i, n) + pmt * this.annuityFactor(i, n, due);
  },
  solvePV(fv, pmt, i, n, due) {
    return (fv - pmt * this.annuityFactor(i, n, due)) / Math.pow(1 + i, n);
  },
  solvePMT(fv, pv, i, n, due) {
    const af = this.annuityFactor(i, n, due);
    return af === 0 ? 0 : (fv - pv * Math.pow(1 + i, n)) / af;
  },
  solveN(fv, pv, pmt, i) {
    if (i === 0) return (fv - pv) / pmt;
    const f = (n) => this.solveFV(pv, pmt, i, n, false) - fv;
    let lo = 0.0001, hi = 2000;
    const rising = f(hi) > f(lo);
    for (let k = 0; k < 200; k++) {
      const mid = (lo + hi) / 2;
      if ((f(mid) > 0) === rising) hi = mid; else lo = mid;
    }
    return (lo + hi) / 2;
  },
  solveRate(fv, pv, pmt, n, contribN, due) {
    function fvAt(iPeriodic) {
      return pv * Math.pow(1 + iPeriodic, n) + pmt * (iPeriodic === 0 ? n : ((Math.pow(1 + iPeriodic, n) - 1) / iPeriodic) * (due ? (1 + iPeriodic) : 1));
    }
    let lo = -0.5, hi = 2;
    const rising = fvAt(hi) > fvAt(lo);
    for (let k = 0; k < 200; k++) {
      const mid = (lo + hi) / 2;
      if ((fvAt(mid) > fv) === rising) hi = mid; else lo = mid;
    }
    const iPeriodic = (lo + hi) / 2;
    const effAnnual = Math.pow(1 + iPeriodic, contribN) - 1;
    return effAnnual * 100; // reported as annually-compounded equivalent rate
  },

  schedule(pv, pmt, i, n, due, contribPerYear) {
    const rows = [];
    let bal = pv;
    const periodsPerBucket = contribPerYear; // one "year" bucket per contribPerYear periods
    let bucketDeposit = 0, bucketInterest = 0, bucketIndex = 0;
    for (let p = 1; p <= Math.round(n); p++) {
      let periodInterest, deposit;
      if (due) {
        bal += pmt;
        periodInterest = bal * i;
        bal += periodInterest;
        deposit = pmt;
      } else {
        periodInterest = bal * i;
        bal += periodInterest;
        bal += pmt;
        deposit = pmt;
      }
      bucketDeposit += deposit;
      bucketInterest += periodInterest;
      if (p === 1) bucketDeposit += pv;
      if (p % periodsPerBucket === 0 || p === Math.round(n)) {
        bucketIndex++;
        rows.push({ year: bucketIndex, deposit: bucketDeposit, interest: bucketInterest, balance: bal });
        bucketDeposit = 0; bucketInterest = 0;
      }
    }
    return rows;
  },
};

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('inv-form');
  if (!form) return;

  const currency = (v) => '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const currency0 = (v) => '$' + Math.round(v).toLocaleString('en-US');

  function num(id, fallback = 0) {
    const field = el(id);
    if (!field) return fallback;
    const v = parseFloat(field.value);
    return Number.isFinite(v) ? v : fallback;
  }

  function donutChart(segments) {
    const total = segments.reduce((s, x) => s + Math.max(x.value, 0), 0) || 1;
    const r = 15.9155;
    let offset = 25;
    let circles = '';
    segments.forEach((seg) => {
      const p = Math.max(seg.value, 0) / total * 100;
      circles += `<circle cx="21" cy="21" r="${r}" fill="transparent" stroke="${seg.color}" stroke-width="4" stroke-dasharray="${p} ${100 - p}" stroke-dashoffset="${offset}"></circle>`;
      offset -= p;
    });
    return `<svg viewBox="0 0 42 42" class="donut">${circles}</svg>`;
  }

  let solveFor = 'end';

  function calculate() {
    const startingAmount = num('inv-start', 0);
    const years = num('inv-years', 0);
    const ratePct = num('inv-rate', 0);
    const compoundKey = el('inv-compound').value;
    const contribution = num('inv-contribution', 0);
    const contribWhen = form.querySelector('input[name="inv-contrib-when"]:checked').value;
    const contribFreq = form.querySelector('input[name="inv-contrib-freq"]:checked').value;
    const endAmountTarget = num('inv-end', 0);

    const contribN = contribFreq === 'month' ? 12 : 1;
    const n = Math.round(years * contribN);
    const due = contribWhen === 'begin';

    let fv, pv, pmt, rate, nSolved, i;

    if (solveFor === 'end') {
      i = InvestMath.periodicRate(ratePct, compoundKey, contribN);
      fv = InvestMath.solveFV(startingAmount, contribution, i, n, due);
      pv = startingAmount; pmt = contribution; rate = ratePct; nSolved = n;
    } else if (solveFor === 'contribution') {
      i = InvestMath.periodicRate(ratePct, compoundKey, contribN);
      pmt = InvestMath.solvePMT(endAmountTarget, startingAmount, i, n, due);
      fv = endAmountTarget; pv = startingAmount; rate = ratePct; nSolved = n;
    } else if (solveFor === 'rate') {
      rate = InvestMath.solveRate(endAmountTarget, startingAmount, contribution, n, contribN, due);
      i = InvestMath.periodicRate(rate, 'annually', contribN);
      fv = endAmountTarget; pv = startingAmount; pmt = contribution; nSolved = n;
    } else if (solveFor === 'start') {
      i = InvestMath.periodicRate(ratePct, compoundKey, contribN);
      pv = InvestMath.solvePV(endAmountTarget, contribution, i, n, due);
      fv = endAmountTarget; pmt = contribution; rate = ratePct; nSolved = n;
    } else {
      i = InvestMath.periodicRate(ratePct, compoundKey, contribN);
      nSolved = InvestMath.solveN(endAmountTarget, startingAmount, contribution, i);
      fv = endAmountTarget; pv = startingAmount; pmt = contribution; rate = ratePct;
    }

    const totalContrib = pmt * nSolved;
    const totalInterest = fv - pv - totalContrib;

    const labels = { end: 'End Balance', contribution: 'Additional Contribution', rate: 'Return Rate', start: 'Starting Amount', length: 'Investment Length' };
    const values = {
      end: currency(fv),
      contribution: currency(pmt) + (contribFreq === 'month' ? '/month' : '/year'),
      rate: rate.toFixed(3) + '%',
      start: currency(pv),
      length: (nSolved / contribN).toFixed(2) + ' years',
    };

    const segments = [
      { value: pv, color: 'var(--accent)', label: 'Starting Amount' },
      { value: totalContrib, color: '#f59e0b', label: 'Total Contributions' },
      { value: totalInterest, color: '#10b981', label: 'Interest' },
    ];

    el('inv-result').innerHTML = `
      <div class="summary-payment-box">
        <div class="label">${labels[solveFor]}</div>
        <div class="value">${values[solveFor]}</div>
      </div>
      <div class="stat-row"><span>End Balance</span><strong>${currency0(fv)}</strong></div>
      <div class="stat-row"><span>Starting Amount</span><strong>${currency0(pv)}</strong></div>
      <div class="stat-row"><span>Total Contributions</span><strong>${currency0(totalContrib)}</strong></div>
      <div class="stat-row"><span>Total Interest</span><strong>${currency0(totalInterest)}</strong></div>
      <div class="donut-wrap" style="margin-top:16px;">
        ${donutChart(segments)}
        <div class="donut-legend">${segments.map((s) => `<span class="legend-item"><span class="legend-dot" style="background:${s.color}"></span>${s.label}</span>`).join('')}</div>
      </div>
    `;

    const rows = InvestMath.schedule(pv, pmt, i, nSolved, due, contribN);
    let tableHtml = '<table class="schedule-table"><thead><tr><th>Year</th><th>Deposit</th><th>Interest</th><th>Ending Balance</th></tr></thead><tbody>';
    rows.forEach((r) => { tableHtml += `<tr><td>${r.year}</td><td>${currency(r.deposit)}</td><td>${currency(r.interest)}</td><td>${currency(r.balance)}</td></tr>`; });
    tableHtml += '</tbody></table>';
    el('inv-table-wrap').innerHTML = tableHtml;
    el('inv-results-section').hidden = false;
  }

  function updateFieldVisibility() {
    el('inv-end-field').hidden = solveFor === 'end';
    el('inv-contribution-field').hidden = solveFor === 'contribution';
    el('inv-rate-field').hidden = solveFor === 'rate';
    el('inv-start-field').hidden = solveFor === 'start';
    el('inv-years-field').hidden = solveFor === 'length';
  }

  form.querySelectorAll('input[name="inv-tab"]').forEach((r) => {
    r.addEventListener('change', () => { solveFor = r.value; updateFieldVisibility(); calculate(); });
  });
  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });

  updateFieldVisibility();
  calculate();
})();
