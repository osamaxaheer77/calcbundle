'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('density-form');
  if (!form) return;

  const DENSITY_TO_KGM3 = {
    kgm3: 1, kgcm3: 1000000, gm3: 0.001, gcm3: 1000, kgL: 1000, gL: 1,
    lbin3: 27679.9047, lbft3: 16.01846337, lbyd3: 0.593276421,
    lbgalus: 119.826427, lbgaluk: 99.7763734
  };
  const DENSITY_LABELS = {
    kgm3: 'kg/m³', kgcm3: 'kg/cm³', gm3: 'g/m³', gcm3: 'g/cm³', kgL: 'kg/L', gL: 'g/L',
    lbin3: 'lb/in³', lbft3: 'lb/ft³', lbyd3: 'lb/yd³', lbgalus: 'lb/gal (US)', lbgaluk: 'lb/gal (UK)'
  };

  const VOLUME_TO_M3 = {
    m3: 1, liter: 0.001, ml: 0.000001, galus: 0.003785411784, galuk: 0.00454609,
    ft3: 0.028316846592, yd3: 0.764554857984, in3: 0.000016387064, cm3: 0.000001
  };
  const VOLUME_LABELS = {
    m3: 'm³', liter: 'L', ml: 'mL', galus: 'gal (US)', galuk: 'gal (UK)',
    ft3: 'ft³', yd3: 'yd³', in3: 'in³', cm3: 'cm³'
  };

  const MASS_TO_KG = {
    kg: 1, g: 0.001, mg: 0.000001, ton: 1000, lb: 0.45359237, oz: 0.028349523125, carat: 0.0002
  };
  const MASS_LABELS = { kg: 'kg', g: 'g', mg: 'mg', ton: 'metric ton', lb: 'lb', oz: 'oz', carat: 'ct' };

  const fmt = (n) => n.toLocaleString('en-US', { maximumFractionDigits: 6 });

  function calculate() {
    const solveFor = el('density-solve-for').value;
    const densityVal = parseFloat(el('density-density').value);
    const densityUnit = el('density-density-unit').value;
    const volumeVal = parseFloat(el('density-volume').value);
    const volumeUnit = el('density-volume-unit').value;
    const massVal = parseFloat(el('density-mass').value);
    const massUnit = el('density-mass-unit').value;
    const resultEl = el('density-result');

    if (solveFor === 'density') {
      if (isNaN(volumeVal) || isNaN(massVal)) {
        resultEl.innerHTML = '<p class="tool-result is-error">Enter both volume and mass.</p>';
        return;
      }
      const kgm3 = (massVal * MASS_TO_KG[massUnit]) / (volumeVal * VOLUME_TO_M3[volumeUnit]);
      const result = kgm3 / DENSITY_TO_KGM3[densityUnit];
      resultEl.innerHTML = `
        <div class="summary-payment-box">
          <div class="label">Density</div>
          <div class="value">${fmt(result)} ${DENSITY_LABELS[densityUnit]}</div>
        </div>
        ${densityUnit !== 'kgm3' ? `<div class="stat-row"><span>Or</span><strong>${fmt(kgm3)} kg/m&sup3;</strong></div>` : ''}
      `;
    } else if (solveFor === 'volume') {
      if (isNaN(densityVal) || isNaN(massVal)) {
        resultEl.innerHTML = '<p class="tool-result is-error">Enter both density and mass.</p>';
        return;
      }
      const m3 = (massVal * MASS_TO_KG[massUnit]) / (densityVal * DENSITY_TO_KGM3[densityUnit]);
      const result = m3 / VOLUME_TO_M3[volumeUnit];
      resultEl.innerHTML = `
        <div class="summary-payment-box">
          <div class="label">Volume</div>
          <div class="value">${fmt(result)} ${VOLUME_LABELS[volumeUnit]}</div>
        </div>
        ${volumeUnit !== 'm3' ? `<div class="stat-row"><span>Or</span><strong>${fmt(m3)} m&sup3;</strong></div>` : ''}
      `;
    } else {
      if (isNaN(densityVal) || isNaN(volumeVal)) {
        resultEl.innerHTML = '<p class="tool-result is-error">Enter both density and volume.</p>';
        return;
      }
      const kg = densityVal * DENSITY_TO_KGM3[densityUnit] * volumeVal * VOLUME_TO_M3[volumeUnit];
      const result = kg / MASS_TO_KG[massUnit];
      resultEl.innerHTML = `
        <div class="summary-payment-box">
          <div class="label">Mass</div>
          <div class="value">${fmt(result)} ${MASS_LABELS[massUnit]}</div>
        </div>
        ${massUnit !== 'kg' ? `<div class="stat-row"><span>Or</span><strong>${fmt(kg)} kg</strong></div>` : ''}
      `;
    }
  }

  function refreshFields() {
    const solveFor = el('density-solve-for').value;
    el('density-density').disabled = solveFor === 'density';
    el('density-volume').disabled = solveFor === 'volume';
    el('density-mass').disabled = solveFor === 'mass';
    if (solveFor === 'density') el('density-density').value = '';
    if (solveFor === 'volume') el('density-volume').value = '';
    if (solveFor === 'mass') el('density-mass').value = '';
  }

  el('density-solve-for').addEventListener('change', () => { refreshFields(); calculate(); });
  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  form.querySelectorAll('input, select').forEach((i) => i.addEventListener('input', calculate));

  refreshFields();
  calculate();
})();
