/* Path picker (fzf-like scope chooser) for Paper2Notes book pages.
 *
 * Design B "Choose each level": open from the mobile ellipsis or with Cmd+/ on
 * macOS and Ctrl+/ on Windows. Type to filter the selected scope, choose an
 * ancestor to widen the scope, browse children to narrow it, and search within
 * the chosen scope. Selections navigate to real book/chapter/section routes.
 *
 * This file is a plain classic script (no module loader) so generated pages can
 * load it with a single <script src>. The factory also exports pure functions
 * via module.exports in CommonJS, which lets node --test import the logic
 * without a DOM. The DOM wiring runs only when document is present.
 */
(function (root, factory) {
  if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = factory();
  } else {
    root.P2NPathPicker = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var ROOT_ID = 'root';
  var RESULT_ID_PREFIX = 'p2n-picker-result-';

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ------------------------------------------------------------------ *
   * Pure logic (testable without a DOM).
   * ------------------------------------------------------------------ */

  // nodes: [{id, kind, label, title, route, parent}], parent === null for root.
  function buildIndex(nodes) {
    var byId = new Map();
    var byRoute = new Map();
    var children = new Map();
    nodes.forEach(function (n) {
      byId.set(n.id, n);
      byRoute.set(n.route, n);
      var key = n.parent || '';
      if (!children.has(key)) children.set(key, []);
      children.get(key).push(n);
    });
    function childrenOf(id) { return children.get(id) || []; }
    function chainOf(id) {
      var out = [];
      var node = byId.get(id);
      var guard = 0;
      while (node && guard < 100) {
        out.unshift(node);
        node = node.parent ? byId.get(node.parent) : null;
        guard += 1;
      }
      return out;
    }
    function trailOf(id) {
      return chainOf(id).slice(1, -1).map(function (n) { return n.label; });
    }
    function isWithinScope(id, scope) {
      return chainOf(id).some(function (n) { return n.id === scope; });
    }
    function searchText(node) {
      return [node.label, node.title, trailOf(node.id).join(' '), node.route].join(' ').toLowerCase();
    }
    return { nodes: nodes, byId: byId, byRoute: byRoute, childrenOf: childrenOf, chainOf: chainOf, trailOf: trailOf, isWithinScope: isWithinScope, searchText: searchText };
  }

  function matchesQuery(node, query, index) {
    var hay = index.searchText(node);
    var words = String(query || '').trim().toLowerCase().split(/\s+/).filter(Boolean);
    // Predictable substring search over the label, title, ancestor trail and
    // route. Ordered-character (subsequence) matching is deliberately omitted:
    // it matches short numeric and alphabetic fragments across unrelated words
    // (e.g. "decay" inside "detection ... radioactivity") and shows false hits.
    return words.every(function (w) { return hay.indexOf(w) >= 0; });
  }

  function computeInitialScope(currentRoute, index) {
    var cur = index.byRoute.get(currentRoute);
    if (!cur) return ROOT_ID;
    if (cur.kind === 'section' || cur.kind === 'summary') return cur.parent;
    return cur.id;
  }

  function resultsFor(scope, query, index) {
    var q = String(query || '').trim().toLowerCase();
    if (q) {
      return index.nodes.filter(function (n) {
        return n.id !== ROOT_ID && index.isWithinScope(n.id, scope) && matchesQuery(n, q, index);
      });
    }
    return index.nodes.filter(function (n) { return n.id !== ROOT_ID && (n.id === scope || n.parent === scope); });
  }

  // Relative link from the page at fromRoute to the destination route, both
  // expressed relative to the notes root (e.g. "book5/ch01-radiation-and-radioactivity/25-3.html").
  function relativeHref(fromRoute, toRoute) {
    var fromDir = String(fromRoute).split('/').slice(0, -1);
    var toParts = String(toRoute).split('/');
    var i = 0;
    while (i < fromDir.length && i < toParts.length - 1 && fromDir[i] === toParts[i]) i += 1;
    var up = fromDir.length - i;
    var down = toParts.slice(i);
    return '../'.repeat(up) + down.join('/');
  }

  // Move the highlighted index by delta. wrap=true is used by Up/Down; the
  // non-wrapping case reports the exit boundary so Tab can leave the picker.
  function moveHighlight(active, count, delta, wrap) {
    if (count === 0) return { exit: delta < 0 ? 'backward' : 'forward' };
    var next = active + delta;
    if (next < 0) return wrap ? { active: ((next % count) + count) % count } : { exit: 'backward' };
    if (next >= count) return wrap ? { active: next % count } : { exit: 'forward' };
    return { active: next };
  }

  function isDrillable(node, index) {
    return index.childrenOf(node.id).length > 0;
  }

  /* ------------------------------------------------------------------ *
   * DOM wiring.
   * ------------------------------------------------------------------ */

  function glyph(kind) {
    if (kind === 'book') return '\u25A4';          // ▤
    if (kind === 'chapter') return '\u2261';       // ≡
    if (kind === 'section') return '\u00A7';       // §
    if (kind === 'summary') return '\u2713';       // ✓
    return '\u25A4';
  }

  function mark(text, query) {
    var q = String(query || '').trim();
    var safe = escapeHtml(text);
    if (!q) return safe;
    var idx = String(text).toLowerCase().indexOf(q.toLowerCase());
    if (idx < 0) return safe;
    return escapeHtml(String(text).slice(0, idx)) + '<mark>' + escapeHtml(String(text).slice(idx, idx + q.length)) + '</mark>' + escapeHtml(String(text).slice(idx + q.length));
  }

  function initPathPicker(nodes, currentRoute) {
    var index = buildIndex(nodes);
    var current = index.byRoute.get(currentRoute);
    if (!current) return;

    var scope = computeInitialScope(currentRoute, index);
    var active = 0;
    var results = [];
    var opener = null;
    var isOpen = false;

    var picker = document.createElement('div');
    picker.className = 'p2n-picker';
    picker.setAttribute('role', 'dialog');
    picker.setAttribute('aria-modal', 'false');
    picker.setAttribute('aria-labelledby', 'p2n-picker-title');
    picker.hidden = true;
    picker.innerHTML =
      '<div class="p2n-picker-head">' +
        '<div><span class="p2n-label">Change path</span><h2 id="p2n-picker-title">Choose a location</h2></div>' +
        '<button type="button" class="p2n-picker-cancel" data-action="close">Cancel <span class="p2n-picker-kbd">Esc</span></button>' +
      '</div>' +
      '<div class="p2n-picker-current"><span class="p2n-label">Current page</span><div class="p2n-picker-current-path"></div></div>' +
      '<div class="p2n-picker-scope" aria-label="Search scope"></div>' +
      '<div class="p2n-picker-search">' +
        '<label for="p2n-picker-query">Search within this location</label>' +
        '<input id="p2n-picker-query" type="text" role="combobox" aria-autocomplete="list" aria-expanded="true" aria-controls="p2n-picker-results" autocomplete="off" spellcheck="false" placeholder="Type a section, chapter, book, or filename">' +
        '<button type="button" class="p2n-picker-clear" data-action="clear" aria-label="Clear search">Clear</button>' +
      '</div>' +
      '<div class="p2n-picker-matches">' +
        '<div class="p2n-picker-meta" role="status"></div>' +
        '<div class="p2n-picker-results" role="listbox" aria-label="Matching pages"></div>' +
      '</div>' +
      '<div class="p2n-picker-foot">' +
        '<span>\u2191 \u2193 move \u00B7 Enter go \u00B7 \u2192 browse inside \u00B7 \u2190 widen</span>' +
        '<span>Tab at an end leaves \u00B7 Esc cancels</span>' +
      '</div>';
    document.body.appendChild(picker);

    var input = picker.querySelector('#p2n-picker-query');
    var scopeEl = picker.querySelector('.p2n-picker-scope');
    var currentPathEl = picker.querySelector('.p2n-picker-current-path');
    var metaEl = picker.querySelector('.p2n-picker-meta');
    var resultsEl = picker.querySelector('.p2n-picker-results');

    var crumbMenu = document.querySelector('.p2n-crumb-collapsed .p2n-crumb-menu');
    var ellipsisSummary = crumbMenu ? crumbMenu.querySelector('summary') : null;

    function currentPathText() {
      return index.chainOf(current.id).map(function (n) { return n.label; }).join(' \u203A ');
    }

    function scopeTrailHtml() {
      var chain = index.chainOf(scope);
      return chain.map(function (n, i) {
        var isLast = i === chain.length - 1;
        return isLast
          ? '<strong aria-current="true">' + escapeHtml(n.label) + '</strong>'
          : '<button type="button" data-scope="' + escapeHtml(n.id) + '">' + escapeHtml(n.label) + '</button>';
      }).join('<span class="p2n-picker-sep" aria-hidden="true">\u203A</span>');
    }

    function resultRowHtml(n, i) {
      var trail = index.trailOf(n.id);
      var isCurrentPage = n.id === current.id;
      var drillable = isDrillable(n, index) && n.id !== scope;
      var badge = isCurrentPage ? 'Current' : n.kind;
      var head = n.label + ' \u00B7 ' + n.title;
      return '<div class="p2n-picker-result" role="option" tabindex="-1" id="' + RESULT_ID_PREFIX + i + '" aria-selected="' + (i === active ? 'true' : 'false') + '" data-index="' + i + '">' +
        '<div class="p2n-picker-result-main">' +
          '<span class="p2n-picker-glyph" aria-hidden="true">' + glyph(n.kind) + '</span>' +
          '<div class="p2n-picker-result-text"><b>' + mark(head, input.value) + '</b>' +
            (trail.length ? '<small>' + escapeHtml(trail.join(' \u203A ')) + '</small>' : '') +
          '</div>' +
          '<span class="p2n-picker-kind">' + badge + '</span>' +
        '</div>' +
        (drillable ? '<button type="button" class="p2n-picker-drill" data-drill="' + escapeHtml(n.id) + '" aria-label="Browse inside ' + escapeHtml(n.title) + '">Browse inside \u203A</button>' : '') +
      '</div>';
    }

    function emptyStateHtml() {
      var q = input.value.trim();
      var buttons = '';
      if (scope !== ROOT_ID) buttons += '<button type="button" class="p2n-picker-empty-action" data-action="widen">Search all books</button>';
      buttons += '<button type="button" class="p2n-picker-empty-action" data-action="clear">Clear search</button>';
      return '<div class="p2n-picker-empty"><b>No pages match \u201C' + escapeHtml(q) + '\u201D</b><p>Try a section, chapter, book, or filename.</p>' + buttons + '</div>';
    }

    function highlight(scroll) {
      resultsEl.querySelectorAll('.p2n-picker-result').forEach(function (r, i) {
        r.setAttribute('aria-selected', String(i === active));
      });
      if (results.length) {
        input.setAttribute('aria-activedescendant', RESULT_ID_PREFIX + active);
        if (scroll) {
          var el = resultsEl.querySelector('[data-index="' + active + '"]');
          if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
        }
      } else {
        input.removeAttribute('aria-activedescendant');
      }
    }

    function render() {
      scopeEl.innerHTML = scopeTrailHtml();
      currentPathEl.textContent = currentPathText();
      results = resultsFor(scope, input.value, index);
      active = Math.min(Math.max(active, 0), Math.max(0, results.length - 1));
      var q = input.value.trim();
      var scopeLabel = index.byId.get(scope) ? index.byId.get(scope).label : '';
      metaEl.textContent = results.length + ' ' + (results.length === 1 ? 'page' : 'pages') + ' \u00B7 ' + scopeLabel + (q ? ' \u00B7 \u201C' + q + '\u201D' : '');
      resultsEl.innerHTML = results.length ? results.map(resultRowHtml).join('') : emptyStateHtml();
      highlight(false);
    }

    function open(from) {
      if (isOpen) { input.focus(); return; }
      opener = from || document.activeElement;
      isOpen = true;
      picker.hidden = false;
      scope = computeInitialScope(currentRoute, index);
      input.value = '';
      active = 0;
      render();
      input.focus();
      input.setAttribute('aria-expanded', 'true');
    }

    function restoreOpener() {
      var target = opener && opener.isConnected ? opener : ellipsisSummary;
      if (target && target.focus) target.focus();
    }

    function close(restore) {
      if (!isOpen) return;
      isOpen = false;
      picker.hidden = true;
      input.setAttribute('aria-expanded', 'false');
      if (restore) restoreOpener();
    }

    function choose(i) {
      var n = results[i];
      if (!n) return;
      if (n.route === currentRoute) { close(true); return; }
      window.location.href = relativeHref(currentRoute, n.route);
    }

    function drill(id) { scope = id; input.value = ''; active = 0; render(); input.focus(); }
    function widenTo(id) { scope = id; input.value = ''; active = 0; render(); input.focus(); }
    function widenOne() {
      var s = index.byId.get(scope);
      if (s && s.parent) { scope = s.parent; input.value = ''; active = 0; render(); input.focus(); }
    }
    function widenToRoot() { scope = ROOT_ID; active = 0; render(); input.focus(); }
    function clearQuery() { input.value = ''; active = 0; render(); input.focus(); }

    function focusForward() {
      var main = document.querySelector('main');
      var first = main ? main.querySelector('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])') : null;
      var target = first || (opener && opener.isConnected ? opener : ellipsisSummary);
      if (target && target.focus) target.focus();
    }

    if (ellipsisSummary) {
      ellipsisSummary.addEventListener('click', function (e) {
        e.preventDefault();
        if (crumbMenu && crumbMenu.hasAttribute('open')) crumbMenu.removeAttribute('open');
        open(e.currentTarget);
      });
    }

    picker.addEventListener('click', function (e) {
      var drillBtn = e.target.closest('[data-drill]');
      if (drillBtn) { drill(drillBtn.getAttribute('data-drill')); return; }
      var scopeBtn = e.target.closest('[data-scope]');
      if (scopeBtn) { widenTo(scopeBtn.getAttribute('data-scope')); return; }
      var action = e.target.closest('[data-action]');
      if (action) {
        var name = action.getAttribute('data-action');
        if (name === 'close') close(true);
        else if (name === 'clear') clearQuery();
        else if (name === 'widen') widenToRoot();
        return;
      }
      var result = e.target.closest('.p2n-picker-result');
      if (result) choose(Number(result.getAttribute('data-index')));
    });

    input.addEventListener('input', function () { active = 0; render(); });

    document.addEventListener('keydown', function (e) {
      if (e.isComposing) return;
      var isShortcut = (e.metaKey || e.ctrlKey) && !e.altKey && (e.key === '/' || e.code === 'Slash');
      if (isShortcut) { e.preventDefault(); open(document.activeElement); return; }
      if (!isOpen) return;
      if (e.key === 'Escape') { e.preventDefault(); close(true); return; }
      if (e.target === input || e.target.closest('.p2n-picker-results')) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          var m = moveHighlight(active, results.length, e.key === 'ArrowDown' ? 1 : -1, true);
          if (m.active !== undefined) { active = m.active; highlight(true); input.focus(); }
          return;
        }
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          if (results[active] && isDrillable(results[active], index)) drill(results[active].id);
          return;
        }
        if (e.key === 'ArrowLeft') { e.preventDefault(); widenOne(); return; }
        if (e.key === 'Enter') { e.preventDefault(); choose(active); return; }
        if (e.key === 'Tab') {
          e.preventDefault();
          var t = moveHighlight(active, results.length, e.shiftKey ? -1 : 1, false);
          if (t.active !== undefined) { active = t.active; highlight(true); input.focus(); }
          else { close(false); if (t.exit === 'forward') focusForward(); else restoreOpener(); }
          return;
        }
      }
    });

    document.addEventListener('pointerdown', function (e) {
      if (isOpen && !picker.contains(e.target) && !e.target.closest('.p2n-crumb-collapsed')) close(false);
    });
    document.addEventListener('focusin', function (e) {
      if (isOpen && !picker.contains(e.target)) close(false);
    });
  }

  function bootstrap() {
    if (typeof document === 'undefined') return;
    var script = document.currentScript || document.querySelector('script[data-manifest][data-current]');
    if (!script) return;
    var manifestUrl = script.getAttribute('data-manifest');
    var currentRoute = script.getAttribute('data-current');
    if (!manifestUrl || !currentRoute) return;
    try {
      var req = new XMLHttpRequest();
      req.open('GET', manifestUrl, true);
      req.setRequestHeader('Accept', 'application/json');
      req.onload = function () {
        if (req.status >= 200 && req.status < 300) {
          try { initPathPicker(JSON.parse(req.responseText), currentRoute); } catch (ignore) {}
        }
      };
      req.onerror = function () {};
      req.send();
    } catch (ignore) {}
  }

  var api = {
    buildIndex: buildIndex,
    computeInitialScope: computeInitialScope,
    matchesQuery: matchesQuery,
    resultsFor: resultsFor,
    relativeHref: relativeHref,
    moveHighlight: moveHighlight,
    isDrillable: isDrillable,
    initPathPicker: initPathPicker
  };

  if (typeof document !== 'undefined') bootstrap();

  return api;
});
