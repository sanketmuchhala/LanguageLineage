// A faint, calm field of drifting nodes and links behind the hero, ambient
// texture, not a light show. No cursor reactivity, low contrast, slow drift.
// Framework-agnostic: initConstellation(canvas) -> destroy().

export interface ConstellationOptions {
  /** Node/link colour (rgb triplet, no alpha). */
  base?: [number, number, number];
  /** Roughly one node per this many CSS px². Higher = sparser. */
  area?: number;
  /** Hard cap on node count. */
  maxNodes?: number;
  /** Distance (CSS px) within which two nodes link. */
  linkDist?: number;
  /** Drift speed multiplier. */
  speed?: number;
}

interface Node { x: number; y: number; vx: number; vy: number; }

const DEFAULTS: Required<ConstellationOptions> = {
  base: [255, 255, 255],
  area: 26000,
  maxNodes: 58,
  linkDist: 128,
  speed: 0.55,
};

const prefersReducedMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initConstellation(canvas: HTMLCanvasElement, options: ConstellationOptions = {}): () => void {
  const opts = { ...DEFAULTS, ...options };
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return () => {};

  const parent = canvas.parentElement ?? canvas;
  let w = 0;
  let h = 0;
  let nodes: Node[] = [];
  let raf = 0;
  let running = false;
  let visible = true;

  function resize() {
    const rect = parent.getBoundingClientRect();
    w = Math.max(1, rect.width);
    h = Math.max(1, rect.height);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

    const target = Math.min(opts.maxNodes, Math.round((w * h) / opts.area));
    if (nodes.length > target) nodes.length = target;
    while (nodes.length < target) {
      nodes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.18 * opts.speed,
        vy: (Math.random() - 0.5) * 0.18 * opts.speed,
      });
    }
  }

  function step() {
    for (const n of nodes) {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < -20) n.x = w + 20; else if (n.x > w + 20) n.x = -20;
      if (n.y < -20) n.y = h + 20; else if (n.y > h + 20) n.y = -20;
    }
  }

  function draw() {
    ctx!.clearRect(0, 0, w, h);
    const [br, bg, bb] = opts.base;
    const link = opts.linkDist;

    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 > link * link) continue;
        const fade = 1 - Math.sqrt(d2) / link;
        ctx!.strokeStyle = `rgba(${br},${bg},${bb},${(fade * 0.05).toFixed(3)})`;
        ctx!.lineWidth = 0.6;
        ctx!.beginPath();
        ctx!.moveTo(a.x, a.y);
        ctx!.lineTo(b.x, b.y);
        ctx!.stroke();
      }
      ctx!.fillStyle = `rgba(${br},${bg},${bb},0.16)`;
      ctx!.beginPath();
      ctx!.arc(a.x, a.y, 1, 0, Math.PI * 2);
      ctx!.fill();
    }
  }

  function frame() {
    if (!running) return;
    step();
    draw();
    raf = requestAnimationFrame(frame);
  }
  function start() { if (running || !visible) return; running = true; raf = requestAnimationFrame(frame); }
  function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }

  const onVisibility = () => { if (document.hidden) stop(); else start(); };
  const ro = new ResizeObserver(() => resize());
  ro.observe(parent);
  const io = new IntersectionObserver((entries) => {
    visible = entries.some((en) => en.isIntersecting);
    if (visible) start(); else stop();
  }, { threshold: 0 });
  io.observe(canvas);
  document.addEventListener('visibilitychange', onVisibility);

  resize();

  if (prefersReducedMotion()) {
    draw();
    return () => { ro.disconnect(); io.disconnect(); document.removeEventListener('visibilitychange', onVisibility); };
  }

  start();
  return () => {
    stop();
    ro.disconnect();
    io.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
  };
}
