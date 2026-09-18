import fs from 'fs';
import { EntitySchema, RelationshipSchema } from './schema_v6.js';

const entitiesPath = 'dataset/v6/entities.json';
const relationshipsPath = 'dataset/v6/relationships.json';

const entities = JSON.parse(fs.readFileSync(entitiesPath, 'utf-8'));
const relationships = JSON.parse(fs.readFileSync(relationshipsPath, 'utf-8'));

let counts = {
  total: entities.length,
  language: 0,
  compiler: 0,
  runtime: 0,
  virtual_machine: 0,
  toolchain: 0,
  compiler_infrastructure: 0,
  ai_framework: 0,
  ai_compiler: 0,
  gpu_runtime: 0,
  no_source: 0,
};

entities.forEach((e: any) => {
  if (counts[e.entity_type as keyof typeof counts] !== undefined) {
    (counts as any)[e.entity_type]++;
  }
});

let relCounts = {
  total: relationships.length,
  low_confidence: 0,
  no_evidence: 0
};

let relTypes: Record<string, number> = {};

relationships.forEach((r: any) => {
  relTypes[r.relationship] = (relTypes[r.relationship] || 0) + 1;
  if (r.confidence < 0.8) relCounts.low_confidence++;
  if (!r.evidence_source) relCounts.no_evidence++;
});

console.log('Entities Breakdown:', counts);
console.log('Relationships Breakdown:', relCounts);
console.log('Relationship Types:', relTypes);
