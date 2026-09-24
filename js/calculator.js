'use strict';

/**
 * Safe expression engine: tokenizer -> shunting-yard -> RPN eval.
 * No eval()/Function() anywhere.
 */
class CalcEngine {
  constructor(angleMode) {
    this.angleMode = angleMode || 'deg';
  }

  tokenize(expr) {
    const tokens = [];
    const funcNames = ['sin⁻¹', 'cos⁻¹', 'tan⁻¹', 'sin', 'cos', 'tan', 'ln', 'log', '√', '∛'];
    let i = 0;
    while (i < expr.length) {
      const ch = expr[i];

      if (/\s/.test(ch)) { i++; continue; }

      if (/[0-9.]/.test(ch)) {
        const start = i;
        while (i < expr.length && /[0-9.]/.test(expr[i])) i++;
        if (expr[i] === 'E') {
          i++;
          if (expr[i] === '+' || expr[i] === '-') i++;
          while (i < expr.length && /[0-9]/.test(expr[i])) i++;
        }
        const raw = expr.slice(start, i).replace('E', 'e');
        const value = parseFloat(raw);
        if (Number.isNaN(value)) throw new Error('Bad number');
        tokens.push({ type: 'num', value });
        continue;
      }

      let matchedFunc = null;
      for (const fn of funcNames) {
        if (expr.startsWith(fn, i)) { matchedFunc = fn; break; }
      }
      if (matchedFunc) {
        tokens.push({ type: 'func', value: matchedFunc });
        i += matchedFunc.length;
        continue;
      }

      if (expr.startsWith('rt', i)) { tokens.push({ type: 'op', value: 'rt' }); i += 2; continue; }

      if (ch === 'π') { tokens.push({ type: 'num', value: Math.PI }); i++; continue; }
      if (ch === 'e') { tokens.push({ type: 'num', value: Math.E }); i++; continue; }
      if (ch === '(') { tokens.push({ type: 'lparen' }); i++; continue; }
      if (ch === ')') { tokens.push({ type: 'rparen' }); i++; continue; }
      if (ch === '+' || ch === '−' || ch === '×' || ch === '÷' || ch === '^') {
        tokens.push({ type: 'op', value: ch }); i++; continue;
      }
      if (ch === '²') { tokens.push({ type: 'postfix', value: '²' }); i++; continue; }
      if (ch === '³') { tokens.push({ type: 'postfix', value: '³' }); i++; continue; }
      if (ch === '!') { tokens.push({ type: 'postfix', value: '!' }); i++; continue; }
      if (ch === '%') { tokens.push({ type: 'postfix', value: '%' }); i++; continue; }
      if (expr.startsWith('⁻¹', i)) { tokens.push({ type: 'postfix', value: '⁻¹' }); i += 2; continue; }

      throw new Error('Unexpected character: ' + ch);
    }
    return tokens;
  }

  toRPN(tokens) {
    const output = [];
    const opStack = [];
    const prec = { '+': 1, '−': 1, '×': 2, '÷': 2, rt: 3, '^': 4, neg: 3.5 };
    const rightAssoc = new Set(['^', 'neg']);
    let prevType = null;

    for (const tok of tokens) {
      if (tok.type === 'num') { output.push(tok); prevType = 'num'; continue; }
      if (tok.type === 'func') { opStack.push(tok); prevType = 'func'; continue; }
      if (tok.type === 'postfix') { output.push(tok); prevType = 'num'; continue; }

      if (tok.type === 'op') {
        const isUnaryContext = prevType === null || prevType === 'op' || prevType === 'lparen' || prevType === 'func';
        if ((tok.value === '−' || tok.value === '+') && isUnaryContext) {
          if (tok.value === '−') opStack.push({ type: 'op', value: 'neg' });
          prevType = 'op';
          continue;
        }
        while (opStack.length) {
          const top = opStack[opStack.length - 1];
          if (top.type === 'func') { output.push(opStack.pop()); continue; }
          if (top.type === 'op') {
            const topPrec = prec[top.value];
            const curPrec = prec[tok.value];
            const shouldPop = rightAssoc.has(tok.value) ? topPrec > curPrec : topPrec >= curPrec;
            if (shouldPop) { output.push(opStack.pop()); continue; }
          }
          break;
        }
        opStack.push({ type: 'op', value: tok.value });
        prevType = 'op';
        continue;
      }

      if (tok.type === 'lparen') { opStack.push(tok); prevType = 'lparen'; continue; }

      if (tok.type === 'rparen') {
        while (opStack.length && opStack[opStack.length - 1].type !== 'lparen') {
          output.push(opStack.pop());
        }
        if (!opStack.length) throw new Error('Mismatched parentheses');
        opStack.pop();
        if (opStack.length && opStack[opStack.length - 1].type === 'func') {
          output.push(opStack.pop());
        }
        prevType = 'num';
        continue;
      }
    }

    while (opStack.length) {
      const top = opStack.pop();
      if (top.type === 'lparen') throw new Error('Mismatched parentheses');
      output.push(top);
    }
    return output;
  }

