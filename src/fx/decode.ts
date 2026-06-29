// One-time "decode" / scramble-resolve on an element's text — characters settle
// left-to-right like source compiling. Operates on text nodes only, so inline
// markup (coloured spans) is preserved. Character count per position is constant,
// and the element height is locked during the run, so layout does not jump.
// Gated by prefers-reduced-motion.

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/<>{}[]=+*#';

interface DecodeOptions {
  duration?: number; // ms
  jitter?: number;   // ms of per-char randomness
}

export function initDecode(el: HTMLElement, options: DecodeOptions = {}): () => void {
  if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return () => {};
  }

  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const items: Array<{ node: Text; final: string }> = [];
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const t = node as Text;
    if (t.nodeValue && t.nodeValue.trim()) items.push({ node: t, final: t.nodeValue });
  }
  if (!items.length) return () => {};

  const total = items.reduce((s, it) => s + it.final.length, 0);
  const duration = options.duration ?? 720;
  const jitter = options.jitter ?? 130;

  // Per-global-index settle time.
  const settle: number[] = [];
  let gi = 0;
  for (const it of items) {
    for (let i = 0; i < it.final.length; i++) {
      settle.push((gi / total) * duration + Math.random() * jitter);
      gi++;
    }
  }

  // Lock height so any sub-pixel width jitter never reflows the page vertically.
  const prevMinHeight = el.style.minHeight;
  el.style.minHeight = `${el.offsetHeight}px`;

  const start = performance.now();
  let raf = 0;

  const finish = () => {
    for (const it of items) it.node.nodeValue = it.final;
    el.style.minHeight = prevMinHeight;
  };

  function frame(now: number) {
    const elapsed = now - start;
    let g = 0;
    let done = true;
    for (const it of items) {
      let s = '';
      for (let i = 0; i < it.final.length; i++) {
        const fc = it.final[i];
        if (fc === ' ' || fc === '\n' || fc === '\t') { s += fc; g++; continue; }
        if (elapsed >= settle[g]) {
          s += fc;
        } else {
          s += GLYPHS[(Math.random() * GLYPHS.length) | 0];
          done = false;
        }
        g++;
      }
      it.node.nodeValue = s;
    }
    if (done) { finish(); return; }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  return () => { cancelAnimationFrame(raf); finish(); };
}
