/** Width of an open side panel overlapping the canvas's left edge, in pixels. */
export function panelInset(container: HTMLElement | null | undefined): number {
  if (!container || typeof document === 'undefined') return 0;
  const panel = document.querySelector('.sidebar:not(.collapsed)');
  if (!panel) return 0;
  return Math.max(0, panel.getBoundingClientRect().right - container.getBoundingClientRect().left);
}
