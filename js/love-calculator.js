'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('love-form');
  if (!form) return;

  function hashScore(name1, name2) {
    const combined = [name1.trim().toLowerCase(), name2.trim().toLowerCase()].sort().join('|');
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      hash = (hash * 31 + combined.charCodeAt(i)) >>> 0;
    }
    return hash % 101;
  }

  function messageFor(score) {
    if (score >= 90) return "It's practically written in the stars.";
    if (score >= 75) return 'A strong match &mdash; the chemistry is there.';
    if (score >= 50) return 'A solid connection, with room to grow.';
    if (score >= 25) return 'Could go either way &mdash; friendship first, maybe?';
    return "The stars aren't exactly aligned on this one.";
  }

  function calculate() {
    const name1 = el('love-name1').value.trim();
    const name2 = el('love-name2').value.trim();
    const resultEl = el('love-result');

    if (!name1 || !name2) {
      resultEl.innerHTML = '<p class="tool-result is-error">Enter both names.</p>';
      return;
    }

    const score = hashScore(name1, name2);

    resultEl.innerHTML = `
      <div class="summary-payment-box">
        <div class="label">${name1} &amp; ${name2}</div>
        <div class="value">${score}%</div>
      </div>
      <div class="stat-row"><span></span><strong>${messageFor(score)}</strong></div>
    `;
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  el('love-name1').value = 'Alex';
  el('love-name2').value = 'Jordan';
  calculate();
})();
