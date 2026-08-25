/*
 * useem.app — three small jobs, all of them things em itself does:
 *   1. Count the words and the reading time (238 wpm, the app's own rate).
 *   2. Mark every em dash in the library colour, the way the editor does.
 *   3. Open a collapsed answer when a link points into it.
 *
 * Progressive enhancement: with the script gone every page is still the
 * finished document, and the meta line still names the platforms.
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
})();
