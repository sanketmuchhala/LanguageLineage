// Animates "data packets" travelling along the hero specimen-graph edges, in the
// edge's semantic colour (influence blue / runtime green / compiler amber) and in
// the direction of the arrow — the graph looks like it is compiling. Appends SVG
// circles after the edges group (so they render under the nodes) and drives them
// with a single rAF. Gated by prefers-reduced-motion.

const SVGNS = 'http://www.w3.org/2000/svg';

const EDGE_COLOR: Record<string, string> = {
  'hg-influence': '#60a5fa',
  'hg-runtime': '#34d399',
  'hg-compiler': '#e3a008',
};

interface Packet {
  x1: number; y1: number; x2: number; y2: number;
  el: SVGCircleElement;
  t: number;     // -gap..1.25
  speed: number; // units per second
}

export function initDataFlow(svg: SVGSVGElement): () => void {
  if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return () => {};
  }
  const lines = Array.from(svg.querySelectorAll('.hg-edge')) as unknown as SVGLineElement[];
  if (!lines.length) return () => {};

  const group = document.createElementNS(SVGNS, 'g');
  group.setAttribute('class', 'hg-packets');
  group.setAttribute('aria-hidden', 'true');
  const edges = svg.querySelector('.hg-edges');
  if (edges && edges.parentNode) edges.parentNode.insertBefore(group, edges.nextSibling);
  else svg.appendChild(group);

  const packets: Packet[] = lines.map((line, i) => {
    const cls = line.classList.contains('hg-influence') ? 'hg-influence'
      : line.classList.contains('hg-runtime') ? 'hg-runtime' : 'hg-compiler';
    const color = EDGE_COLOR[cls];
    const el = document.createElementNS(SVGNS, 'circle');
    el.setAttribute('r', '2.4');
    el.setAttribute('class', 'hg-packet');
    el.setAttribute('fill', color);
    el.style.setProperty('--c', color);
    el.style.opacity = '0';
    group.appendChild(el);
    return {
      x1: line.x1.baseVal.value, y1: line.y1.baseVal.value,
      x2: line.x2.baseVal.value, y2: line.y2.baseVal.value,
      el,
      t: -(i * 0.7) - 0.3, // stagger starts
      speed: 0.2 + Math.random() * 0.05,
    };
  });

  let raf = 0;
  let last = performance.now();
  let running = false;

  function frame(now: number) {
    if (!running) return;
    const dt = Math.min(60, now - last) / 1000;
    last = now;
    for (const p of packets) {
      p.t += p.speed * dt;
      if (p.t > 1.25) p.t = -(0.2 + Math.random() * 0.5); // gap before repeat
      if (p.t < 0 || p.t > 1) { p.el.style.opacity = '0'; continue; }
      const x = p.x1 + (p.x2 - p.x1) * p.t;
      const y = p.y1 + (p.y2 - p.y1) * p.t;
      p.el.setAttribute('cx', x.toFixed(1));
      p.el.setAttribute('cy', y.toFixed(1));
      p.el.style.opacity = String(Math.min(1, Math.min(p.t, 1 - p.t) * 7));
    }
    raf = requestAnimationFrame(frame);
  }

  function start() { if (!running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); } }
  function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }

  const onVis = () => { if (document.hidden) stop(); else start(); };
  const io = new IntersectionObserver((e) => {
    if (e.some((x) => x.isIntersecting)) start(); else stop();
  }, { threshold: 0 });
  io.observe(svg);
  document.addEventListener('visibilitychange', onVis);
  start();

  return () => {
    stop();
    io.disconnect();
    document.removeEventListener('visibilitychange', onVis);
    group.remove();
  };
}
