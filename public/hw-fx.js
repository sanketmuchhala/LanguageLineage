/* Motion for /how-it-works. Hand-maintained, like fx.js: not generated output.
 *
 * Everything is progressive enhancement. The page is complete and readable with
 * JavaScript off, and every effect returns early under prefers-reduced-motion.
 * No dependencies, ES5 only, vanilla Canvas and SVG.
 *
 * The brief for this layer: show the machine working, using the machine's own
 * data. Nothing here is a stock marketing animation; every number, label and
 * log line comes from the dataset at build time.
 *
 *  1. Confidence wave    120 real edges, colored by relationship type, with a
 *                        readout of the actual record under the cursor
 *  2. Agent trace        a harvester run replayed line by line, with a spinner,
 *                        real latencies and a visible retry
 *  3. Run output         the validation gate types itself, then reports timing
 *  4. Pipeline flow      comet particles carry a payload label between stations,
 *                        each station pulses as the payload lands
 *  5. Spotlight          a light follows the cursor across Fig. 1
 *  6. Station rail       a filling spine tracks reading position
 *  7. Counters           hero numbers roll up to their exact values
 *  8. Constellation      the busiest nodes drift behind the article
 */
(function () {
  'use strict';

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var supportsIO = 'IntersectionObserver' in window;
  var SPINNER = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  var ACCENT = '#4ade80';
  var REL_COLORS = ['#e3a008', '#34d399', '#a78bfa', '#60a5fa', '#22d3ee', '#fb7185'];

  function onVisible(el, cb, threshold) {
    if (!supportsIO) { cb(); return; }
    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) { io.unobserve(entries[i].target); cb(); }
      }
    }, { threshold: threshold || 0.3 });
    io.observe(el);
  }

  // Runs cb(true/false) as the element enters and leaves, so loops can idle.
  function whileVisible(el, cb, threshold) {
    if (!supportsIO) { cb(true); return; }
    var io = new IntersectionObserver(function (entries) {
      cb(entries[0].isIntersecting);
    }, { threshold: threshold || 0.15 });
    io.observe(el);
  }

  function fitCanvas(canvas) {
    var dpr = window.devicePixelRatio || 1;
    var rect = canvas.getBoundingClientRect();
    if (!rect.width) return null;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  }

  function debounce(fn, ms) {
    var t;
    return function () { clearTimeout(t); t = setTimeout(fn, ms); };
  }

  function easeOutCubic(p) { return 1 - Math.pow(1 - p, 3); }

  /* 1. Confidence wave ---------------------------------------------------- */
  function confidenceWave() {
    var canvas = document.querySelector('[data-hw-wave]');
    if (!canvas) return;
    var tip = document.querySelector('.hw-wave-tip');

    var bars = (canvas.getAttribute('data-bars') || '').split(';').map(function (raw) {
      var parts = raw.split('|');
      return { conf: Number(parts[0]), type: Number(parts[1]) || 0, label: parts[2] || '' };
    }).filter(function (b) { return !isNaN(b.conf); });
    if (!bars.length) return;

    var ctx = fitCanvas(canvas);
    if (!ctx) return;

    var pointer = -1;
    var bump = 0, bumpTarget = 0;
    var intro = reduced ? 1 : 0;
    var phase = 0;
    var raf = null;
    var onScreen = true;

    function draw() {
      var rect = canvas.getBoundingClientRect();
      var w = rect.width, h = rect.height, mid = h / 2;
      var n = bars.length;
      var slot = w / n;
      var barW = Math.max(1.2, slot * 0.52);
      ctx.clearRect(0, 0, w, h);

      for (var i = 0; i < n; i++) {
        var b = bars[i];
        // Confidence runs 0.65..0.99; rebase so the range fills the height.
        var norm = Math.max(0, Math.min(1, (b.conf - 0.6) / 0.4));
        var lift = 0;
        if (pointer >= 0) {
          var d = (i - pointer) / 8;
          lift = Math.exp(-d * d) * bump;
        }
        // A slow breathing sine keeps the chart alive when nobody is hovering.
        var idle = reduced ? 0 : Math.sin(phase + i * 0.14) * 0.03 * (1 - bump);
        var reveal = Math.min(1, Math.max(0, intro * n * 1.25 - i) / 10);
        var amp = Math.max(1, (norm * 0.7 + idle + lift * 0.34) * (h / 2 - 8) * reveal);
        var x = i * slot + (slot - barW) / 2;

        var color = REL_COLORS[b.type] || ACCENT;
        ctx.globalAlpha = 0.34 + norm * 0.3 + lift * 0.66;
        ctx.fillStyle = color;
        if (lift > 0.25) {
          ctx.shadowColor = color;
          ctx.shadowBlur = 12 * lift;
        }
        ctx.fillRect(x, mid - amp, barW, amp * 2);
        ctx.shadowBlur = 0;
      }
      ctx.globalAlpha = 1;

      ctx.fillStyle = 'rgba(255,255,255,0.07)';
      ctx.fillRect(0, mid, w, 1);

      if (pointer >= 0 && bump > 0.1) {
        var px = pointer * slot + slot / 2;
        ctx.fillStyle = 'rgba(255,255,255,' + (0.1 * bump) + ')';
        ctx.fillRect(px, 0, 1, h);
      }
    }

    function tick() {
      bump += (bumpTarget - bump) * 0.14;
      if (intro < 1) intro = Math.min(1, intro + 0.018);
      if (!reduced) phase += 0.018;
      draw();
      raf = onScreen && !reduced ? requestAnimationFrame(tick) : null;
    }

    function showTip(i, clientX) {
      if (!tip) return;
      var b = bars[i];
      if (!b) return;
      var wrapRect = tip.parentNode.getBoundingClientRect();
      tip.innerHTML = '<b>' + b.label + '</b><span>confidence ' + b.conf.toFixed(2) + '</span>';
      tip.style.setProperty('--tip-color', REL_COLORS[b.type] || ACCENT);
      var x = clientX - wrapRect.left;
      tip.style.left = Math.max(70, Math.min(wrapRect.width - 70, x)) + 'px';
      tip.classList.add('is-on');
    }

    if (reduced) {
      draw();
    } else {
      whileVisible(canvas, function (visible) {
        onScreen = visible;
        if (visible && !raf) raf = requestAnimationFrame(tick);
      }, 0.1);

      canvas.addEventListener('mousemove', function (e) {
        var rect = canvas.getBoundingClientRect();
        pointer = Math.max(0, Math.min(bars.length - 1,
          Math.round(((e.clientX - rect.left) / rect.width) * bars.length)));
        bumpTarget = 1;
        showTip(pointer, e.clientX);
      });
      canvas.addEventListener('mouseleave', function () {
        bumpTarget = 0;
        pointer = -1;
        if (tip) tip.classList.remove('is-on');
      });
    }

    window.addEventListener('resize', debounce(function () {
      if (fitCanvas(canvas)) draw();
    }, 150));
  }

  /* 2. Agent trace -------------------------------------------------------- */
  /* A harvester run, replayed: spinner while a request is in flight, the real
   * latency printed when it lands, and the retry left in because it happens. */
  function agentTrace() {
    var trace = document.querySelector('[data-hw-trace]');
    if (!trace) return;

    var lines = trace.querySelectorAll('.hw-trace-line');
    var status = trace.querySelector('.hw-trace-status');
    var replay = trace.querySelector('.hw-trace-replay');
    if (!lines.length) return;

    if (reduced) {
      for (var i = 0; i < lines.length; i++) lines[i].classList.add('is-shown');
      if (status) status.textContent = 'done';
      return;
    }

    var timer = null;
    var spin = null;

    function reset() {
      clearTimeout(timer);
      clearInterval(spin);
      for (var i = 0; i < lines.length; i++) {
        lines[i].classList.remove('is-shown', 'is-live');
        var ms = lines[i].querySelector('.hw-trace-ms');
        if (ms) ms.parentNode.removeChild(ms);
      }
      trace.classList.remove('is-done');
    }

    function run() {
      reset();
      var idx = 0;
      var frame = 0;
      if (status) status.textContent = 'running';
      trace.classList.add('is-running');

      spin = setInterval(function () {
        frame = (frame + 1) % SPINNER.length;
        if (status) status.setAttribute('data-spin', SPINNER[frame]);
      }, 80);

      function step() {
        if (idx >= lines.length) {
          clearInterval(spin);
          trace.classList.remove('is-running');
          trace.classList.add('is-done');
          if (status) { status.textContent = 'done'; status.removeAttribute('data-spin'); }
          return;
        }
        var line = lines[idx];
        var latency = Number(line.getAttribute('data-ms') || 0);
        line.classList.add('is-shown');

        if (latency) {
          // Requests hang as "live" for their real latency, then print it.
          line.classList.add('is-live');
          timer = setTimeout(function () {
            line.classList.remove('is-live');
            var ms = document.createElement('span');
            ms.className = 'hw-trace-ms';
            ms.textContent = latency + 'ms';
            line.appendChild(ms);
            idx++;
            step();
          }, Math.min(latency, 620));
        } else {
          idx++;
          timer = setTimeout(step, 260);
        }
      }
      step();
    }

    onVisible(trace, run, 0.35);
    if (replay) replay.addEventListener('click', run);
  }

  /* 3. Run output --------------------------------------------------------- */
  function runOutput() {
    var term = document.querySelector('[data-hw-term]');
    if (!term) return;

    var lines = term.querySelectorAll('.hw-term-line');
    if (!lines.length || reduced) return;

    var texts = [];
    for (var i = 0; i < lines.length; i++) {
      texts.push(lines[i].textContent);
      lines[i].textContent = '';
      lines[i].style.visibility = 'hidden';
    }

    onVisible(term, function () {
      var li = 0, ci = 0;
      var started = Date.now();

      function step() {
        if (li >= lines.length) {
          term.classList.add('is-typed');
          var last = lines[lines.length - 1];
          var ms = document.createElement('span');
          ms.className = 'hw-term-ms';
          ms.textContent = ' · ' + ((Date.now() - started) / 1000).toFixed(1) + 's';
          last.appendChild(ms);
          return;
        }
        var el = lines[li];
        el.style.visibility = 'visible';
        el.classList.add('is-cursor');

        // The command types character by character; results land whole, the
        // way a real run prints them.
        var isCmd = el.classList.contains('hw-term-cmd');
        if (isCmd && ci < texts[li].length) {
          el.textContent = texts[li].slice(0, ++ci);
          setTimeout(step, 24);
          return;
        }
        if (!isCmd) el.textContent = texts[li];
        el.classList.remove('is-cursor');
        el.classList.add('is-printed');
        li++;
        ci = 0;
        setTimeout(step, isCmd ? 300 : 120);
      }
      step();
    }, 0.4);
  }

  /* 4. Pipeline flow ------------------------------------------------------ */
  /* Comets carry a payload label down the pipeline. The label changes at each
   * station, so the figure shows a claim becoming a published page. */
  function pipelineFlow() {
    if (reduced) return;
    var plate = document.querySelector('.hw-plate-art');
    if (!plate) return;
    var PAYLOAD = ['claim', 'fact', 'record', 'diff', 'green', 'page'];
    var svgs = plate.querySelectorAll('svg');
    for (var i = 0; i < svgs.length; i++) animate(svgs[i], i === 0);

    function animate(svg, withLabel) {
      var flow = svg.querySelector('.hw-flow');
      var boxes = svg.querySelectorAll('.hw-station-box');
      if (!flow || !boxes.length || !flow.getTotalLength) return;

      var ns = 'http://www.w3.org/2000/svg';
      var len = flow.getTotalLength();
      var layer = document.createElementNS(ns, 'g');
      layer.setAttribute('class', 'hw-flow-layer');
      flow.parentNode.appendChild(layer);

      var TAIL = 5;
      var comet = [];
      for (var t = 0; t < TAIL; t++) {
        var seg = document.createElementNS(ns, 'circle');
        seg.setAttribute('r', String(3.6 - t * 0.55));
        seg.setAttribute('fill', ACCENT);
        seg.setAttribute('opacity', String(0.85 - t * 0.15));
        seg.setAttribute('class', t === 0 ? 'hw-particle hw-particle-head' : 'hw-particle');
        layer.appendChild(seg);
        comet.push(seg);
      }

      var label = null;
      if (withLabel) {
        label = document.createElementNS(ns, 'text');
        label.setAttribute('class', 'hw-payload');
        label.setAttribute('text-anchor', 'middle');
        layer.appendChild(label);
      }

      var marks = [];
      for (var b = 0; b < boxes.length; b++) {
        marks.push({
          el: boxes[b],
          y: parseFloat(boxes[b].getAttribute('y')) + parseFloat(boxes[b].getAttribute('height')) / 2,
          hit: false
        });
      }

      var pos = 0;
      var history = [];
      var raf = null;
      var running = false;

      function frame() {
        pos += 0.0024;
        if (pos > 1.2) {
          pos = -0.08;
          for (var m = 0; m < marks.length; m++) marks[m].hit = false;
        }
        var t = Math.max(0, Math.min(1, pos));
        var p = flow.getPointAtLength(t * len);
        history.unshift({ x: p.x, y: p.y });
        if (history.length > TAIL * 4) history.pop();

        var visible = pos > 0 && pos < 1 ? 1 : 0;
        for (var c = 0; c < comet.length; c++) {
          var h = history[Math.min(history.length - 1, c * 3)];
          comet[c].setAttribute('cx', h.x);
          comet[c].setAttribute('cy', h.y);
          comet[c].setAttribute('opacity', visible * (0.85 - c * 0.15));
        }

        var stage = 0;
        for (var k = 0; k < marks.length; k++) {
          if (p.y >= marks[k].y - 8) stage = k;
          if (!marks[k].hit && Math.abs(p.y - marks[k].y) < 10 && visible) {
            marks[k].hit = true;
            ping(marks[k]);
          }
        }
        if (label) {
          label.setAttribute('x', p.x + 54);
          label.setAttribute('y', p.y + 4);
          label.setAttribute('opacity', visible * 0.8);
          label.textContent = PAYLOAD[Math.min(PAYLOAD.length - 1, stage)];
        }
        raf = requestAnimationFrame(frame);
      }

      // A ring expands out of the station the payload just reached.
      function ping(mark) {
        mark.el.classList.add('is-lit');
        setTimeout(function () { mark.el.classList.remove('is-lit'); }, 700);

        var ring = document.createElementNS(ns, 'rect');
        var x = parseFloat(mark.el.getAttribute('x'));
        var y = parseFloat(mark.el.getAttribute('y'));
        var w = parseFloat(mark.el.getAttribute('width'));
        var h = parseFloat(mark.el.getAttribute('height'));
        ring.setAttribute('x', x); ring.setAttribute('y', y);
        ring.setAttribute('width', w); ring.setAttribute('height', h);
        ring.setAttribute('rx', '10');
        ring.setAttribute('fill', 'none');
        ring.setAttribute('stroke', ACCENT);
        ring.setAttribute('class', 'hw-ping');
        mark.el.parentNode.appendChild(ring);
        setTimeout(function () {
          if (ring.parentNode) ring.parentNode.removeChild(ring);
        }, 900);
      }

      whileVisible(svg, function (visible) {
        if (visible && !running) { running = true; frame(); }
        else if (!visible && running) { running = false; cancelAnimationFrame(raf); }
      }, 0.12);
    }
  }

  /* 5. Spotlight ---------------------------------------------------------- */
  function spotlight() {
    if (reduced) return;
    var plate = document.querySelector('[data-hw-spot]');
    if (!plate) return;
    var spot = plate.querySelector('.hw-spot');
    if (!spot) return;

    plate.addEventListener('mousemove', function (e) {
      var r = plate.getBoundingClientRect();
      spot.style.setProperty('--x', (e.clientX - r.left) + 'px');
      spot.style.setProperty('--y', (e.clientY - r.top) + 'px');
      spot.classList.add('is-on');
    });
    plate.addEventListener('mouseleave', function () { spot.classList.remove('is-on'); });
  }

  /* 6. Station rail ------------------------------------------------------- */
  function stationRail() {
    var rail = document.querySelector('.hw-rail');
    if (!rail) return;
    var links = rail.querySelectorAll('a');
    var fill = rail.querySelector('.hw-rail-spine i');
    if (!links.length) return;

    var targets = [];
    for (var i = 0; i < links.length; i++) {
      var section = document.getElementById(links[i].getAttribute('href').slice(1));
      if (section) targets.push({ link: links[i], el: section });
    }
    if (!targets.length) return;
    rail.classList.add('is-ready');

    var ticking = false;
    function update() {
      ticking = false;
      var line = window.innerHeight * 0.32;
      var active = -1;
      for (var i = 0; i < targets.length; i++) {
        if (targets[i].el.getBoundingClientRect().top <= line) active = i;
      }
      for (var j = 0; j < targets.length; j++) {
        targets[j].link.classList.toggle('is-active', j === active);
        targets[j].link.classList.toggle('is-done', j < active);
      }
      rail.classList.toggle('is-visible', active >= 0);
      if (fill) {
        var pct = active < 0 ? 0 : ((active + 1) / targets.length) * 100;
        fill.style.height = pct + '%';
      }
    }

    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* 7. Counters ----------------------------------------------------------- */
  function statCounters() {
    var stats = document.querySelectorAll('.hw-stat b');
    if (!stats.length || reduced) return;
    for (var i = 0; i < stats.length; i++) count(stats[i], i);

    function count(el, order) {
      var finalText = el.textContent;
      var numbers = finalText.match(/\d+/g);
      if (!numbers) return;

      onVisible(el, function () {
        var startedAt = null;
        var DURATION = 1000;
        var delay = order * 70;

        function step(now) {
          if (startedAt === null) startedAt = now + delay;
          var p = Math.min(1, Math.max(0, (now - startedAt) / DURATION));
          var eased = easeOutCubic(p);
          var k = 0;
          el.textContent = finalText.replace(/\d+/g, function (m) {
            return String(Math.round(Number(numbers[k++]) * eased));
          });
          if (p < 1) requestAnimationFrame(step);
          else el.textContent = finalText;   // the exact value always wins
        }
        requestAnimationFrame(step);
      }, 0.6);
    }
  }

  /* 8. Constellation ------------------------------------------------------ */
  /* The busiest nodes in the graph, drifting and linking. Names come from the
   * dataset, so the backdrop is the thing the page is about. */
  function constellation() {
    if (reduced) return;
    var canvas = document.querySelector('[data-hw-particles]');
    if (!canvas || window.innerWidth < 900) return;

    var ctx = fitCanvas(canvas);
    if (!ctx) return;

    var names = (canvas.getAttribute('data-names') || '').split(',').filter(Boolean);
    var rect = canvas.getBoundingClientRect();
    var nodes = [];
    var COUNT = Math.max(18, Math.min(names.length || 22, 26));
    var LINK = 168;

    for (var i = 0; i < COUNT; i++) {
      nodes.push({
        x: Math.random() * rect.width,
        y: Math.random() * rect.height,
        vx: (Math.random() - 0.5) * 0.14,
        vy: (Math.random() - 0.5) * 0.14,
        r: 1 + Math.random() * 1.6,
        name: names[i % (names.length || 1)] || '',
        // Only some nodes carry a visible label, so it reads as texture.
        labelled: i % 3 === 0
      });
    }

    function frame() {
      var r = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, r.width, r.height);
      ctx.font = '10px ui-monospace, monospace';

      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > r.width) n.vx *= -1;
        if (n.y < 0 || n.y > r.height) n.vy *= -1;

        for (var j = i + 1; j < nodes.length; j++) {
          var dx = n.x - nodes[j].x, dy = n.y - nodes[j].y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < LINK) {
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = 'rgba(74, 222, 128, ' + (0.06 * (1 - dist / LINK)) + ')';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(74, 222, 128, 0.2)';
        ctx.fill();

        if (n.labelled && n.name) {
          ctx.fillStyle = 'rgba(160, 220, 185, 0.13)';
          ctx.fillText(n.name, n.x + 7, n.y + 3);
        }
      }
      requestAnimationFrame(frame);
    }
    frame();

    window.addEventListener('resize', debounce(function () { fitCanvas(canvas); }, 200));
  }

  function init() {
    var jobs = [confidenceWave, agentTrace, runOutput, pipelineFlow, spotlight,
                stationRail, statCounters, constellation];
    for (var i = 0; i < jobs.length; i++) {
      try { jobs[i](); } catch (e) { /* decoration must never break the page */ }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
