/*
 * useem.app home page.
 *
 * Three small jobs, all of them things em itself does:
 *   1. Count the words and the reading time (238 wpm, the app's own rate).
 *   2. Highlight every em dash, switchable, the way the editor does.
 *   3. Toggle Read and Edit — the Edit view is the Markdown that would have
 *      produced the Read view, written out of the rendered document itself so
 *      the two can never drift apart.
 *
 * Progressive enhancement: with the script gone the page is still the finished
 * Read view, the toolbar controls simply do nothing, and the meta line still
 * names the platforms.
 */
(function () {
  var doc = document.querySelector('[data-read]');
  var source = document.querySelector('[data-source]');
  /* Only the home page carries an Edit view; every page highlights its dashes. */
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

  /* ---------- em dash highlighting ---------- */

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
          var mark = document.createElement('mark');
          mark.className = 'emdash';
          mark.textContent = '—';
          fragment.appendChild(mark);
        }
        if (part) fragment.appendChild(document.createTextNode(part));
      });
      text.parentNode.replaceChild(fragment, text);
    });
  }

  var dashButton = document.querySelector('[data-dash-toggle]');
  if (dashButton) {
    document.body.classList.add('dashes-on');
    dashButton.addEventListener('click', function () {
      var on = document.body.classList.toggle('dashes-on');
      dashButton.classList.toggle('is-active', on);
      dashButton.setAttribute('aria-pressed', String(on));
    });
  }

  /* ---------- the document, as Markdown ---------- */

  function escapeHTML(value) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function token(kind, value) {
    return '<span class="tok-' + kind + '">' + escapeHTML(value) + '</span>';
  }

  /* Inline runs keep their markers visible, the way the editor shows them. */
  function inline(node) {
    var out = '';
    Array.prototype.forEach.call(node.childNodes, function (child) {
      if (child.nodeType === Node.TEXT_NODE) {
        out += escapeHTML(child.nodeValue);
        return;
      }
      if (child.nodeType !== Node.ELEMENT_NODE) return;

      var name = child.tagName.toLowerCase();
      if (name === 'strong' || name === 'b') {
        out += token('marker', '**') + token('strong', child.textContent) + token('marker', '**');
      } else if (name === 'em' || name === 'i') {
        out += token('marker', '*') + escapeHTML(child.textContent) + token('marker', '*');
      } else if (name === 'code') {
        out += token('marker', '`') + escapeHTML(child.textContent) + token('marker', '`');
      } else if (name === 'a') {
        out += token('marker', '[') + escapeHTML(child.textContent) + token('marker', '](') +
               token('link', child.getAttribute('href') || '') + token('marker', ')');
      } else if (name === 'br') {
        out += '\n';
      } else {
        out += inline(child);
      }
    });
    return out;
  }

  function blockToMarkdown(el, lines) {
    var name = el.tagName.toLowerCase();

    if (name === 'section' || name === 'header' || name === 'div') {
      Array.prototype.forEach.call(el.children, function (child) { blockToMarkdown(child, lines); });
      return;
    }
    if (name === 'h1' || name === 'h2' || name === 'h3') {
      var hashes = new Array(Number(name.charAt(1)) + 1).join('#');
      lines.push(token('heading', hashes + ' ') + token('heading', el.textContent.trim()), '');
      return;
    }
    if (name === 'p') {
      var text = inline(el).trim();
      if (text) lines.push(text, '');
      return;
    }
    if (name === 'blockquote') {
      Array.prototype.forEach.call(el.querySelectorAll('p'), function (p) {
        lines.push(token('quote', '> ') + token('quote', p.textContent.trim()));
      });
      lines.push('');
      return;
    }
    if (name === 'ul') {
      Array.prototype.forEach.call(el.children, function (li) {
        lines.push(token('marker', '- ') + inline(li).trim());
      });
      lines.push('');
      return;
    }
    if (name === 'hr') {
      lines.push(token('rule', '---'), '');
      return;
    }
    if (name === 'figure') {
      var img = el.querySelector('img');
      var caption = el.querySelector('figcaption');
      if (img) {
        lines.push(
          token('marker', '![') + token('image', img.getAttribute('alt') || '') +
          token('marker', '](') + token('link', img.getAttribute('src') || '') + token('marker', ')')
        );
      }
      if (caption) {
        lines.push(token('marker', '*') + escapeHTML(caption.textContent.trim()) + token('marker', '*'));
      }
      lines.push('');
      return;
    }
  }

  function toMarkdown() {
    var lines = [];
    if (!doc) return '';
    Array.prototype.forEach.call(doc.children, function (child) { blockToMarkdown(child, lines); });
    while (lines.length && lines[lines.length - 1] === '') lines.pop();
    return lines.join('\n');
  }

  /* ---------- Read / Edit ---------- */

  var viewButtons = Array.prototype.slice.call(document.querySelectorAll('[data-view]'));

  function setView(view) {
    if (!doc) return;
    var editing = view === 'edit';
    if (editing && source && !source.dataset.rendered) {
      /* The editor is where em highlights em dashes, so the source view does
         too. Nothing but text can carry a dash here, so a replace is safe. */
      source.innerHTML = toMarkdown().replace(/—/g, '<mark class="emdash">—</mark>');
      source.dataset.rendered = 'true';
    }
    doc.hidden = editing;
    if (source) {
      source.hidden = !editing;
      source.setAttribute('aria-hidden', String(!editing));
    }
    viewButtons.forEach(function (button) {
      var active = button.dataset.view === view;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  viewButtons.forEach(function (button) {
    button.addEventListener('click', function () { setView(button.dataset.view); });
  });

  /* Marked after the count, so a highlight never becomes a word of its own. */
  markDashes(page);

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
