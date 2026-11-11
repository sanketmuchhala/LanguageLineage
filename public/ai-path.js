// /ai/how-pytorch-runs: path selector, detail panel and shareable URLs.
// Hand-maintained (like fx.js). The page is fully server-rendered; without this script the
// default path (torch.compile on an NVIDIA GPU) is shown and every stage and step is listed.
// URL parameters: ?mode=eager|compile&device=cpu|gpu&stage=<id> or &step=<from>--<to>
(function () {
  var root = document.getElementById('explorer');
  if (!root) return;
  var START = 'python_code';
  var MODES = ['eager', 'compile'];
  var DEVICES = ['cpu', 'gpu'];
  var LABELS = { eager: 'eager mode', compile: 'torch.compile', cpu: 'a CPU', gpu: 'an NVIDIA GPU' };

  var rows = Array.prototype.slice.call(document.querySelectorAll('table.ai-steps tr[data-step]'));
  var steps = rows.map(function (r) {
    return { id: r.dataset.step, from: r.dataset.from, to: r.dataset.to, mode: r.dataset.mode, device: r.dataset.device, row: r };
  });
  var detail = root.querySelector('.ai-detail');
  var status = root.querySelector('.ai-status');
  var list = document.querySelector('.ai-path-list');
  var copy = root.querySelector('.ai-copy');
  var params = new URLSearchParams(location.search);
  var state = {
    mode: MODES.indexOf(params.get('mode')) >= 0 ? params.get('mode') : 'compile',
    device: DEVICES.indexOf(params.get('device')) >= 0 ? params.get('device') : 'gpu',
    stage: params.get('stage'),
    step: params.get('step'),
  };

  function applies(s) {
    return (s.mode === 'any' || s.mode === state.mode) && (s.device === 'any' || s.device === state.device);
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
    q.set('mode', state.mode); q.set('device', state.device);
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

  function render() {
    var p = path();
    root.querySelectorAll('.ai-stage').forEach(function (g) { g.classList.toggle('on', !!p.stages[g.id.slice(6)]); });
    root.querySelectorAll('.ai-step').forEach(function (e) { e.classList.toggle('on', !!p.steps[e.id.slice(5)]); });
    rows.forEach(function (r) { r.classList.toggle('on', !!p.steps[r.dataset.step]); });
    root.querySelectorAll('input[name=mode]').forEach(function (i) { i.checked = i.value === state.mode; });
    root.querySelectorAll('input[name=device]').forEach(function (i) { i.checked = i.value === state.device; });
    var nStages = Object.keys(p.stages).length, nSteps = Object.keys(p.steps).length;
    status.textContent = 'Showing ' + LABELS[state.mode] + ' on ' + LABELS[state.device] + ': ' + nStages + ' stages, ' + nSteps + ' steps.';
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
    if (e.target.name === 'mode' || e.target.name === 'device') {
      state[e.target.name] = e.target.value;
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
