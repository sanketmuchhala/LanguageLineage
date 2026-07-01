// Small, framework-agnostic interaction effects shared by the landing page (and,
// in plain-JS form, the static pages). Each returns a destroy() and is a no-op
// under prefers-reduced-motion where motion would be distracting.

const reduced = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

const easeOutCubic = (p: number) => 1 - Math.pow(1 - p, 3);

// Count numbers up when they scroll into view. Years (>= 1000) tick from a near
// baseline so they read as a fast odometer rather than spinning from zero.
export function initCountUps(root: ParentNode = document, selector = '.stat-number'): () => void {
  const els = Array.from(root.querySelectorAll<HTMLElement>(selector));
  if (!els.length || reduced()) return () => {};

  const run = (el: HTMLElement) => {
    const target = parseInt(el.dataset.countTarget ?? '0', 10) || 0;
    const start = target >= 1000 ? Math.max(0, target - 60) : 0;
    const dur = 1100;
    const t0 = performance.now();
    const frame = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      el.textContent = String(Math.round(start + (target - start) * easeOutCubic(p)));
      if (p < 1) requestAnimationFrame(frame);
      else el.textContent = String(target);
    };
    requestAnimationFrame(frame);
  };

  const pending = new Set<HTMLElement>();
  for (const el of els) {
    // Store the true target once, so a re-init (React StrictMode double-invoke)
    // never reads back the already-lowered start value.
    if (!el.dataset.countTarget) {
      el.dataset.countTarget = String(parseInt((el.textContent ?? '0').replace(/[^\d]/g, ''), 10) || 0);
    }
    const target = parseInt(el.dataset.countTarget, 10) || 0;
    el.textContent = String(target >= 1000 ? Math.max(0, target - 60) : 0);
    pending.add(el);
  }

  // The landing scrolls inside .landing, and IntersectionObserver proved
  // unreliable against that fixed container, so trigger on scroll position.
  const scroller = (root instanceof Document ? document.querySelector('.landing') : null);
  let raf = 0;
  let cleanedUp = false;
  const cleanup = () => {
    if (cleanedUp) return;
    cleanedUp = true;
    window.removeEventListener('scroll', onScroll);
    scroller?.removeEventListener('scroll', onScroll);
    if (raf) cancelAnimationFrame(raf);
  };
  const check = () => {
    const h = window.innerHeight;
    for (const el of [...pending]) {
      const r = el.getBoundingClientRect();
      if (r.top < h * 0.92 && r.bottom > 0) { pending.delete(el); run(el); }
    }
    if (!pending.size) cleanup();
  };
  function onScroll() { if (!raf) raf = requestAnimationFrame(() => { raf = 0; check(); }); }

  window.addEventListener('scroll', onScroll, { passive: true });
  scroller?.addEventListener('scroll', onScroll, { passive: true });
  check();
  setTimeout(check, 350);
  setTimeout(check, 1200);
  return cleanup;
}

// A thin scroll-progress bar pinned to the top. Reads scroll from a container
// (the landing scrolls inside .landing, not the window).
export function initScrollProgress(container: HTMLElement | Window = window): () => void {
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);

  const el = container instanceof Window ? document.documentElement : container;
  let raf = 0;
  const update = () => {
    raf = 0;
    const max = el.scrollHeight - el.clientHeight;
    const p = max > 0 ? Math.min(1, el.scrollTop / max) : 0;
    bar.style.transform = `scaleX(${p.toFixed(4)})`;
  };
  const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
  container.addEventListener('scroll', onScroll, { passive: true });
  update();
  return () => {
    container.removeEventListener('scroll', onScroll);
    if (raf) cancelAnimationFrame(raf);
    bar.remove();
  };
}

// Magnetic buttons: gently pull toward the cursor when it is near, spring back on
// leave. Relies on a CSS transition for the spring.
export function initMagnetic(selector: string, strength = 0.32): () => void {
  if (reduced()) return () => {};
  const els = Array.from(document.querySelectorAll<HTMLElement>(selector));
  if (!els.length) return () => {};
  const cleanups = els.map((el) => {
    let raf = 0;
    let tx = 0, ty = 0;
    const apply = () => { raf = 0; el.style.transform = `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px)`; };
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const radius = Math.max(r.width, r.height) * 0.8 + 48;
      if (Math.hypot(dx, dy) < radius) { tx = dx * strength; ty = dy * strength; }
      else { tx = 0; ty = 0; }
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onLeave = () => { tx = 0; ty = 0; el.style.transform = ''; };
    el.classList.add('fx-magnetic');
    window.addEventListener('pointermove', onMove, { passive: true });
    el.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      if (raf) cancelAnimationFrame(raf);
      el.style.transform = '';
      el.classList.remove('fx-magnetic');
    };
  });
  return () => cleanups.forEach((c) => c());
}

// Cursor-tracked spotlight on cards: exposes --mx / --my and toggles .fx-spot-on,
// CSS paints a soft radial highlight that follows the pointer.
export function initSpotlight(selector: string): () => void {
  const els = Array.from(document.querySelectorAll<HTMLElement>(selector));
  if (!els.length) return () => {};
  const cleanups = els.map((el) => {
    let raf = 0;
    let px = 50, py = 50;
    const apply = () => {
      raf = 0;
      el.style.setProperty('--mx', `${px.toFixed(1)}%`);
      el.style.setProperty('--my', `${py.toFixed(1)}%`);
    };
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      px = ((e.clientX - r.left) / r.width) * 100;
      py = ((e.clientY - r.top) / r.height) * 100;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onEnter = () => el.classList.add('fx-spot-on');
    const onLeave = () => el.classList.remove('fx-spot-on');
    el.classList.add('fx-spot');
    el.addEventListener('pointerenter', onEnter);
    el.addEventListener('pointermove', onMove, { passive: true });
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointerenter', onEnter);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      if (raf) cancelAnimationFrame(raf);
      el.classList.remove('fx-spot', 'fx-spot-on');
    };
  });
  return () => cleanups.forEach((c) => c());
}

// Subtle depth: background layers drift slower than the page as the hero scrolls away.
export function initHeroParallax(container: HTMLElement): () => void {
  if (reduced()) return () => {};
  const layers: Array<[HTMLElement, number]> = [];
  const fx = container.querySelector<HTMLElement>('.hero-fx');
  const grid = container.querySelector<HTMLElement>('.hero-grid');
  const panel = container.querySelector<HTMLElement>('.hero-panel');
  if (fx) layers.push([fx, 0.22]);
  if (grid) layers.push([grid, 0.12]);
  if (panel) layers.push([panel, -0.06]);
  if (!layers.length) return () => {};

  let raf = 0;
  const update = () => {
    raf = 0;
    const y = container.scrollTop;
    if (y > window.innerHeight) return; // stop once hero is gone
    for (const [el, rate] of layers) el.style.transform = `translate3d(0, ${(y * rate).toFixed(1)}px, 0)`;
  };
  const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
  container.addEventListener('scroll', onScroll, { passive: true });
  return () => {
    container.removeEventListener('scroll', onScroll);
    if (raf) cancelAnimationFrame(raf);
    for (const [el] of layers) el.style.transform = '';
  };
}
