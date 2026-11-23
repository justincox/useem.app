(function () {
  // Menu on small screens.
  var nav = document.getElementById('nav'), menu = document.getElementById('menu');
  if (nav && menu) {
    menu.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menu.setAttribute('aria-expanded', open);
    });
    [].forEach.call(nav.querySelectorAll('.nav__links a'), function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('open');
        menu.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Sheets drop onto the desk as they scroll into view.
  var drops = [].slice.call(document.querySelectorAll('.drop'));
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    drops.forEach(function (d, i) { d.style.transitionDelay = (i % 3) * 90 + 'ms'; io.observe(d); });
  } else {
    drops.forEach(function (d) { d.classList.add('in'); });
  }

  // Pause the hero pile when the tab is hidden or the pile is off screen.
  var pile = document.getElementById('pile');
  if (pile && 'IntersectionObserver' in window) {
    var visible = true;
    new IntersectionObserver(function (e) {
      visible = e[0].isIntersecting;
      pile.classList.toggle('paused', !visible || document.hidden);
    }).observe(pile);
    document.addEventListener('visibilitychange', function () {
      pile.classList.toggle('paused', !visible || document.hidden);
    });
  }

  // Install bar on phones once the hero button scrolls away.
  var bar = document.getElementById('bar'), cta = document.getElementById('herocta');
  if (bar && cta && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (e) {
      bar.classList.toggle('show', !e[0].isIntersecting && e[0].boundingClientRect.top < 0);
    }).observe(cta);
  }
})();
