'use strict';

/**
 * Fraction math engine: exact integer arithmetic, no floating-point
 * fraction math anywhere (only the final decimal preview uses division).
 */
const FractionMath = {
  gcd(a, b) {
    a = Math.abs(Math.round(a));
    b = Math.abs(Math.round(b));
    while (b) { [a, b] = [b, a % b]; }
    return a || 1;
  },

  lcm(a, b) {
    return Math.abs(a * b) / this.gcd(a, b);
  },

  reduce(num, den) {
    if (den === 0) throw new Error('Denominator cannot be zero');
    if (den < 0) { num = -num; den = -den; }
    const g = this.gcd(num, den);
    return { num: num / g, den: den / g };
  },

  toImproper(whole, num, den) {
    whole = whole || 0;
    num = num || 0;
    const negative = whole < 0 || (whole === 0 && num < 0);
    const absWhole = Math.abs(whole);
    const absNum = Math.abs(num);
    const magnitude = absWhole * den + absNum;
    return { num: negative ? -magnitude : magnitude, den };
  },

  toMixed(num, den) {
    const sign = num < 0 ? -1 : 1;
    const absNum = Math.abs(num);
    const whole = Math.floor(absNum / den);
    const rem = absNum % den;
    return { whole: whole * sign, num: rem, den };
  },

  decimal(num, den, precision = 8) {
    const val = num / den;
    if (!Number.isFinite(val)) return 'Undefined';
    const rounded = parseFloat(val.toFixed(precision));
    return rounded.toString();
  },

  operate(f1, op, f2) {
    let num, den;
    switch (op) {
      case '+': num = f1.num * f2.den + f2.num * f1.den; den = f1.den * f2.den; break;
      case '-': num = f1.num * f2.den - f2.num * f1.den; den = f1.den * f2.den; break;
      case '*': num = f1.num * f2.num; den = f1.den * f2.den; break;
      case '/':
        if (f2.num === 0) throw new Error('Cannot divide by a fraction equal to zero');
        num = f1.num * f2.den; den = f1.den * f2.num; break;
      default: throw new Error('Unknown operator');
    }
    return this.reduce(num, den);
  },

  decimalToFraction(input) {
    const str = String(input).trim();
    if (!/^-?\d*\.?\d+$/.test(str)) throw new Error('Enter a plain decimal number, e.g. 1.375');
    const sign = str.startsWith('-') ? -1 : 1;
    const clean = str.replace('-', '');
    const [intPart, decPart = ''] = clean.split('.');
    const digits = (intPart || '0') + decPart;
    const numerator = sign * parseInt(digits, 10);
    const denominator = Math.pow(10, decPart.length);
    return this.reduce(numerator, denominator);
  },
};

