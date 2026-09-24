'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('ohms-form');
  if (!form) return;

  const V_TO_BASE = { kilovolt: 1000, volt: 1, millivolt: 0.001 };
  const I_TO_BASE = { ampere: 1, milliampere: 0.001 };
  const R_TO_BASE = { ohm: 1, kilohm: 1000, megohm: 1000000 };
  const P_TO_BASE = { watt: 1, kilowatt: 1000, milliwatt: 0.001 };

  const fmt = (n) => {
    if (Math.abs(n) >= 1e9 || (Math.abs(n) < 1e-6 && n !== 0)) return n.toExponential(4);
    return n.toLocaleString('en-US', { maximumFractionDigits: 6 });
  };

  function calculate() {
    const vRaw = el('ohms-v').value.trim();
    const iRaw = el('ohms-i').value.trim();
    const rRaw = el('ohms-r').value.trim();
    const pRaw = el('ohms-p').value.trim();
    const resultEl = el('ohms-result');

    const v = vRaw === '' ? null : parseFloat(vRaw) * V_TO_BASE[el('ohms-v-unit').value];
    const i = iRaw === '' ? null : parseFloat(iRaw) * I_TO_BASE[el('ohms-i-unit').value];
    const r = rRaw === '' ? null : parseFloat(rRaw) * R_TO_BASE[el('ohms-r-unit').value];
    const p = pRaw === '' ? null : parseFloat(pRaw) * P_TO_BASE[el('ohms-p-unit').value];

    const known = [v, i, r, p].filter((x) => x !== null && !isNaN(x)).length;
    if (known !== 2) {
      resultEl.innerHTML = '<p class="tool-result is-error">Enter exactly 2 of the 4 values.</p>';
      return;
    }

    let V = v, I = i, R = r, P = p;
    if (V !== null && I !== null) { R = V / I; P = V * I; }
    else if (V !== null && R !== null) { I = V / R; P = (V * V) / R; }
    else if (V !== null && P !== null) { I = P / V; R = (V * V) / P; }
    else if (I !== null && R !== null) { V = I * R; P = I * I * R; }
    else if (I !== null && P !== null) { V = P / I; R = P / (I * I); }
    else if (R !== null && P !== null) { V = Math.sqrt(P * R); I = Math.sqrt(P / R); }

    resultEl.innerHTML = `
      <div class="summary-payment-box">
        <div class="label">Voltage (V)</div>
        <div class="value">${fmt(V)} V</div>
      </div>
      <div class="stat-row"><span>Current (I)</span><strong>${fmt(I)} A</strong></div>
      <div class="stat-row"><span>Resistance (R)</span><strong>${fmt(R)} &Omega;</strong></div>
      <div class="stat-row"><span>Power (P)</span><strong>${fmt(P)} W</strong></div>
    `;
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  form.querySelectorAll('input, select').forEach((elx) => elx.addEventListener('input', calculate));
  calculate();
})();
