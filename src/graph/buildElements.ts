import type {
  NormalizedDataset,
  FilterState,
  CytoscapeElement,
  CytoscapeNode,
  CytoscapeEdge,
} from '../data/types';
import { LOGO_MAP, LOGO_COLORS, getLetterAbbreviation, getLogoPresentation } from '../data/logoMap';
import { getGraphLogoUrl } from '../data/graphLogoAssets';

export function buildCytoscapeElements(
  dataset: NormalizedDataset,
  filters: FilterState
): CytoscapeElement[] {
  const elements: CytoscapeElement[] = [];

  // Filter nodes based on search query
  const visibleNodes = new Set<string>();
  const searchLower = filters.searchQuery.toLowerCase();

  for (const lang of dataset.languages) {
    const matchesSearch =
      !searchLower ||
      lang.id.toLowerCase().includes(searchLower) ||
      lang.name.toLowerCase().includes(searchLower);

    if (matchesSearch) {
      visibleNodes.add(lang.id);
    }
  }

  // Filter edges based on filters
  const visibleEdges: CytoscapeEdge[] = [];

  for (const edge of dataset.edges) {
    // Filter by relationship type, split by graphMode
    const isInfluenceEdge = edge.relationship === 'influenced' || edge.relationship === 'influenced_by';

    if (filters.graphMode === 'influence') {
      if (!isInfluenceEdge) continue;
    } else {
      if (isInfluenceEdge) continue;
      if (!filters.relationshipFilters[edge.relationship]) continue;
    }

    // Filter by confidence threshold
    if (edge.confidence < filters.confidenceThreshold) {
      continue;
    }

    // Filter self-loops if disabled
    if (!filters.showSelfLoops && edge.from_language === edge.to_language) {
      continue;
    }

    // Only include edges where both nodes are visible
    if (!visibleNodes.has(edge.from_language) || !visibleNodes.has(edge.to_language)) {
      continue;
    }

    visibleEdges.push({
      data: {
        id: edge.id,
        source: edge.from_language,
        target: edge.to_language,
        relationship: edge.relationship,
        start_year: edge.start_year,
        end_year: edge.end_year,
        confidence: edge.confidence,
        evidence_source: edge.evidence_source,
      },
      group: 'edges',
    });
  }

  // Add edges first (so they render below nodes)
  elements.push(...visibleEdges);

  // Now add nodes (only those that are visible or have visible edges)
  const nodesWithEdges = new Set<string>();
  for (const edge of visibleEdges) {
    nodesWithEdges.add(edge.data.source);
    nodesWithEdges.add(edge.data.target);
  }

  const isClusterLayout = filters.layoutMode === 'cluster';
  const clusterSet = new Set<string>();

  for (const lang of dataset.languages) {
    // Include node if it matches search OR has visible edges
    if (visibleNodes.has(lang.id) || nodesWithEdges.has(lang.id)) {
      const canonicalLogoUrl = lang.logo_url ?? LOGO_MAP[lang.id] ?? null;
      const logoUrl = getGraphLogoUrl(lang.id, canonicalLogoUrl);
      const logoKind = lang.logo_kind ?? (LOGO_MAP[lang.id] ? 'devicon' : 'none');
      const logoPresentation = getLogoPresentation(lang.id, logoKind);
      const logoColor = LOGO_COLORS[lang.id] ?? null;
      const abbr = canonicalLogoUrl ? '' : getLetterAbbreviation(lang.name);
      const node: CytoscapeNode = {
        data: {
          id: lang.id,
          label: lang.name,
          name: lang.name,
          first_release_year: lang.first_release_year,
          current_primary_implementation_language: lang.current_primary_implementation_language,
          notes: lang.notes,
          degree: lang.degree,
          cluster: lang.cluster,
          parent: isClusterLayout ? `cluster:${lang.cluster}` : undefined,
          logoUrl,
          logoColor,
          logoKind,
          logoSize: logoPresentation.size,
          logoOffsetY: logoPresentation.offsetY,
          logoSurface: logoPresentation.surface,
          abbr,
        },
        group: 'nodes',
      };
      elements.push(node);

      if (isClusterLayout) {
        clusterSet.add(lang.cluster);
      }
    }
  }

  // Add compound parent nodes for cluster layout
  if (isClusterLayout) {
    for (const cluster of clusterSet) {
      elements.push({
        data: { id: `cluster:${cluster}`, label: cluster.replace(/_/g, ' ') },
        group: 'nodes',
      } as any);
    }
  }

  return elements;
}
