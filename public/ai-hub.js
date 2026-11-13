// /ai hub visuals: highlighting for the convergence map and the path-anatomy chart.
// Hand-maintained (like ai-path.js). Everything is server-rendered by
// scripts/aiVisuals.ts; without this script both charts are fully visible and every
// node and row still links to its page.
(function () {
  // Convergence map: each node and link lists the tokens of the paths through it.
  var map = document.getElementById('ai-convergence');
  if (map) {
    var nodes = Array.prototype.slice.call(map.querySelectorAll('.cv-node'));
    var links = Array.prototype.slice.call(map.querySelectorAll('.cv-link'));
    var detail = map.querySelector('.cv-detail');
    var svg = map.querySelector('.cv-svg');
    var pinned = null;
    var tokensOf = function (el) { return (el.getAttribute('data-tokens') || '').split(' ').filter(Boolean); };

    var show = function (node) {
      if (!node) {
        svg.classList.remove('cv-focus');
        nodes.concat(links).forEach(function (el) { el.classList.remove('cv-on'); });
        detail.textContent = detail.getAttribute('data-default');
        return;
      }
      var want = {};
      tokensOf(node).forEach(function (t) { want[t] = true; });
      var hit = function (el) { return tokensOf(el).some(function (t) { return want[t]; }); };
      svg.classList.add('cv-focus');
      links.forEach(function (l) { l.classList.toggle('cv-on', hit(l)); });
      nodes.forEach(function (n) { n.classList.toggle('cv-on', n === node || hit(n)); });
      detail.textContent = node.getAttribute('data-summary');
    };

    nodes.forEach(function (n) {
      n.addEventListener('mouseenter', function () { if (!pinned) show(n); });
      n.addEventListener('mouseleave', function () { if (!pinned) show(null); });
      n.addEventListener('focus', function () { show(n); });
      n.addEventListener('blur', function () { if (!pinned) show(null); });
      // Hardware and "no shared tool" have no page: clicking pins the highlight instead.
      if (n.tagName.toLowerCase() === 'g') {
        var toggle = function () { pinned = pinned === n ? null : n; show(pinned); };
        n.addEventListener('click', toggle);
        n.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
        });
      }
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && pinned) { pinned = null; show(null); } });
  }

  // Path anatomy: legend buttons highlight one layer across every row.
  var anatomy = document.getElementById('ai-anatomy');
  if (anatomy) {
    var buttons = Array.prototype.slice.call(anatomy.querySelectorAll('.an-filter'));
    var cells = Array.prototype.slice.call(anatomy.querySelectorAll('.an-cell'));
    var active = null;
    buttons.forEach(function (b) {
      b.addEventListener('click', function () {
        active = active === b.getAttribute('data-layer') ? null : b.getAttribute('data-layer');
        buttons.forEach(function (x) { x.setAttribute('aria-pressed', String(x.getAttribute('data-layer') === active)); });
        anatomy.classList.toggle('an-focus', !!active);
        cells.forEach(function (c) { c.classList.toggle('an-on', c.getAttribute('data-layer') === active); });
      });
    });
  }
})();
