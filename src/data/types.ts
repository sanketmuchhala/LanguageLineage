// Core data types from the dataset

export type ClusterType =
  // v2 clusters (legacy)
  | 'c_family'
  | 'jvm_dotnet'
  | 'js_engines'
  | 'functional'
  | 'systems'
  | 'scripting'
  | 'compilers'
  | 'other'
  // v4 clusters
  | 'clr'
  | 'dynamic'
  | 'historical'
  | 'jvm'
  | 'roots'
  | 'scientific'
  | 'tools';

export type RelationshipType =
  | 'compiler_written_in'
  | 'runtime_written_in'
  | 'bootstrap_written_in'
  | 'rewritten_in'
  | 'influenced'
  | 'influenced_by'
  | 'transpiled_to';

// Raw dataset types (from JSON)
export interface RawLanguageNode {
  id: string;
  name: string;
  first_release_year: number;
  current_primary_implementation_language: string;
  paradigm?: string[];
  typing?: string;
  runtime_model?: string;
  self_hosting?: boolean;
  notes: string | null;
  cluster_hint?: string | null;
  // v4 enriched fields
  company?: string | null;
  garbage_collected?: boolean | null;
  logo_url?: string | null;
  peak_year?: number | null;
  current_users_estimate?: 'niche' | 'moderate' | 'large' | 'dominant' | null;
}

export interface RawImplementation {
  id: string;
  name: string;
  implementation_language: string;
  notes: string;
}

export interface RawEdge {
  from_language: string;
  to_language: string;
  relationship: RelationshipType;
  start_year: number | null;
  end_year: number | null;
  confidence: number;
  evidence_source: string;
  notes?: string | null;
}

export interface RawDataset {
  version?: string;
  description?: string;
  languages: RawLanguageNode[];
  implementations?: RawImplementation[];
  edges?: RawEdge[];
  relationships?: RawEdge[]; // v4 uses "relationships" instead of "edges"
}

// Normalized types (after processing)
export interface NormalizedLanguageNode extends RawLanguageNode {
  degree: number;
  cluster: ClusterType;
}

export interface NormalizedEdge extends RawEdge {
  id: string; // Computed unique ID
}

export interface NormalizedDataset {
  languages: NormalizedLanguageNode[];
  implementations: RawImplementation[];
  edges: NormalizedEdge[];
  languageMap: Map<string, NormalizedLanguageNode>;
  edgeMap: Map<string, NormalizedEdge>;
}

// Filter state
export interface FilterState {
  searchQuery: string;
  confidenceThreshold: number;
  relationshipFilters: {
    compiler_written_in: boolean;
    runtime_written_in: boolean;
    bootstrap_written_in: boolean;
    rewritten_in: boolean;
    influenced: boolean;
    influenced_by: boolean;
    transpiled_to: boolean;
  };
  showSelfLoops: boolean;
  clusterColoring: boolean;
  showAllLabels: boolean;
  layoutMode: 'dag' | 'force' | 'cluster' | 'timeline';
  graphMode: 'implementation' | 'influence';
}

// Cytoscape element types
export interface CytoscapeNodeData {
  id: string;
  label: string;
  name: string;
  first_release_year: number;
  current_primary_implementation_language: string;
  notes: string | null;
  degree: number;
  cluster: ClusterType;
  parent?: string;
  logoUrl?: string | null;
  logoColor?: string | null;
  abbr?: string;
}

export interface CytoscapeEdgeData {
  id: string;
  source: string;
  target: string;
  relationship: RelationshipType;
  start_year: number | null;
  end_year: number | null;
  confidence: number;
  evidence_source: string;
  notes?: string | null;
}

export interface CytoscapeNode {
  data: CytoscapeNodeData;
  group: 'nodes';
}

export interface CytoscapeEdge {
  data: CytoscapeEdgeData;
  group: 'edges';
}

export type CytoscapeElement = CytoscapeNode | CytoscapeEdge;

// Validation report types
export interface ValidationIssue {
  type: string;
  message: string;
  data?: unknown;
}

export interface ValidationReport {
  missing_nodes_referenced_by_edges: string[];
  duplicate_ids: string[];
  edges_with_missing_fields: RawEdge[];
  nodes_with_missing_fields: RawLanguageNode[];
  edges_confidence_lt_0_8: Array<{
    from_language: string;
    to_language: string;
    confidence: number;
  }>;
  summary: {
    total_languages: number;
    total_edges: number;
    valid_edges: number;
    warnings: number;
  };
}

// Dataset version info
export interface DatasetVersion {
  version: string;
  path: string;
  label: string;
}
