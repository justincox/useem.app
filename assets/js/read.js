/*
 * useem.app — four small jobs, all of them things em itself does:
 *   1. Count the words and the reading time (238 wpm, the app's own rate).
 *   2. Mark every em dash in the library colour, the way the editor does.
 *   3. Open a collapsed answer when a link points into it.
 *   4. Open and close the mobile toolbar's hamburger menu.
 *
 * Progressive enhancement: with the script gone every page is still the
 * finished document and the meta line still names the platforms. The mobile
 * nav is the one piece that actually needs JS — the hamburger has nothing to
 * click without it — so each page's <noscript> block restores the links
 * inline and hides the now-useless button when JS is off.
 */
(function () {
  var doc = document.querySelector('.doc');
  var page = document.querySelector('.page') || document.body;

  var WORDS_PER_MINUTE = 238;

  /* ---------- reading time ---------- */

  function countWords(text) {
    var trimmed = text.replace(/\s+/g, ' ').trim();
    return trimmed ? trimmed.split(' ').length : 0;
  }

  var meta = document.querySelector('[data-doc-meta]');
  if (meta && doc) {
    var words = countWords(doc.textContent || '');
    var minutes = words > 0 ? Math.max(1, Math.round(words / WORDS_PER_MINUTE)) : 0;
    meta.textContent =
      'Mac · iPad · iPhone · ' +
      words.toLocaleString() + ' words · ' +
      minutes + ' min read';
  }

  /* ---------- em dashes ---------- */

  function markDashes(root) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        if (!node.nodeValue || node.nodeValue.indexOf('—') === -1) return NodeFilter.FILTER_REJECT;
        if (node.parentNode && node.parentNode.classList.contains('emdash')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var targets = [];
    var node;
    while ((node = walker.nextNode())) targets.push(node);

    targets.forEach(function (text) {
      var parts = text.nodeValue.split('—');
      var fragment = document.createDocumentFragment();
      parts.forEach(function (part, i) {
        if (i > 0) {
          var mark = document.createElement('span');
          mark.className = 'emdash';
          mark.textContent = '—';
          fragment.appendChild(mark);
        }
        if (part) fragment.appendChild(document.createTextNode(part));
      });
      text.parentNode.replaceChild(fragment, text);
    });
  }

  /* Marked after the count, so a mark never becomes a word of its own. */
  markDashes(page);

  /* ---------- deep links ---------- */

  /* A link into a collapsed answer should open it and land on it. */
  function openTarget(hash) {
    if (!hash || hash.length < 2) return;
    var target;
    try { target = document.querySelector(hash); } catch (error) { return; }
    if (!target) return;
    var panel = target.closest('details');
    while (panel) {
      panel.open = true;
      panel = panel.parentElement ? panel.parentElement.closest('details') : null;
    }
    target.scrollIntoView();
  }

  window.addEventListener('hashchange', function () { openTarget(window.location.hash); });
  if (window.location.hash) openTarget(window.location.hash);

  /* ---------- mobile nav ---------- */

  var menuToggle = document.querySelector('[data-menu-toggle]');
  var menuPanel = document.getElementById('toolbar-menu');

  if (menuToggle && menuPanel) {
    var closeMenu = function () {
      menuPanel.classList.remove('is-open');
      menuToggle.setAttribute('aria-expanded', 'false');
    };

    menuToggle.addEventListener('click', function () {
      var open = menuPanel.classList.toggle('is-open');
      menuToggle.setAttribute('aria-expanded', String(open));
    });

    /* A tap on the link itself should navigate, not linger on an open panel. */
    menuPanel.addEventListener('click', function (event) {
      if (event.target.closest('a')) closeMenu();
    });

    document.addEventListener('click', function (event) {
      if (!menuPanel.classList.contains('is-open')) return;
      if (menuPanel.contains(event.target) || menuToggle.contains(event.target)) return;
      closeMenu();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeMenu();
    });

    /* Resizing past the breakpoint shouldn't leave the panel stuck open
       underneath the now-restored desktop row. */
    var desktopQuery = window.matchMedia('(min-width: 641px)');
    var handleBreakpoint = function (query) { if (query.matches) closeMenu(); };
    if (desktopQuery.addEventListener) desktopQuery.addEventListener('change', handleBreakpoint);
    else if (desktopQuery.addListener) desktopQuery.addListener(handleBreakpoint);
  }
})();