(function () {
  const el = (id) => document.getElementById(id);

  function readFraction(prefix) {
    const whole = parseInt(el(`${prefix}-whole`).value, 10) || 0;
    const num = parseInt(el(`${prefix}-num`).value, 10);
    const den = parseInt(el(`${prefix}-den`).value, 10);
    if (Number.isNaN(num) || Number.isNaN(den)) throw new Error('Enter both a numerator and a denominator');
    if (den === 0) throw new Error('The denominator cannot be zero');
    const frac = FractionMath.toImproper(whole, num, den);
    return frac.den < 0 ? { num: -frac.num, den: -frac.den } : frac;
  }

  function formatFraction(num, den) {
    if (den === 1) return `${num}`;
    return `${num}/${den}`;
  }

  function fractionBar(num, den, color) {
    const segments = Math.min(den, 24);
    const filledSegments = Math.round((num / den) * segments);
    let html = '<div class="frac-bar">';
    for (let i = 0; i < segments; i++) {
      html += `<span class="frac-bar-seg${i < filledSegments ? ' filled' : ''}" style="${i < filledSegments ? `background:${color}` : ''}"></span>`;
    }
    html += '</div>';
    return html;
  }

  /* ============ Main calculator ============ */
  const mainForm = el('fraction-main');
  if (mainForm) {
    const resultBox = el('fraction-main-result');
    const stepsBox = el('fraction-main-steps');
    const opSelect = el('main-op');

    function renderSteps(f1, op, f2, reduced) {
      const opSymbol = { '+': '+', '-': '−', '*': '×', '/': '÷' }[op];
      let stepsHtml = '';
      let beforeReduceNum = null;
      let beforeReduceDen = null;

      if (op === '+' || op === '-') {
        const L = FractionMath.lcm(f1.den, f2.den);
        const factor1 = L / f1.den;
        const factor2 = L / f2.den;
        const n1 = f1.num * factor1;
        const n2 = f2.num * factor2;
        const combined = op === '+' ? n1 + n2 : n1 - n2;
        beforeReduceNum = combined;
        beforeReduceDen = L;
        stepsHtml += `<div class="step"><span class="step-label">1. Match the denominators</span>
          <p>${formatFraction(f1.num, f1.den)} and ${formatFraction(f2.num, f2.den)} don't share a denominator, so first find the smallest number both ${f1.den} and ${f2.den} divide into evenly — that's ${L}.</p></div>`;
        stepsHtml += `<div class="step"><span class="step-label">2. Rescale each fraction</span>
          <p>${formatFraction(f1.num, f1.den)} × ${factor1}/${factor1} = ${formatFraction(n1, L)} &nbsp;&nbsp; ${formatFraction(f2.num, f2.den)} × ${factor2}/${factor2} = ${formatFraction(n2, L)}</p></div>`;
        stepsHtml += `<div class="step"><span class="step-label">3. ${op === '+' ? 'Add' : 'Subtract'} the numerators</span>
          <p>${n1} ${opSymbol} ${n2} = ${combined}, over the shared denominator ${L} → ${formatFraction(combined, L)}</p></div>`;
      } else if (op === '*') {
        beforeReduceNum = f1.num * f2.num;
        beforeReduceDen = f1.den * f2.den;
        stepsHtml += `<div class="step"><span class="step-label">1. Multiply straight across</span>
          <p>Numerators together, denominators together: ${f1.num} × ${f2.num} = ${f1.num * f2.num}, and ${f1.den} × ${f2.den} = ${f1.den * f2.den}</p></div>`;
        stepsHtml += `<div class="step"><span class="step-label">2. Result before simplifying</span>
          <p>${formatFraction(f1.num * f2.num, f1.den * f2.den)}</p></div>`;
      } else if (op === '/') {
        beforeReduceNum = f1.num * f2.den;
        beforeReduceDen = f1.den * f2.num;
        stepsHtml += `<div class="step"><span class="step-label">1. Flip the second fraction</span>
          <p>Dividing by ${formatFraction(f2.num, f2.den)} is the same as multiplying by its reciprocal, ${formatFraction(f2.den, f2.num)}</p></div>`;
        stepsHtml += `<div class="step"><span class="step-label">2. Multiply straight across</span>
          <p>${formatFraction(f1.num, f1.den)} × ${formatFraction(f2.den, f2.num)} = ${formatFraction(f1.num * f2.den, f1.den * f2.num)}</p></div>`;
      }

      const needsReduce = FractionMath.gcd(beforeReduceNum, beforeReduceDen) > 1;

      if (needsReduce) {
        const stepNum = (op === '+' || op === '-') ? '4' : '3';
        stepsHtml += `<div class="step"><span class="step-label">${stepNum}. Simplify to lowest terms</span>
          <p>Result: <strong>${formatFraction(reduced.num, reduced.den)}</strong></p></div>`;
      }

      return stepsHtml;
    }

    mainForm.addEventListener('submit', (e) => {
      e.preventDefault();
      try {
        const f1 = readFraction('main-a');
        const f2 = readFraction('main-b');
        const op = opSelect.value;
        const reduced = FractionMath.operate(f1, op, f2);
        const decimal = FractionMath.decimal(reduced.num, reduced.den);
        const mixed = FractionMath.toMixed(reduced.num, reduced.den);

        let resultLine = `<span class="result-frac">${formatFraction(reduced.num, reduced.den)}</span>`;
        if (mixed.whole !== 0 && mixed.num !== 0) {
          resultLine += `<span class="result-mixed">= ${mixed.whole} ${mixed.num}/${mixed.den}</span>`;
        }

        resultBox.innerHTML = `
          <div class="result-main">${resultLine}</div>
          <div class="result-decimal">Decimal: ${decimal}</div>
          ${reduced.den > 1 ? fractionBar(Math.abs(reduced.num) % reduced.den, reduced.den, 'var(--accent)') : ''}
        `;
        resultBox.classList.remove('is-error');
        stepsBox.innerHTML = renderSteps(f1, op, f2, reduced);
        stepsBox.hidden = false;
      } catch (err) {
        resultBox.innerHTML = err.message;
        resultBox.classList.add('is-error');
        stepsBox.hidden = true;
      }
    });
  }

  /* ============ Simplify tool ============ */
  const simplifyForm = el('fraction-simplify');
  if (simplifyForm) {
    const out = el('simplify-result');
    simplifyForm.addEventListener('submit', (e) => {
      e.preventDefault();
      try {
        const numStr = el('simplify-num').value.trim();
        const denStr = el('simplify-den').value.trim();
        const isPlainInt = (s) => /^-?\d+$/.test(s);
        if (!isPlainInt(numStr) || !isPlainInt(denStr)) throw new Error('Enter whole numbers only, e.g. 2 and 98');
        const num = parseInt(numStr, 10);
        const den = parseInt(denStr, 10);
        if (den === 0) throw new Error('Denominator cannot be zero');
        const reduced = FractionMath.reduce(num, den);
        out.textContent = `${formatFraction(num, den)} simplifies to ${formatFraction(reduced.num, reduced.den)}`;
        out.classList.remove('is-error');
      } catch (err) {
        out.textContent = err.message;
        out.classList.add('is-error');
      }
    });
  }

  /* ============ Decimal <-> Fraction tool ============ */
  const convertForm = el('fraction-convert');
  if (convertForm) {
    const out = el('convert-result');
    const modeToggle = el('convert-mode-toggle');
    const input = el('convert-input');
    let mode = 'toFraction';

    function setMode(next) {
      mode = next;
      modeToggle.querySelector('#convert-mode-decimal').classList.toggle('active', mode === 'toFraction');
      modeToggle.querySelector('#convert-mode-fraction').classList.toggle('active', mode === 'toDecimal');
      modeToggle.classList.toggle('fraction-active', mode === 'toDecimal');
      input.placeholder = mode === 'toFraction' ? 'e.g. 1.375' : 'e.g. 11/4';
      out.textContent = '';
    }

    el('convert-mode-decimal').addEventListener('click', () => setMode('toFraction'));
    el('convert-mode-fraction').addEventListener('click', () => setMode('toDecimal'));

    convertForm.addEventListener('submit', (e) => {
      e.preventDefault();
      try {
        const raw = input.value.trim();
        if (mode === 'toFraction') {
          const reduced = FractionMath.decimalToFraction(raw);
          out.textContent = `${raw} = ${formatFraction(reduced.num, reduced.den)}`;
        } else {
          const parts = raw.split('/');
          const numStr = parts[0] ? parts[0].trim() : '';
          const denStr = parts[1] ? parts[1].trim() : '';
          const isPlainInt = (s) => /^-?\d+$/.test(s);
          if (parts.length !== 2 || !isPlainInt(numStr) || !isPlainInt(denStr)) {
            throw new Error('Enter a simple fraction like 11/4 (mixed numbers aren’t supported here)');
          }
          const num = parseInt(numStr, 10);
          const den = parseInt(denStr, 10);
          if (den === 0) throw new Error('Denominator cannot be zero');
          out.textContent = `${raw} = ${FractionMath.decimal(num, den)}`;
        }
        out.classList.remove('is-error');
      } catch (err) {
        out.textContent = err.message;
        out.classList.add('is-error');
      }
    });

    setMode('toFraction');
  }
})();