  applyBinary(op, a, b) {
    switch (op) {
      case '+': return a + b;
      case '−': return a - b;
      case '×': return a * b;
      case '÷': return a / b;
      case '^': return Math.pow(a, b);
      case 'rt': return Math.pow(b, 1 / a);
      default: throw new Error('Unknown operator: ' + op);
    }
  }

  applyPostfix(op, a) {
    switch (op) {
      case '²': return a * a;
      case '³': return a * a * a;
      case '!': return this.factorial(a);
      case '%': return a / 100;
      case '⁻¹': return 1 / a;
      default: throw new Error('Unknown postfix: ' + op);
    }
  }

  factorial(n) {
    n = Math.round(n);
    if (n < 0) return NaN;
    let r = 1;
    for (let i = 2; i <= n; i++) r *= i;
    return r;
  }

  applyFunc(name, a) {
    const toRad = (v) => (this.angleMode === 'deg' ? (v * Math.PI) / 180 : v);
    const fromRad = (v) => (this.angleMode === 'deg' ? (v * 180) / Math.PI : v);
    switch (name) {
      case 'sin': return Math.sin(toRad(a));
      case 'cos': return Math.cos(toRad(a));
      case 'tan': return Math.tan(toRad(a));
      case 'sin⁻¹': return fromRad(Math.asin(a));
      case 'cos⁻¹': return fromRad(Math.acos(a));
      case 'tan⁻¹': return fromRad(Math.atan(a));
      case 'ln': return Math.log(a);
      case 'log': return Math.log10(a);
      case '√': return Math.sqrt(a);
      case '∛': return Math.cbrt(a);
      default: throw new Error('Unknown function: ' + name);
    }
  }

  evalRPN(rpn) {
    const stack = [];
    for (const tok of rpn) {
      if (tok.type === 'num') { stack.push(tok.value); continue; }
      if (tok.type === 'postfix') {
        if (!stack.length) throw new Error('Invalid expression');
        stack.push(this.applyPostfix(tok.value, stack.pop()));
        continue;
      }
      if (tok.type === 'func') {
        if (!stack.length) throw new Error('Invalid expression');
        stack.push(this.applyFunc(tok.value, stack.pop()));
        continue;
      }
      if (tok.type === 'op') {
        if (tok.value === 'neg') {
          if (!stack.length) throw new Error('Invalid expression');
          stack.push(-stack.pop());
          continue;
        }
        if (stack.length < 2) throw new Error('Invalid expression');
        const b = stack.pop();
        const a = stack.pop();
        stack.push(this.applyBinary(tok.value, a, b));
        continue;
      }
    }
    if (stack.length !== 1) throw new Error('Invalid expression');
    return stack[0];
  }

  balanceParens(expr) {
    let open = 0;
    for (const ch of expr) {
      if (ch === '(') open++;
      if (ch === ')') open--;
    }
    return open > 0 ? expr + ')'.repeat(open) : expr;
  }

  evaluate(expr) {
    const balanced = this.balanceParens(expr);
    const tokens = this.tokenize(balanced);
    if (!tokens.length) throw new Error('Empty expression');
    const rpn = this.toRPN(tokens);
    return this.evalRPN(rpn);
  }
}

