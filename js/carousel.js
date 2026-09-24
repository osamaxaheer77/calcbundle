'use strict';

/**
 * Arrow-driven horizontal scroller for the "popular calculators" card row.
 * Native scrollbar is hidden via CSS at small screens; these buttons drive
 * the same scroll container instead.
 */
(function () {
  document.querySelectorAll('.teaser-carousel').forEach((carousel) => {
    const row = carousel.querySelector('.cards-row');
    const prevBtn = carousel.querySelector('.carousel-arrow.prev');
    const nextBtn = carousel.querySelector('.carousel-arrow.next');
    if (!row || !prevBtn || !nextBtn) return;

    function step() {
      const card = row.querySelector('.mini-card');
      const gap = 14;
      return card ? card.getBoundingClientRect().width + gap : 220;
    }

    function updateArrows() {
      const maxScroll = row.scrollWidth - row.clientWidth;
      const hasOverflow = maxScroll > 4;
      carousel.classList.toggle('has-overflow', hasOverflow);
      prevBtn.disabled = row.scrollLeft <= 4;
      nextBtn.disabled = row.scrollLeft >= maxScroll - 4;
    }

    prevBtn.addEventListener('click', () => {
      row.scrollBy({ left: -step(), behavior: 'smooth' });
    });
    nextBtn.addEventListener('click', () => {
      row.scrollBy({ left: step(), behavior: 'smooth' });
    });

    row.addEventListener('scroll', updateArrows);
    window.addEventListener('resize', updateArrows);
    window.addEventListener('load', updateArrows);
    updateArrows();
  });
})();
