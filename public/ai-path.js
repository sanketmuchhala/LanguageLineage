// /ai/<slug> execution-path explainers: path selector, detail panel and shareable URLs.
// Hand-maintained (like fx.js). Pages are fully server-rendered; without this script the
// default path is shown and every stage and step is listed.
// URL parameters: one per choice (e.g. ?mode=eager&device=cpu or ?backend=metal),
// plus &stage=<id> or &step=<from>--<to> for the selected item.
(function () {
  var root = document.getElementById('explorer');
  if (!root) return;

  var rows = Array.prototype.slice.call(document.querySelectorAll('table.ai-steps tr[data-step]'));
  var steps = rows.map(function (r) {
    var when = {};
    try { when = JSON.parse(r.dataset.when || '{}'); } catch (e) { when = {}; }
    return { id: r.dataset.step, from: r.dataset.from, to: r.dataset.to, when: when, row: r };
  });
  var firstStage = root.querySelector('.ai-stage');
  var START = firstStage ? firstStage.id.slice(6) : '';
  var detail = root.querySelector('.ai-detail');
  var status = root.querySelector('.ai-status');
  var list = document.querySelector('.ai-path-list');
  var copy = root.querySelector('.ai-copy');

  // Choices: one radio group per fieldset; the checked one in the HTML is the default.
  var dims = {};
  root.querySelectorAll('.ai-controls input[type=radio]').forEach(function (i) {
    (dims[i.name] = dims[i.name] || { values: [], def: null, phrases: {} }).values.push(i.value);
    dims[i.name].phrases[i.value] = i.dataset.phrase || i.value;
    if (i.defaultChecked) dims[i.name].def = i.value;
  });
  var params = new URLSearchParams(location.search);
  var state = { sel: {}, stage: params.get('stage'), step: params.get('step') };
  Object.keys(dims).forEach(function (d) {
    var v = params.get(d);
    state.sel[d] = dims[d].values.indexOf(v) >= 0 ? v : dims[d].def;
  });

  function applies(s) {
    return Object.keys(s.when).every(function (d) { return s.when[d].indexOf(state.sel[d]) >= 0; });
  }

  function path() {
    var reached = {}; reached[START] = true;
    var used = {};
    var grew = true;
    while (grew) {
      grew = false;
      steps.forEach(function (s) {
        if (applies(s) && reached[s.from] && !used[s.id]) { used[s.id] = true; reached[s.to] = true; grew = true; }
      });
    }
    return { stages: reached, steps: used };
  }

  function stageName(id) {
    var h = document.querySelector('#detail-stage-' + id + ' h3');
    return h ? h.textContent : id;
  }

  function writeUrl() {
    var q = new URLSearchParams();
    Object.keys(dims).forEach(function (d) { q.set(d, state.sel[d]); });
    if (state.stage) q.set('stage', state.stage);
    else if (state.step) q.set('step', state.step);
    history.replaceState(null, '', location.pathname + '?' + q.toString() + location.hash);
  }

  function showDetail() {
    root.querySelectorAll('.ai-stage.selected, .ai-step.selected').forEach(function (el) { el.classList.remove('selected'); });
    if (state.stage && document.getElementById('detail-stage-' + state.stage)) {
      var art = document.getElementById('detail-stage-' + state.stage).cloneNode(true);
      art.removeAttribute('id');
      detail.replaceChildren(art);
      var g = document.getElementById('stage-' + state.stage);
      if (g) g.classList.add('selected');
    } else if (state.step && document.getElementById('detail-step-' + state.step)) {
      var row = document.getElementById('detail-step-' + state.step);
      var cells = row.querySelectorAll('td');
      var art2 = document.createElement('article');
      var h = document.createElement('h3');
      h.textContent = cells[0].textContent + ' → ' + cells[2].textContent;
      var when = document.createElement('p'); when.className = 'ai-kind-tag'; when.textContent = cells[1].textContent + ' · ' + cells[3].textContent;
      var what = document.createElement('p'); what.textContent = cells[4].textContent;
      var src = document.createElement('p'); src.innerHTML = 'Source: ' + cells[5].innerHTML.replace(/<br>/g, ' · ');
      art2.append(h, when, what, src);
      detail.replaceChildren(art2);
      var p = document.getElementById('step-' + state.step);
      if (p) p.classList.add('selected');
    }
  }

  // "See this path in the graph" link: carry the current choices to /explore?view=ai&path=...
  function syncGraphLink() {
    var link = document.querySelector('a.ai-graph-link');
    if (!link) return;
    var parts = link.getAttribute('href').split('?');
    var q = new URLSearchParams(parts[1] || '');
    Object.keys(dims).forEach(function (d) { q.set(d, state.sel[d]); });
    link.setAttribute('href', parts[0] + '?' + q.toString());
  }

  function render() {
    syncGraphLink();
    var p = path();
    root.querySelectorAll('.ai-stage').forEach(function (g) { g.classList.toggle('on', !!p.stages[g.id.slice(6)]); });
    root.querySelectorAll('.ai-step').forEach(function (e) { e.classList.toggle('on', !!p.steps[e.id.slice(5)]); });
    rows.forEach(function (r) { r.classList.toggle('on', !!p.steps[r.dataset.step]); });
    root.querySelectorAll('.ai-controls input[type=radio]').forEach(function (i) { i.checked = i.value === state.sel[i.name]; });
    var text = status.dataset.template || '';
    Object.keys(dims).forEach(function (d) { text = text.replace('{' + d + '}', dims[d].phrases[state.sel[d]]); });
    status.textContent = text + ': ' + Object.keys(p.stages).length + ' stages, ' + Object.keys(p.steps).length + ' steps.';
    if (list) {
      var items = steps.filter(function (s) { return p.steps[s.id]; }).map(function (s) {
        var cells = s.row.querySelectorAll('td');
        var li = document.createElement('li');
        var em = document.createElement('em'); em.textContent = cells[1].textContent;
        li.append(stageName(s.from) + ' ', em, ' ' + stageName(s.to) + ': ' + cells[4].textContent);
        return li;
      });
      list.replaceChildren.apply(list, items);
    }
    showDetail();
  }

  // On narrow screens the diagram scrolls sideways: bring the selected path into view.
  function centerPath() {
    var wrap = root.querySelector('.ai-diagram-wrap');
    if (!wrap || wrap.scrollWidth <= wrap.clientWidth) return;
    var on = root.querySelectorAll('.ai-stage.on');
    if (!on.length) return;
    var w = wrap.getBoundingClientRect();
    var left = Infinity, right = -Infinity;
    on.forEach(function (g) { var r = g.getBoundingClientRect(); left = Math.min(left, r.left); right = Math.max(right, r.right); });
    var mid = (left + right) / 2 - w.left + wrap.scrollLeft;
    wrap.scrollLeft = Math.max(0, mid - wrap.clientWidth / 2);
  }

  root.addEventListener('change', function (e) {
    if (dims[e.target.name]) {
      state.sel[e.target.name] = e.target.value;
      writeUrl(); render(); centerPath();
    }
  });

  function select(el) {
    if (el.classList.contains('ai-stage')) { state.stage = el.id.slice(6); state.step = null; }
    else { state.step = el.id.slice(5); state.stage = null; }
    writeUrl(); showDetail();
  }
  root.querySelectorAll('.ai-stage, .ai-step').forEach(function (el) {
    el.addEventListener('click', function () { select(el); });
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(el); }
    });
  });

  if (copy && navigator.clipboard) {
    copy.hidden = false;
    copy.addEventListener('click', function () {
      writeUrl();
      navigator.clipboard.writeText(location.href).then(function () {
        copy.textContent = 'Link copied';
        setTimeout(function () { copy.textContent = 'Copy link to this path'; }, 2000);
      });
    });
  }

  render();
  centerPath();
})();
