// Tracks the pointer over an element and exposes its position as CSS custom
// properties (--fx-mx / --fx-my) plus an .fx-cursor-on class. The actual glow is
// painted in CSS, so this stays cheap (one rAF-throttled write per move).

export function initCursorGlow(el: HTMLElement): () => void {
  if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return () => {};
  }

  let raf = 0;
  let px = 0;
  let py = 0;
  let queued = false;

  const apply = () => {
    queued = false;
    el.style.setProperty('--fx-mx', `${px}px`);
    el.style.setProperty('--fx-my', `${py}px`);
  };

  const onMove = (e: PointerEvent) => {
    const rect = el.getBoundingClientRect();
    px = e.clientX - rect.left;
    py = e.clientY - rect.top;
    const inside = px >= 0 && px <= rect.width && py >= 0 && py <= rect.height;
    el.classList.toggle('fx-cursor-on', inside);
    if (!queued) {
      queued = true;
      raf = requestAnimationFrame(apply);
    }
  };

  const onLeave = () => el.classList.remove('fx-cursor-on');

  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerout', onLeave, { passive: true });

  return () => {
    if (raf) cancelAnimationFrame(raf);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerout', onLeave);
    el.classList.remove('fx-cursor-on');
  };
}
