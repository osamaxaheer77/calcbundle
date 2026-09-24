'use strict';

/**
 * Shared 5-key time-value-of-money engine (matches BA II Plus / HP 12C
 * convention): solves PV*(1+i)^n + PMT*((1+i)^n-1)/i*(1+i*due) + FV = 0
 * for whichever variable is unknown, where i is the periodic rate implied
 * by I/Y (nominal annual) converted from C/Y compounding to P/Y payments.
 */
const TVM = {
  periodicRate(iy, cy, py) {
    if (iy === 0) return 0;
    const effAnnual = Math.pow(1 + (iy / 100) / cy, cy) - 1;
    return Math.pow(1 + effAnnual, 1 / py) - 1;
  },

  annuityFactor(i, n, due) {
    if (i === 0) return n;
    return ((Math.pow(1 + i, n) - 1) / i) * (due ? (1 + i) : 1);
  },

  solveFV(n, i, pv, pmt, due) {
    return -(pv * Math.pow(1 + i, n) + pmt * this.annuityFactor(i, n, due));
  },
  solvePV(n, i, pmt, fv, due) {
    return -(fv + pmt * this.annuityFactor(i, n, due)) / Math.pow(1 + i, n);
  },
  solvePMT(n, i, pv, fv, due) {
    const af = this.annuityFactor(i, n, due);
    return -(fv + pv * Math.pow(1 + i, n)) / af;
  },
  solveN(i, pv, pmt, fv) {
    if (i === 0) return -(fv + pv) / pmt;
    if (pmt === 0) return Math.log(-fv / pv) / Math.log(1 + i);
    // Iterative fallback for PMT != 0 with N unknown (bisection on N).
    const f = (n) => this.solveFV(n, i, pv, pmt, false) - fv;
    let lo = 0.0001, hi = 1000;
    for (let k = 0; k < 200; k++) {
      const mid = (lo + hi) / 2;
      if (f(mid) > 0 === f(lo) > 0) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  },
  solveIY(n, pv, pmt, fv, py, cy, due) {
    function fvAtPeriodic(iPeriodic) {
      return -(pv * Math.pow(1 + iPeriodic, n) + pmt * (iPeriodic === 0 ? n : ((Math.pow(1 + iPeriodic, n) - 1) / iPeriodic) * (due ? (1 + iPeriodic) : 1)));
    }
    let lo = -0.99, hi = 10;
    const target = fv;
    for (let k = 0; k < 200; k++) {
      const mid = (lo + hi) / 2;
      const val = fvAtPeriodic(mid);
      if ((val > target) === (fvAtPeriodic(lo) > target)) lo = mid; else hi = mid;
    }
    const iPeriodic = (lo + hi) / 2;
    const effAnnual = Math.pow(1 + iPeriodic, py) - 1;
    return (Math.pow(1 + effAnnual, 1 / cy) - 1) * cy * 100;
  },

  schedule(n, i, pv, pmt, due) {
    const rows = [];
    let realBal = pv;
    for (let p = 1; p <= Math.round(n); p++) {
      const startBal = realBal;
      let interestAbs, realBalNew;
      if (due) {
        const afterPmt = startBal + pmt;
        interestAbs = afterPmt * i;
        realBalNew = afterPmt + interestAbs;
      } else {
        interestAbs = startBal * i;
        realBalNew = startBal + pmt + interestAbs;
      }
      rows.push({ period: p, pv: startBal, pmt, interest: interestAbs, fv: -realBalNew });
      realBal = realBalNew;
    }
    return rows;
  },
};

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('fin-form');
  if (!form) return;

  const currency = (v) => '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function num(id, fallback = 0) {
    const field = el(id);
    if (!field) return fallback;
    const v = parseFloat(field.value);
    return Number.isFinite(v) ? v : fallback;
  }

  function lineChart(rows, width = 640, height = 220) {
    if (!rows.length) return '';
    const pvSeries = rows.map((r) => r.pv);
    const fvSeries = rows.map((r) => r.fv);
    let cumPmt = 0, cumInt = 0;
    const cumPmtSeries = [], cumIntSeries = [];
    rows.forEach((r) => { cumPmt += r.pmt; cumInt += r.interest; cumPmtSeries.push(cumPmt); cumIntSeries.push(cumInt); });
    const all = [...pvSeries, ...fvSeries, ...cumPmtSeries, ...cumIntSeries];
    const maxY = Math.max(...all, 0);
    const minY = Math.min(...all, 0);
    const range = (maxY - minY) || 1;
    const stepX = width / (rows.length - 1 || 1);
    const toY = (v) => height - ((v - minY) / range) * height;
    const toPoints = (arr) => arr.map((v, idx) => `${(idx * stepX).toFixed(1)},${toY(v).toFixed(1)}`).join(' ');
    return `
      <svg viewBox="0 0 ${width} ${height}" class="line-chart" preserveAspectRatio="none">
        <polyline points="${toPoints(pvSeries)}" fill="none" stroke="var(--accent)" stroke-width="2" />
        <polyline points="${toPoints(fvSeries)}" fill="none" stroke="#dc2626" stroke-width="2" />
        <polyline points="${toPoints(cumPmtSeries)}" fill="none" stroke="#f59e0b" stroke-width="2" />
        <polyline points="${toPoints(cumIntSeries)}" fill="none" stroke="#10b981" stroke-width="2" />
      </svg>`;
  }

  let solveFor = 'FV';

  function calculate() {
    const n = num('fin-n', 0);
    const iy = num('fin-iy', 0);
    const pv = num('fin-pv', 0);
    const pmt = num('fin-pmt', 0);
    const fvInput = num('fin-fv', 0);
    const py = Math.max(num('fin-py', 1), 1);
    const cy = Math.max(num('fin-cy', 1), 1);
    const due = el('fin-due').value === 'begin';

    const i = TVM.periodicRate(iy, cy, py);
    let result, label, rows;

    if (solveFor === 'FV') {
      result = TVM.solveFV(n, i, pv, pmt, due);
      label = 'FV';
      rows = TVM.schedule(n, i, pv, pmt, due);
    } else if (solveFor === 'PMT') {
      result = TVM.solvePMT(n, i, pv, fvInput, due);
      label = 'PMT';
      rows = TVM.schedule(n, i, pv, result, due);
    } else if (solveFor === 'IY') {
      result = TVM.solveIY(n, pv, pmt, fvInput, py, cy, due);
      label = 'I/Y';
      const iSolved = TVM.periodicRate(result, cy, py);
      rows = TVM.schedule(n, iSolved, pv, pmt, due);
    } else if (solveFor === 'N') {
      result = TVM.solveN(i, pv, pmt, fvInput);
      label = 'N';
      rows = TVM.schedule(result, i, pv, pmt, due);
    } else {
      result = TVM.solvePV(n, i, pmt, fvInput, due);
      label = 'PV';
      rows = TVM.schedule(n, i, result, pmt, due);
    }

    const sumPmt = pmt * (solveFor === 'N' ? result : n);
    const fvForInterest = solveFor === 'FV' ? result : fvInput;
    const pvForInterest = solveFor === 'PV' ? result : pv;
    const totalInterest = Math.abs(fvForInterest + pvForInterest + sumPmt);

    el('fin-result').innerHTML = `
      <div class="summary-payment-box">
        <div class="label">${label}</div>
        <div class="value">${label === 'N' ? result.toFixed(4) : label === 'I/Y' ? result.toFixed(4) + '%' : currency(result)}</div>
      </div>
      <div class="stat-row"><span>Sum of All Periodic Payments</span><strong>${currency(sumPmt)}</strong></div>
      <div class="stat-row"><span>Total Interest</span><strong>${currency(totalInterest)}</strong></div>
    `;

    el('fin-chart-wrap').innerHTML = lineChart(rows);

    let tableHtml = '<table class="schedule-table"><thead><tr><th>Period</th><th>PV</th><th>PMT</th><th>Interest</th><th>FV</th></tr></thead><tbody>';
    rows.forEach((r) => { tableHtml += `<tr><td>${r.period}</td><td>${currency(r.pv)}</td><td>${currency(r.pmt)}</td><td>${currency(r.interest)}</td><td>${currency(r.fv)}</td></tr>`; });
    tableHtml += '</tbody></table>';
    el('fin-table-wrap').innerHTML = tableHtml;
    el('fin-results-section').hidden = false;
  }

  form.querySelectorAll('input[name="fin-tab"]').forEach((r) => {
    r.addEventListener('change', () => {
      solveFor = r.value;
      ['n', 'iy', 'pv', 'pmt', 'fv'].forEach((f) => {
        el(`fin-${f}-field`).hidden = f.toUpperCase() === solveFor;
      });
      calculate();
    });
  });

  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  calculate();
})();
