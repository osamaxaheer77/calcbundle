'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('conv-form');
  if (!form) return;

  const UNITS = {
    length: {
      base: 'meter',
      factors: {
        meter: 1, kilometer: 1000, centimeter: 0.01, millimeter: 0.001,
        micrometer: 0.000001, mile: 1609.344, yard: 0.9144, foot: 0.3048, inch: 0.0254
      },
      labels: {
        meter: 'Meter', kilometer: 'Kilometer', centimeter: 'Centimeter', millimeter: 'Millimeter',
        micrometer: 'Micrometer', mile: 'Mile', yard: 'Yard', foot: 'Foot', inch: 'Inch'
      }
    },
    area: {
      base: 'sqmeter',
      factors: {
        sqmeter: 1, sqkilometer: 1000000, sqcentimeter: 0.0001, sqmile: 2589988.110336,
        sqyard: 0.83612736, sqfoot: 0.09290304, sqinch: 0.00064516, acre: 4046.8564224, hectare: 10000
      },
      labels: {
        sqmeter: 'Square Meter', sqkilometer: 'Square Kilometer', sqcentimeter: 'Square Centimeter',
        sqmile: 'Square Mile', sqyard: 'Square Yard', sqfoot: 'Square Foot', sqinch: 'Square Inch',
        acre: 'Acre', hectare: 'Hectare'
      }
    },
    volume: {
      base: 'liter',
      factors: {
        liter: 1, milliliter: 0.001, cubicmeter: 1000, cubicfoot: 28.316846592, cubicinch: 0.016387064,
        gallon: 3.785411784, quart: 0.946352946, pint: 0.473176473, cup: 0.2365882365, fluidounce: 0.0295735295625
      },
      labels: {
        liter: 'Liter', milliliter: 'Milliliter', cubicmeter: 'Cubic Meter', cubicfoot: 'Cubic Foot',
        cubicinch: 'Cubic Inch', gallon: 'Gallon (US)', quart: 'Quart (US)', pint: 'Pint (US)',
        cup: 'Cup (US)', fluidounce: 'Fluid Ounce (US)'
      }
    },
    weight: {
      base: 'kilogram',
      factors: {
        kilogram: 1, gram: 0.001, milligram: 0.000001, metricton: 1000,
        pound: 0.45359237, ounce: 0.028349523125, ustorn: 907.18474, stone: 6.35029318
      },
      labels: {
        kilogram: 'Kilogram', gram: 'Gram', milligram: 'Milligram', metricton: 'Metric Ton',
        pound: 'Pound', ounce: 'Ounce', ustorn: 'US Ton (short)', stone: 'Stone'
      }
    },
    temperature: {
      units: ['celsius', 'fahrenheit', 'kelvin'],
      labels: { celsius: 'Celsius', fahrenheit: 'Fahrenheit', kelvin: 'Kelvin' }
    }
  };

  function toCelsius(v, unit) {
    if (unit === 'celsius') return v;
    if (unit === 'fahrenheit') return (v - 32) * 5 / 9;
    if (unit === 'kelvin') return v - 273.15;
  }
  function fromCelsius(c, unit) {
    if (unit === 'celsius') return c;
    if (unit === 'fahrenheit') return c * 9 / 5 + 32;
    if (unit === 'kelvin') return c + 273.15;
  }

  function populateUnitSelect(select, category) {
    select.innerHTML = '';
    const spec = UNITS[category];
    const keys = spec.units || Object.keys(spec.factors);
    keys.forEach((key) => {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = spec.labels[key];
      select.appendChild(opt);
    });
  }

  function refreshUnits() {
    const category = el('conv-category').value;
    populateUnitSelect(el('conv-from'), category);
    populateUnitSelect(el('conv-to'), category);
    if (category === 'length') el('conv-to').value = 'foot';
    if (category === 'area') el('conv-to').value = 'sqfoot';
    if (category === 'volume') el('conv-to').value = 'gallon';
    if (category === 'weight') el('conv-to').value = 'pound';
    if (category === 'temperature') el('conv-to').value = 'fahrenheit';
  }

  function calculate() {
    const category = el('conv-category').value;
    const value = parseFloat(el('conv-value').value);
    const fromUnit = el('conv-from').value;
    const toUnit = el('conv-to').value;
    const resultEl = el('conv-result');

    if (isNaN(value)) {
      resultEl.innerHTML = '<p class="tool-result is-error">Enter a value to convert.</p>';
      return;
    }

    let result;
    if (category === 'temperature') {
      result = fromCelsius(toCelsius(value, fromUnit), toUnit);
    } else {
      const spec = UNITS[category];
      const baseValue = value * spec.factors[fromUnit];
      result = baseValue / spec.factors[toUnit];
    }

    const fmt = (n) => {
      if (Math.abs(n) >= 1e9 || (Math.abs(n) < 1e-6 && n !== 0)) return n.toExponential(6);
      return n.toLocaleString('en-US', { maximumFractionDigits: 6 });
    };

    resultEl.innerHTML = `
      <div class="summary-payment-box">
        <div class="label">Result</div>
        <div class="value">${fmt(result)} ${UNITS[category].labels[toUnit]}</div>
      </div>
      <div class="stat-row"><span>${value} ${UNITS[category].labels[fromUnit]}</span><strong>=</strong></div>
    `;
  }

  el('conv-category').addEventListener('change', () => { refreshUnits(); calculate(); });
  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  el('conv-value').addEventListener('input', calculate);
  el('conv-from').addEventListener('change', calculate);
  el('conv-to').addEventListener('change', calculate);

  refreshUnits();
  el('conv-from').value = 'mile';
  el('conv-value').value = 5;
  calculate();
})();
