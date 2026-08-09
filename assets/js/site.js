/*
 * useem.app — feature showcase (index.html only).
 * Desktop: hovering a feature card swaps the active screenshot.
 * Mobile (<=640px): the stage auto-rotates and can be swiped; only the
 * card matching the active image is shown as a caption below it.
 * Progressive enhancement: index 0 is already marked is-active in the
 * HTML/CSS, so the page is correct even if this script fails to load.
 */
(function () {
  var root = document.querySelector('[data-feature-showcase]');
  if (!root) return;

  var stage = root.querySelector('.feature-showcase__stage');
  var images = Array.prototype.slice.call(root.querySelectorAll('.feature-showcase__img'));
  var dots = Array.prototype.slice.call(root.querySelectorAll('.feature-showcase__dot'));
  var cards = Array.prototype.slice.call(root.querySelectorAll('.feature-card'));
  var count = images.length;
  if (!stage || !count) return;

  var active = 0;
  var timer = null;
  var mobileQuery = window.matchMedia('(max-width: 640px)');
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function setActive(index) {
    active = ((index % count) + count) % count;
    images.forEach(function (img, i) { img.classList.toggle('is-active', i === active); });
    dots.forEach(function (dot, i) { dot.classList.toggle('is-active', i === active); });
    cards.forEach(function (card, i) { card.classList.toggle('is-active', i === active); });
  }

  function stopAutoplay() {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  function startAutoplay() {
    stopAutoplay();
    if (!mobileQuery.matches || reducedMotion.matches) return;
    timer = window.setInterval(function () { setActive(active + 1); }, 4500);
  }

  function restartAutoplay() {
    stopAutoplay();
    startAutoplay();
  }

  cards.forEach(function (card, i) {
    card.addEventListener('mouseenter', function () {
      if (mobileQuery.matches) return;
      setActive(i);
    });
    card.addEventListener('focus', function () {
      if (mobileQuery.matches) return;
      setActive(i);
    });
  });

  dots.forEach(function (dot, i) {
    dot.addEventListener('click', function () {
      setActive(i);
      restartAutoplay();
    });
  });

  var touchStartX = null;
  stage.addEventListener('touchstart', function (e) {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });
  stage.addEventListener('touchend', function (e) {
    if (touchStartX === null) return;
    var dx = e.changedTouches[0].clientX - touchStartX;
    touchStartX = null;
    if (Math.abs(dx) < 30) return;
    setActive(active + (dx < 0 ? 1 : -1));
    restartAutoplay();
  }, { passive: true });

  if (typeof mobileQuery.addEventListener === 'function') {
    mobileQuery.addEventListener('change', restartAutoplay);
  }

  startAutoplay();
})();
