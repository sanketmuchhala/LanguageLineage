/* Motion for /how-it-works. Hand-maintained, like fx.js: not generated output.
 *
 * Everything here is progressive enhancement. The page is complete and readable
 * with JavaScript off, and every effect below returns early under
 * prefers-reduced-motion. No dependencies, ES5 only, vanilla Canvas.
 *
 * 1. Confidence wave      real per-edge scores as a waveform, bump follows cursor
 * 2. Pipeline flow        particles travel the Fig. 1 stations, each lights up
 * 3. Station rail         fixed progress indicator tracking the current station
 * 4. Stat counters        the hero numbers count up when scrolled into view
 * 5. Typing terminal      the validation output types itself out
 * 6. Ambient particles    a faint constellation behind the article
 */
(function () {
  'use strict';

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var supportsIO = 'IntersectionObserver' in window;

  function onVisible(el, cb, threshold) {
    if (!supportsIO) { cb(); return; }
    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) { io.unobserve(entries[i].target); cb(); }
      }
    }, { threshold: threshold || 0.3 });
    io.observe(el);
  }

  // Canvas sized in CSS pixels but backed at device resolution, so lines stay
  // crisp on retina displays. Returns the context with the scale applied.
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

  /* 1. Confidence wave ---------------------------------------------------- */
  /* Each bar is one real edge, sampled evenly across every score in the
   * dataset, lowest to highest. The cursor raises a Gaussian bump so the shape
   * stays legible while you read it. */
  function confidenceWave() {
    var canvas = document.querySelector('[data-hw-wave]');
    if (!canvas) return;

    var values = (canvas.getAttribute('data-values') || '').split(',').map(Number).filter(function (n) {
      return !isNaN(n);
    });
    if (!values.length) return;

    var ctx = fitCanvas(canvas);
    if (!ctx) return;

    var pointer = -1;      // bar index under the cursor, -1 when away
    var bump = 0;          // eased bump strength, 0..1
    var target = 0;
    var intro = reduced ? 1 : 0;
    var raf = null;

    function draw() {
      var rect = canvas.getBoundingClientRect();
      var w = rect.width;
      var h = rect.height;
      var mid = h / 2;
      var n = values.length;
      var slot = w / n;
      var barW = Math.max(1, slot * 0.55);

      ctx.clearRect(0, 0, w, h);

      for (var i = 0; i < n; i++) {
        // Confidence runs 0.65..0.99; rebase so the range uses the full height.
        var norm = Math.max(0, Math.min(1, (values[i] - 0.6) / 0.4));
        var lift = 0;
        if (pointer >= 0) {
          var d = (i - pointer) / 9;
          lift = Math.exp(-d * d) * bump;   // Gaussian falloff around the cursor
        }
        var reveal = Math.min(1, Math.max(0, intro * n - i) / 12);
        var amp = (norm * 0.72 + lift * 0.3) * (h / 2 - 6) * reveal;
        var x = i * slot + (slot - barW) / 2;

        var alpha = 0.18 + norm * 0.32 + lift * 0.5;
        ctx.fillStyle = lift > 0.05
          ? 'rgba(74, 222, 128, ' + Math.min(1, alpha + 0.2) + ')'
          : 'rgba(120, 200, 150, ' + alpha + ')';
        ctx.fillRect(x, mid - amp, barW, amp * 2);
      }

      // Centre line, so the wave reads as a distribution rather than decoration.
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(0, mid, w, 1);
    }

    function tick() {
      bump += (target - bump) * 0.12;
      if (intro < 1) intro = Math.min(1, intro + 0.02);
      draw();
      if (Math.abs(target - bump) > 0.004 || intro < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = null;
      }
    }

    function kick() { if (!raf) raf = requestAnimationFrame(tick); }

    if (reduced) {
      draw();
    } else {
      onVisible(canvas, kick, 0.2);
    }

    if (!reduced) {
      canvas.addEventListener('mousemove', function (e) {
        var rect = canvas.getBoundingClientRect();
        pointer = Math.round(((e.clientX - rect.left) / rect.width) * values.length);
        target = 1;
        kick();
      });
      canvas.addEventListener('mouseleave', function () {
        target = 0;
        pointer = -1;
        kick();
      });
    }

    window.addEventListener('resize', debounce(function () {
      if (fitCanvas(canvas)) draw();
    }, 150));
  }

  /* 2. Pipeline particle flow --------------------------------------------- */
  /* Dots run down the connector in Fig. 1 and each station lights as a dot
   * reaches it, so the figure reads as a pipeline rather than a list. */
  function pipelineFlow() {
    if (reduced) return;
    var plate = document.querySelector('.hw-plate-art');
    if (!plate) return;

    var svgs = plate.querySelectorAll('svg');
    for (var s = 0; s < svgs.length; s++) animate(svgs[s]);

    function animate(svg) {
      var flow = svg.querySelector('.hw-flow');
      var boxes = svg.querySelectorAll('.hw-station-box');
      if (!flow || !boxes.length || !flow.getTotalLength) return;

      var len = flow.getTotalLength();
      var start = flow.getPointAtLength(0);
      var ns = 'http://www.w3.org/2000/svg';
      var dots = [];
      var COUNT = 3;

      for (var i = 0; i < COUNT; i++) {
        var dot = document.createElementNS(ns, 'circle');
        dot.setAttribute('r', '3.5');
        dot.setAttribute('fill', 'var(--accent, #4ade80)');
        dot.setAttribute('class', 'hw-particle');
        dot.setAttribute('cx', start.x);
        dot.setAttribute('cy', start.y);
        flow.parentNode.appendChild(dot);
        dots.push({ el: dot, t: -i / COUNT });
      }

      // Each station's y midpoint, used to decide which one a dot is passing.
      var marks = [];
      for (var b = 0; b < boxes.length; b++) {
        var box = boxes[b];
        marks.push({
          el: box,
          y: parseFloat(box.getAttribute('y')) + parseFloat(box.getAttribute('height')) / 2
        });
      }

      var running = false;
      var raf;

      function frame() {
        for (var d = 0; d < dots.length; d++) {
          var dot = dots[d];
          dot.t += 0.0022;
          if (dot.t > 1.15) dot.t = -0.05;
          var t = Math.max(0, Math.min(1, dot.t));
          var p = flow.getPointAtLength(t * len);
          dot.el.setAttribute('cx', p.x);
          dot.el.setAttribute('cy', p.y);
          dot.el.setAttribute('opacity', dot.t < 0 || dot.t > 1 ? 0 : 0.9);

          for (var m = 0; m < marks.length; m++) {
            if (Math.abs(p.y - marks[m].y) < 14 && dot.t > 0 && dot.t < 1) {
              marks[m].el.classList.add('is-lit');
              (function (el) {
                setTimeout(function () { el.classList.remove('is-lit'); }, 620);
              })(marks[m].el);
            }
          }
        }
        raf = requestAnimationFrame(frame);
      }

      function startLoop() { if (!running) { running = true; frame(); } }
      function stopLoop() { running = false; cancelAnimationFrame(raf); }

      // Only animate while the figure is on screen; no background CPU burn.
      if (supportsIO) {
        var io = new IntersectionObserver(function (entries) {
          entries[0].isIntersecting ? startLoop() : stopLoop();
        }, { threshold: 0.15 });
        io.observe(svg);
      } else {
        startLoop();
      }
    }
  }

  /* 3. Station rail -------------------------------------------------------- */
  function stationRail() {
    var rail = document.querySelector('.hw-rail');
    if (!rail) return;
    var links = rail.querySelectorAll('a');
    if (!links.length) return;

    var targets = [];
    for (var i = 0; i < links.length; i++) {
      var id = links[i].getAttribute('href').slice(1);
      var section = document.getElementById(id);
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
    }

    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* 4. Stat counters ------------------------------------------------------- */
  /* Handles the three shapes used in the hero: "171", "108/171" and "300+". */
  function statCounters() {
    var stats = document.querySelectorAll('.hw-stat b');
    if (!stats.length || reduced) return;

    for (var i = 0; i < stats.length; i++) count(stats[i]);

    function count(el) {
      var finalText = el.textContent;
      var numbers = finalText.match(/\d+/g);
      if (!numbers) return;

      onVisible(el, function () {
        var startedAt = null;
        var DURATION = 900;

        function step(now) {
          if (startedAt === null) startedAt = now;
          var p = Math.min(1, (now - startedAt) / DURATION);
          var eased = 1 - Math.pow(1 - p, 3);
          var k = 0;
          el.textContent = finalText.replace(/\d+/g, function (match) {
            return String(Math.round(Number(numbers[k++]) * eased));
          });
          if (p < 1) {
            requestAnimationFrame(step);
          } else {
            el.textContent = finalText;   // exact value always wins at the end
          }
        }
        requestAnimationFrame(step);
      }, 0.6);
    }
  }

  /* 5. Typing terminal ----------------------------------------------------- */
  function typingTerminal() {
    var term = document.querySelector('.hw-term');
    if (!term || reduced) return;

    var lines = term.querySelectorAll('.hw-term-line');
    if (!lines.length) return;

    var texts = [];
    for (var i = 0; i < lines.length; i++) {
      texts.push(lines[i].textContent);
      lines[i].textContent = '';
      lines[i].style.visibility = 'hidden';
    }

    onVisible(term, function () {
      term.classList.add('is-typing');
      var li = 0;
      var ci = 0;

      function typeStep() {
        if (li >= lines.length) {
          term.classList.remove('is-typing');
          term.classList.add('is-typed');
          return;
        }
        var el = lines[li];
        el.style.visibility = 'visible';
        el.classList.add('is-cursor');

        // The command line types character by character; result lines land
        // whole, the way a real run prints them.
        var isCmd = el.classList.contains('hw-term-cmd');
        if (isCmd && ci < texts[li].length) {
          el.textContent = texts[li].slice(0, ++ci);
          setTimeout(typeStep, 26);
          return;
        }
        if (!isCmd) el.textContent = texts[li];

        el.classList.remove('is-cursor');
        li++;
        ci = 0;
        setTimeout(typeStep, isCmd ? 260 : 130);
      }
      typeStep();
    }, 0.4);
  }

  /* 6. Ambient particles --------------------------------------------------- */
  /* A faint constellation fixed behind the article. Skipped on small screens,
   * where it costs battery and adds nothing. */
  function ambientParticles() {
    if (reduced) return;
    var canvas = document.querySelector('[data-hw-particles]');
    if (!canvas) return;
    if (window.innerWidth < 900) return;

    var ctx = fitCanvas(canvas);
    if (!ctx) return;

    var rect = canvas.getBoundingClientRect();
    var dots = [];
    var COUNT = 30;
    var LINK = 140;

    for (var i = 0; i < COUNT; i++) {
      dots.push({
        x: Math.random() * rect.width,
        y: Math.random() * rect.height,
        vx: (Math.random() - 0.5) * 0.16,
        vy: (Math.random() - 0.5) * 0.16,
        r: 0.8 + Math.random() * 1.4
      });
    }

    function frame() {
      var w = canvas.getBoundingClientRect().width;
      var h = canvas.getBoundingClientRect().height;
      ctx.clearRect(0, 0, w, h);

      for (var i = 0; i < dots.length; i++) {
        var d = dots[i];
        d.x += d.vx;
        d.y += d.vy;
        if (d.x < 0 || d.x > w) d.vx *= -1;
        if (d.y < 0 || d.y > h) d.vy *= -1;

        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(74, 222, 128, 0.22)';
        ctx.fill();

        for (var j = i + 1; j < dots.length; j++) {
          var dx = d.x - dots[j].x;
          var dy = d.y - dots[j].y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < LINK) {
            ctx.beginPath();
            ctx.moveTo(d.x, d.y);
            ctx.lineTo(dots[j].x, dots[j].y);
            ctx.strokeStyle = 'rgba(74, 222, 128, ' + (0.07 * (1 - dist / LINK)) + ')';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(frame);
    }
    frame();

    window.addEventListener('resize', debounce(function () { fitCanvas(canvas); }, 200));
  }

  function init() {
    try { confidenceWave(); } catch (e) {}
    try { pipelineFlow(); } catch (e) {}
    try { stationRail(); } catch (e) {}
    try { statCounters(); } catch (e) {}
    try { typingTerminal(); } catch (e) {}
    try { ambientParticles(); } catch (e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