/* ===================== UI wiring ===================== */
(function () {
  const exprEl = document.getElementById('display-expr');
  const resultEl = document.getElementById('display-result');
  const historyListEl = document.getElementById('history-list');
  const clearHistoryBtn = document.getElementById('clear-history');
  const degBtn = document.getElementById('mode-deg');
  const radBtn = document.getElementById('mode-rad');
  const degRadToggle = document.getElementById('deg-rad-toggle');
  const grid = document.querySelector('.button-grid');

  if (!grid) return; // calculator not present on this page

  const state = {
    expression: '',
    lastResult: 0,
    memory: 0,
    angleMode: 'deg',
    justEvaluated: false,
    history: [],
  };

  function formatNumber(n) {
    if (!Number.isFinite(n)) return 'Error';
    if (Number.isInteger(n)) return n.toString();
    const rounded = parseFloat(n.toFixed(10));
    return rounded.toString();
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  const OPERATOR_STARTS = new Set(['+', '−', '×', '÷', '^', 'rt', '!', '²', '³', '%', '⁻¹']);

  function insert(text) {
    if (state.justEvaluated) {
      const startsWithOperator = [...OPERATOR_STARTS].some((op) => text.startsWith(op));
      if (startsWithOperator) {
        state.expression = formatNumber(state.lastResult) + text;
      } else {
        state.expression = text === '.' ? '0.' : text;
      }
      state.justEvaluated = false;
    } else {
      state.expression += text;
    }
    render();
  }

  function clearAll() {
    state.expression = '';
    state.justEvaluated = false;
    resultEl.textContent = '0';
    render();
  }

  function backspace() {
    if (state.justEvaluated) { clearAll(); return; }
    state.expression = state.expression.slice(0, -1);
    render();
  }

  function toggleSign() {
    const match = state.expression.match(/(-?\d+\.?\d*)$/);
    if (!match) return;
    const numStr = match[0];
    const start = state.expression.length - numStr.length;
    const before = state.expression.slice(0, start);
    const toggled = numStr.startsWith('-') ? numStr.slice(1) : '-' + numStr;
    state.expression = before + toggled;
    render();
  }

  function setAngleMode(mode) {
    state.angleMode = mode;
    degBtn.classList.toggle('active', mode === 'deg');
    radBtn.classList.toggle('active', mode === 'rad');
    degRadToggle.classList.toggle('rad-active', mode === 'rad');
    render();
  }

  function addHistory(expr, result) {
    state.history.unshift({ expr, result: formatNumber(result) });
    if (state.history.length > 50) state.history.pop();
    renderHistory();
  }

  function renderHistory() {
    historyListEl.innerHTML = '';
    if (!state.history.length) {
      historyListEl.innerHTML = '<div class="history-empty">No calculations yet</div>';
      return;
    }
    state.history.forEach((h) => {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'history-row';
      row.innerHTML = `<span class="history-expr">${escapeHtml(h.expr)}</span><span class="history-result">= ${escapeHtml(h.result)}</span>`;
      row.addEventListener('click', () => {
        state.expression = h.result;
        state.justEvaluated = true;
        render();
      });
      historyListEl.appendChild(row);
    });
  }

  function evaluateExpression() {
    if (!state.expression.trim()) return;
    try {
      const engine = new CalcEngine(state.angleMode);
      const val = engine.evaluate(state.expression);
      if (!Number.isFinite(val)) throw new Error('Math error');
      addHistory(state.expression, val);
      state.lastResult = val;
      state.expression = formatNumber(val);
      state.justEvaluated = true;
      render();
    } catch (e) {
      resultEl.textContent = 'Error';
    }
  }

  function roundResult() {
    const rounded = Math.round(state.lastResult * 10000) / 10000;
    state.lastResult = rounded;
    state.expression = formatNumber(rounded);
    state.justEvaluated = true;
    render();
  }

  function useAns() { insert(formatNumber(state.lastResult)); }
  function memoryAdd() { state.memory += state.lastResult; }
  function memorySub() { state.memory -= state.lastResult; }
  function memoryRecall() { insert(formatNumber(state.memory)); }

  function render() {
    exprEl.textContent = state.expression || ' ';
    if (!state.expression.trim()) {
      resultEl.textContent = '0';
      return;
    }
    try {
      const engine = new CalcEngine(state.angleMode);
      const val = engine.evaluate(state.expression);
      resultEl.textContent = Number.isFinite(val) ? formatNumber(val) : 'Error';
    } catch (e) {
      // incomplete expression mid-typing; leave last valid preview showing
    }
  }

  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const insertText = btn.dataset.insert;
    const action = btn.dataset.action;
    if (insertText !== undefined) { insert(insertText); return; }
    switch (action) {
      case 'clear': clearAll(); break;
      case 'backspace': backspace(); break;
      case 'sign': toggleSign(); break;
      case 'evaluate': evaluateExpression(); break;
      case 'ans': useAns(); break;
      case 'round': roundResult(); break;
      case 'memoryAdd': memoryAdd(); break;
      case 'memorySub': memorySub(); break;
      case 'memoryRecall': memoryRecall(); break;
      default: break;
    }
  });

  degBtn.addEventListener('click', () => setAngleMode('deg'));
  radBtn.addEventListener('click', () => setAngleMode('rad'));
  clearHistoryBtn.addEventListener('click', () => { state.history = []; renderHistory(); });

  const KEY_MAP = { '*': '×', '/': '÷', '-': '−' };
  window.addEventListener('keydown', (e) => {
    const active = document.activeElement;
    const isTyping = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
    if (isTyping) return;
    if (/^[0-9.]$/.test(e.key)) { insert(e.key); return; }
    if (KEY_MAP[e.key]) { insert(KEY_MAP[e.key]); return; }
    if (e.key === '+' || e.key === '^' || e.key === '(' || e.key === ')') { insert(e.key); return; }
    if (e.key === 'Enter' || e.key === '=') { e.preventDefault(); evaluateExpression(); return; }
    if (e.key === 'Backspace') { backspace(); return; }
    if (e.key === 'Escape') { clearAll(); return; }
  });

  render();
  renderHistory();
})();
