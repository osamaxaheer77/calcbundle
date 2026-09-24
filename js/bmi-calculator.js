'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('bmi-form');
  if (!form) return;

  function num(id, fallback = 0) {
    const field = el(id);
    if (!field) return fallback;
    const v = parseFloat(field.value);
    return Number.isFinite(v) ? v : fallback;
  }

  const CLASSES = [
    { max: 16, label: 'Severe Thinness' },
    { max: 17, label: 'Moderate Thinness' },
    { max: 18.5, label: 'Mild Thinness' },
    { max: 25, label: 'Normal' },
    { max: 30, label: 'Overweight' },
    { max: 35, label: 'Obese Class I' },
    { max: 40, label: 'Obese Class II' },
    { max: Infinity, label: 'Obese Class III' },
  ];
  function classify(bmi) {
    for (const c of CLASSES) if (bmi < c.max) return c.label;
    return 'Obese Class III';
  }

  function gauge(bmi) {
    const width = 560, height = 70;
    const scaleMin = 15, scaleMax = 40;
    const toX = (v) => ((Math.min(Math.max(v, scaleMin), scaleMax) - scaleMin) / (scaleMax - scaleMin)) * width;
    const stops = [
      { from: scaleMin, to: 18.5, color: '#60a5fa' },
      { from: 18.5, to: 25, color: '#10b981' },
      { from: 25, to: 30, color: '#f59e0b' },
      { from: 30, to: scaleMax, color: '#ef4444' },
    ];
    let rects = '';
    stops.forEach((s) => {
      const x1 = toX(s.from), x2 = toX(s.to);
      rects += `<rect x="${x1}" y="20" width="${x2 - x1}" height="16" fill="${s.color}"></rect>`;
    });
    const markerX = toX(bmi);
    const ticks = [16, 18.5, 25, 30, 35, 40].map((t) => {
      const x = toX(t);
      return `<line x1="${x}" y1="20" x2="${x}" y2="36" stroke="#fff" stroke-width="1.5" opacity="0.7"></line><text x="${x}" y="52" font-size="10" fill="var(--text-muted)" text-anchor="middle">${t}</text>`;
    }).join('');
    return `
      <svg viewBox="0 0 ${width} ${height}" class="bmi-gauge" style="width:100%;height:auto;">
        <rect x="0" y="20" width="${width}" height="16" rx="8" fill="#e7eaf0"></rect>
        ${rects}
        ${ticks}
        <polygon points="${markerX - 7},0 ${markerX + 7},0 ${markerX},14" fill="var(--text-primary)"></polygon>
      </svg>`;
  }

  function calculate() {
    const unit = form.querySelector('input[name="bmi-unit"]:checked').value;
    let heightM, weightKg, heightForUS = 0, weightLbs = 0;

    if (unit === 'us') {
      const ft = num('bmi-ft', 0);
      const inch = num('bmi-in', 0);
      const lbs = num('bmi-lbs', 0);
      heightForUS = ft * 12 + inch;
      weightLbs = lbs;
      heightM = heightForUS * 0.0254;
      weightKg = lbs * 0.45359237;
    } else {
      const cm = num('bmi-cm', 0);
      const kg = num('bmi-kg', 0);
      heightM = cm / 100;
      weightKg = kg;
      heightForUS = cm / 2.54;
      weightLbs = kg / 0.45359237;
    }

    if (heightM <= 0 || weightKg <= 0) {
      el('bmi-result').innerHTML = '<p class="tool-result is-error">Enter a valid height and weight.</p>';
      return;
    }

    const bmi = weightKg / (heightM * heightM);
    const category = classify(bmi);
    const bmiPrime = bmi / 25;
    const ponderal = weightKg / Math.pow(heightM, 3);

    let healthyLowDisplay, healthyHighDisplay;
    if (unit === 'us') {
      const lowLbs = 18.5 * heightForUS * heightForUS / 703;
      const highLbs = 25 * heightForUS * heightForUS / 703;
      healthyLowDisplay = lowLbs.toFixed(1) + ' lbs';
      healthyHighDisplay = highLbs.toFixed(1) + ' lbs';
    } else {
      const lowKg = 18.5 * heightM * heightM;
      const highKg = 25 * heightM * heightM;
      healthyLowDisplay = lowKg.toFixed(1) + ' kg';
      healthyHighDisplay = highKg.toFixed(1) + ' kg';
    }

    el('bmi-result').innerHTML = `
      <div class="summary-payment-box">
        <div class="label">BMI</div>
        <div class="value">${bmi.toFixed(1)} kg/m&sup2;</div>
        <div style="font-size:14px;font-weight:600;color:var(--accent);margin-top:4px;">${category}</div>
      </div>
      ${gauge(bmi)}
      <div class="stat-row"><span>Healthy BMI Range</span><strong>18.5 &ndash; 25 kg/m&sup2;</strong></div>
      <div class="stat-row"><span>Healthy Weight for Height</span><strong>${healthyLowDisplay} &ndash; ${healthyHighDisplay}</strong></div>
      <div class="stat-row"><span>BMI Prime</span><strong>${bmiPrime.toFixed(2)}</strong></div>
      <div class="stat-row"><span>Ponderal Index</span><strong>${ponderal.toFixed(1)} kg/m&sup3;</strong></div>
    `;
  }

  function updateUnitVisibility() {
    const unit = form.querySelector('input[name="bmi-unit"]:checked').value;
    el('bmi-us-fields').hidden = unit !== 'us';
    el('bmi-metric-fields').hidden = unit !== 'metric';
  }

  form.querySelectorAll('input[name="bmi-unit"]').forEach((r) => r.addEventListener('change', () => { updateUnitVisibility(); calculate(); }));
  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });

  updateUnitVisibility();
  calculate();
})();
