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
  // unreliable against that fixed container — so trigger on scroll position.
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
