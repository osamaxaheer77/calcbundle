'use strict';

/**
 * Accordion behavior for category-group cards (e.g. "Mortgage & Real Estate"
 * on the Financial category page). Clicking a group's trigger button expands
 * its calculator list; only one group stays open at a time.
 */
(function () {
  const triggers = document.querySelectorAll('.calc-group-card');
  if (!triggers.length) return;

  function closeGroup(trigger) {
    trigger.setAttribute('aria-expanded', 'false');
    const panel = document.getElementById(trigger.getAttribute('aria-controls'));
    if (panel) panel.classList.remove('open');
  }

  function openGroup(trigger) {
    trigger.setAttribute('aria-expanded', 'true');
    const panel = document.getElementById(trigger.getAttribute('aria-controls'));
    if (panel) panel.classList.add('open');
  }

  triggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const isOpen = trigger.getAttribute('aria-expanded') === 'true';

      triggers.forEach((other) => {
        if (other !== trigger) closeGroup(other);
      });

      if (isOpen) {
        closeGroup(trigger);
      } else {
        openGroup(trigger);
        const panel = document.getElementById(trigger.getAttribute('aria-controls'));
        if (panel) {
          setTimeout(() => panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 150);
        }
      }
    });
  });
})();
