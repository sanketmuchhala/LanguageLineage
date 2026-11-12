/**
 * The /explore URL for what the explorer currently shows, so the address bar is always a
 * shareable link: the selected node, the AI infrastructure view, and an overlaid AI path
 * with its choices. Read back by GraphExplorer's deep-link handling (node, view, path).
 */
export interface ExploreUrlState {
  selectedNodeId: string | null;
  ai: boolean;
  aiOverlay: { slug: string; selection: Record<string, string> } | null;
}

export function exploreUrl({ selectedNodeId, ai, aiOverlay }: ExploreUrlState): string {
  const q = new URLSearchParams();
  if (selectedNodeId) q.set('node', selectedNodeId);
  if (ai) q.set('view', 'ai');
  if (ai && aiOverlay) {
    q.set('path', aiOverlay.slug);
    for (const [dim, value] of Object.entries(aiOverlay.selection)) q.set(dim, value);
  }
  const query = q.toString();
  return query ? `/explore?${query}` : '/explore';
}
