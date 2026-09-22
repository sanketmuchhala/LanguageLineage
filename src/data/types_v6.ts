import type { EntityType, Paradigm, Typing, RuntimeModel, RelationshipType } from '../../scripts/schema_v6.js';
import { LogoKindEnum } from '../../scripts/schema_v6.js';
export type LogoKind = import('zod').infer<typeof LogoKindEnum>;
import { z } from 'zod';
import { EntitySchema, RelationshipSchema } from '../../scripts/schema_v6.js';

export type { EntityType, Paradigm, Typing, RuntimeModel, RelationshipType };

export type Entity = z.infer<typeof EntitySchema>;
export type Relationship = z.infer<typeof RelationshipSchema>;

export interface NormalizedEntity extends Entity {
  degree: number;
  cluster: string;
}

export interface NormalizedRelationship extends Relationship {
  id: string; // Computed unique ID
}

export interface NormalizedDataset {
  entities: NormalizedEntity[];
  relationships: NormalizedRelationship[];
  entityMap: Map<string, NormalizedEntity>;
  relationshipMap: Map<string, NormalizedRelationship>;
}

// Filter state
export interface FilterState {
  searchQuery: string;
  confidenceThreshold: number;
  relationshipFilters: Record<RelationshipType, boolean>;
  showSelfLoops: boolean;
  clusterColoring: boolean;
  showAllLabels: boolean;
  layoutMode: 'dag' | 'force' | 'cluster' | 'timeline';
  graphMode: 'implementation' | 'influence' | 'ai_ecosystem' | 'bootstrap' | 'all';
  timelineYear: number | null;
}

// Cytoscape element types
export interface CytoscapeNodeData {
  id: string;
  label: string;
  name: string;
  entity_type: EntityType;
  first_release_year: number | null;
  notes: string | null;
  degree: number;
  cluster: string;
  parent?: string;
  logoUrl?: string | null;
  logoColor?: string | null;
  logoKind?: LogoKind | null;
  logoSize?: string;
  logoOffsetY?: string;
  logoSurface?: string;
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
