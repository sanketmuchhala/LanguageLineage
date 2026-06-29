// A living node-graph rendered to canvas: faint nodes drift and link to nearby
// neighbours, and the cursor energises the graph around it in signal green. This
// is the hero's signature — the site's subject (a graph) made ambient and alive.
// Framework-agnostic: initConstellation(canvas) -> destroy().

export interface ConstellationOptions {
  /** Base node/link colour (rgb triplet, no alpha). */
  base?: [number, number, number];
  /** Cursor-energised colour (rgb triplet). */
  accent?: [number, number, number];
  /** Roughly one node per this many CSS px². Lower = denser. */
  area?: number;
  /** Hard cap on node count. */
  maxNodes?: number;
  /** Distance (CSS px) within which two nodes link. */
  linkDist?: number;
  /** Cursor influence radius (CSS px). */
  cursorRadius?: number;
  /** Drift speed multiplier. */
  speed?: number;
}

interface Node { x: number; y: number; vx: number; vy: number; }

const DEFAULTS: Required<ConstellationOptions> = {
  base: [255, 255, 255],
  accent: [74, 222, 128], // #4ade80
  area: 12500,
  maxNodes: 120,
  linkDist: 150,
  cursorRadius: 240,
  speed: 1,
};

const prefersReducedMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initConstellation(canvas: HTMLCanvasElement, options: ConstellationOptions = {}): () => void {
  const opts = { ...DEFAULTS, ...options };
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return () => {};

  const parent = canvas.parentElement ?? canvas;
  let dpr = 1;
  let w = 0; // CSS px
  let h = 0;
  let nodes: Node[] = [];
  let raf = 0;
  let running = false;
  let visible = true;

  // Pointer is tracked in CSS px relative to the canvas; null when absent.
  const cursor = { x: 0, y: 0, active: false };

  function resize() {
    const rect = parent.getBoundingClientRect();
    w = Math.max(1, rect.width);
    h = Math.max(1, rect.height);
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

    const target = Math.min(opts.maxNodes, Math.round((w * h) / opts.area));
    if (nodes.length > target) nodes.length = target;
    while (nodes.length < target) {
      nodes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.22 * opts.speed,
        vy: (Math.random() - 0.5) * 0.22 * opts.speed,
      });
    }
  }

  function step() {
    for (const n of nodes) {
      n.x += n.vx;
      n.y += n.vy;
      // Soft wrap so the field never empties.
      if (n.x < -20) n.x = w + 20; else if (n.x > w + 20) n.x = -20;
      if (n.y < -20) n.y = h + 20; else if (n.y > h + 20) n.y = -20;

      // Gentle drift toward the cursor when it is near.
      if (cursor.active) {
        const dx = cursor.x - n.x;
        const dy = cursor.y - n.y;
        const d2 = dx * dx + dy * dy;
        const r = opts.cursorRadius;
        if (d2 < r * r) {
          const d = Math.sqrt(d2) || 1;
          const pull = (1 - d / r) * 0.18;
          n.x += (dx / d) * pull;
          n.y += (dy / d) * pull;
        }
      }
    }
  }

  // Eased cursor energy at a point: 0 far away, ~1 at the cursor, biased so
  // mid-range nodes still light up noticeably.
  function energyAt(x: number, y: number): number {
    if (!cursor.active) return 0;
    const d = Math.hypot(cursor.x - x, cursor.y - y);
    if (d >= opts.cursorRadius) return 0;
    return Math.pow(1 - d / opts.cursorRadius, 0.6);
  }

  function draw() {
    ctx!.clearRect(0, 0, w, h);
    const [br, bg, bb] = opts.base;
    const [ar, ag, ab] = opts.accent;
    const link = opts.linkDist;

    // Links between nearby nodes.
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      const aEnergy = energyAt(a.x, a.y);

      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 > link * link) continue;
        const d = Math.sqrt(d2);
        const fade = 1 - d / link;
        const energy = Math.max(aEnergy, energyAt(b.x, b.y));
        const cr = br + (ar - br) * energy;
        const cg = bg + (ag - bg) * energy;
        const cb = bb + (ab - bb) * energy;
        ctx!.strokeStyle = `rgba(${cr | 0},${cg | 0},${cb | 0},${(fade * (0.16 + energy * 0.62)).toFixed(3)})`;
        ctx!.lineWidth = 0.6 + energy * 0.9;
        ctx!.beginPath();
        ctx!.moveTo(a.x, a.y);
        ctx!.lineTo(b.x, b.y);
        ctx!.stroke();
      }

      // Link the cursor itself to nodes inside its radius — "you are connected".
      if (aEnergy > 0.04) {
        ctx!.strokeStyle = `rgba(${ar},${ag},${ab},${(aEnergy * 0.7).toFixed(3)})`;
        ctx!.lineWidth = 0.5 + aEnergy * 1.1;
        ctx!.beginPath();
        ctx!.moveTo(cursor.x, cursor.y);
        ctx!.lineTo(a.x, a.y);
        ctx!.stroke();
      }

      // Node dot.
      const nr = br + (ar - br) * aEnergy;
      const ng = bg + (ag - bg) * aEnergy;
      const nb = bb + (ab - bb) * aEnergy;
      const radius = 1.1 + aEnergy * 2.4;
      ctx!.fillStyle = `rgba(${nr | 0},${ng | 0},${nb | 0},${(0.4 + aEnergy * 0.55).toFixed(3)})`;
      if (aEnergy > 0.1) {
        ctx!.shadowColor = `rgba(${ar},${ag},${ab},${aEnergy})`;
        ctx!.shadowBlur = 12 * aEnergy;
      }
      ctx!.beginPath();
      ctx!.arc(a.x, a.y, radius, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.shadowBlur = 0;
    }

    // A bright core where the cursor sits — the energy hub.
    if (cursor.active) {
      const grad = ctx!.createRadialGradient(cursor.x, cursor.y, 0, cursor.x, cursor.y, 26);
      grad.addColorStop(0, `rgba(${ar},${ag},${ab},0.9)`);
      grad.addColorStop(1, `rgba(${ar},${ag},${ab},0)`);
      ctx!.fillStyle = grad;
      ctx!.beginPath();
      ctx!.arc(cursor.x, cursor.y, 26, 0, Math.PI * 2);
      ctx!.fill();
    }
  }

  function frame() {
    if (!running) return;
    step();
    draw();
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (running || !visible) return;
    running = true;
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  // --- listeners ---
  const onPointer = (e: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    cursor.x = e.clientX - rect.left;
    cursor.y = e.clientY - rect.top;
    cursor.active = cursor.x >= -40 && cursor.x <= w + 40 && cursor.y >= -40 && cursor.y <= h + 40;
  };
  const onLeave = () => { cursor.active = false; };
  const onVisibility = () => {
    if (document.hidden) stop();
    else start();
  };

  const ro = new ResizeObserver(() => resize());
  ro.observe(parent);

  const io = new IntersectionObserver((entries) => {
    visible = entries.some((en) => en.isIntersecting);
    if (visible) start(); else stop();
  }, { threshold: 0 });
  io.observe(canvas);

  window.addEventListener('pointermove', onPointer, { passive: true });
  window.addEventListener('pointerout', onLeave, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);

  resize();

  if (prefersReducedMotion()) {
    // One static, sparse frame — atmosphere without motion.
    draw();
    return () => {
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('pointerout', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }

  start();

  return () => {
    stop();
    ro.disconnect();
    io.disconnect();
    window.removeEventListener('pointermove', onPointer);
    window.removeEventListener('pointerout', onLeave);
    document.removeEventListener('visibilitychange', onVisibility);
  };
}
