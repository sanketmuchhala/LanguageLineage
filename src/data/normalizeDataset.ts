import type {
  RawDataset,
  NormalizedDataset,
  NormalizedLanguageNode,
  NormalizedEdge,
  ClusterType,
} from './types';

// Cluster assignment logic (preserved from original index.html)
function assignCluster(node: { id: string; name: string }): ClusterType {
  const id = node.id.toLowerCase();
  const name = node.name.toLowerCase();

  // C family
  if (
    id.includes('lang:c') ||
    id.includes('lang:b') ||
    id.includes('bcpl') ||
    name.includes('c++') ||
    name.includes('swift')
  ) {
    return 'c_family';
  }

  // JVM/.NET
  if (
    id.includes('java') ||
    id.includes('kotlin') ||
    id.includes('csharp') ||
    id.includes('dotnet') ||
    id.includes('roslyn') ||
    id.includes('hotspot')
  ) {
    return 'jvm_dotnet';
  }

  // JavaScript engines
  if (
    id.includes('javascript') ||
    id.includes('v8') ||
    id.includes('spidermonkey') ||
    id.includes('javascriptcore')
  ) {
    return 'js_engines';
  }

  // Functional languages
  if (id.includes('ocaml') || id.includes('haskell') || id.includes('ghc')) {
    return 'functional';
  }

  // Systems languages
  if (id.includes('rust') || id.includes('go') || id.includes('mrustc')) {
    return 'systems';
  }

  // Scripting languages
  if (id.includes('python') || id.includes('ruby')) {
    return 'scripting';
  }

  // Compiler infrastructure
  if (id.includes('gcc') || id.includes('llvm') || id.includes('clang')) {
    return 'compilers';
  }

  return 'other';
}

export function normalizeDataset(rawDataset: RawDataset): NormalizedDataset {
  // Support both v2 (edges) and v4 (relationships)
  const edges = rawDataset.relationships || rawDataset.edges || [];

  // Calculate degree for each language (count incoming + outgoing edges)
  const degreeMap = new Map<string, number>();

  for (const lang of rawDataset.languages) {
    degreeMap.set(lang.id, 0);
  }

  for (const edge of edges) {
    const fromDegree = degreeMap.get(edge.from_language) || 0;
    const toDegree = degreeMap.get(edge.to_language) || 0;
    degreeMap.set(edge.from_language, fromDegree + 1);
    degreeMap.set(edge.to_language, toDegree + 1);
  }

  // Create normalized languages with degree and cluster
  const normalizedLanguages: NormalizedLanguageNode[] = rawDataset.languages.map((lang) => ({
    ...lang,
    degree: degreeMap.get(lang.id) || 0,
    // Use cluster_hint from v4, or compute for v2
    cluster: (lang.cluster_hint as ClusterType) || assignCluster(lang),
  }));

  // Create normalized edges with unique IDs
  const normalizedEdges: NormalizedEdge[] = edges.map((edge, index) => ({
    ...edge,
    id: `edge-${index}-${edge.from_language}-${edge.to_language}`,
  }));

  // Create lookup maps
  const languageMap = new Map<string, NormalizedLanguageNode>();
  for (const lang of normalizedLanguages) {
    languageMap.set(lang.id, lang);
  }

  const edgeMap = new Map<string, NormalizedEdge>();
  for (const edge of normalizedEdges) {
    edgeMap.set(edge.id, edge);
  }

  return {
    languages: normalizedLanguages,
    implementations: rawDataset.implementations || [],
    edges: normalizedEdges,
    languageMap,
    edgeMap,
  };
}
