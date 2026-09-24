'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const currency = (v) => '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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

  /* ---------- Calculator 1: present value of a future sum ---------- */
  const form1 = el('pv1-form');
  if (form1) {
    function calc1() {
      const fv = num('pv1-fv', 0);
      const n = num('pv1-years', 0);
      const rate = num('pv1-rate', 0) / 100;

      if (!(fv > 0) || n <= 0) {
        el('pv1-result').innerHTML = '<p class="tool-result is-error">Enter a future value and number of periods.</p>';
        return;
      }

      const pv = fv / Math.pow(1 + rate, n);
      const totalInterest = fv - pv;

      el('pv1-result').innerHTML = `
        <div class="summary-payment-box">
          <div class="label">Present Value</div>
          <div class="value">${currency(pv)}</div>
        </div>
        <div class="stat-row"><span>Future Value</span><strong>${currency(fv)}</strong></div>
        <div class="stat-row"><span>Total Interest</span><strong>${currency(totalInterest)}</strong></div>
      `;
    }
    form1.addEventListener('submit', (e) => { e.preventDefault(); calc1(); });
    calc1();
  }

  /* ---------- Calculator 2: present value of periodical deposits ---------- */
  const form2 = el('pv2-form');
  if (form2) {
    function annuityFactorPV(r, n, due) {
      if (r === 0) return n;
      return ((1 - Math.pow(1 + r, -n)) / r) * (due ? (1 + r) : 1);
    }
    function annuityFactorFV(r, n, due) {
      if (r === 0) return n;
      return ((Math.pow(1 + r, n) - 1) / r) * (due ? (1 + r) : 1);
    }

    function schedule(n, r, pmt, due) {
      const rows = [];
      let balance = 0, deposits = 0;
      for (let p = 1; p <= n; p++) {
        let interest;
        if (due) {
          balance += pmt;
          interest = balance * r;
          balance += interest;
        } else {
          interest = balance * r;
          balance += interest + pmt;
        }
        deposits += pmt;
        rows.push({ period: p, deposits, interest, balance });
      }
      return rows;
    }

    function calc2() {
      const n = Math.round(num('pv2-years', 0));
      const rate = num('pv2-rate', 0) / 100;
      const pmt = num('pv2-pmt', 0);
      const due = el('pv2-timing').value === 'begin';

      if (!(pmt > 0) || n <= 0) {
        el('pv2-result').innerHTML = '<p class="tool-result is-error">Enter a periodic deposit and number of periods.</p>';
        return;
      }

      const pv = pmt * annuityFactorPV(rate, n, due);
      const fv = pmt * annuityFactorFV(rate, n, due);
      const totalPrincipal = pmt * n;
      const totalInterest = fv - totalPrincipal;

      el('pv2-result').innerHTML = `
        <div class="summary-payment-box">
          <div class="label">Present Value</div>
          <div class="value">${currency(pv)}</div>
        </div>
        <div class="stat-row"><span>Future Value (FV)</span><strong>${currency(fv)}</strong></div>
        <div class="stat-row"><span>Total Principal</span><strong>${currency(totalPrincipal)}</strong></div>
        <div class="stat-row"><span>Total Interest</span><strong>${currency(totalInterest)}</strong></div>
        <div class="donut-wrap" style="margin-top:16px;">
          ${donutChart([{ value: totalPrincipal, color: 'var(--accent)' }, { value: Math.max(totalInterest, 0), color: '#10b981' }])}
          <div class="donut-legend">
            <span class="legend-item"><span class="legend-dot" style="background:var(--accent)"></span>Principal</span>
            <span class="legend-item"><span class="legend-dot" style="background:#10b981"></span>Interest</span>
          </div>
        </div>
      `;

      const rows = schedule(n, rate, pmt, due);
      let tableHtml = '<table class="schedule-table"><thead><tr><th>Period</th><th>Deposits</th><th>Interest</th><th>End Balance</th></tr></thead><tbody>';
      rows.forEach((r) => {
        tableHtml += `<tr><td>${r.period}</td><td>${currency(r.deposits)}</td><td>${currency(r.interest)}</td><td>${currency(r.balance)}</td></tr>`;
      });
      tableHtml += '</tbody></table>';
      el('pv2-table-wrap').innerHTML = tableHtml;
      el('pv2-results-section').hidden = false;
    }
    form2.addEventListener('submit', (e) => { e.preventDefault(); calc2(); });
    calc2();
  }
})();
