import { z } from 'zod';

// Paradigm enum
export const ParadigmEnum = z.enum([
  'array',
  'concurrent',
  'data-driven',
  'dataflow',
  'declarative',
  'dependent-typed',
  'functional',
  'generic',
  'imperative',
  'logic',
  'low-level',
  'markup',
  'modular',
  'multi-paradigm',
  'object-oriented',
  'object_oriented',
  'procedural',
  'proof-assistant',
  'prototype-based',
  'query',
  'scientific',
  'scripting',
  'static-analysis',
  'statistical',
  'systems',
  'tool',
]);

export type Paradigm = z.infer<typeof ParadigmEnum>;

// Typing enum
export const TypingEnum = z.enum([
  'static',
  'dynamic',
  'gradual',
  'weak',
  'strong',
  'none',
  'untyped',
  'unspecified',
]);

export type Typing = z.infer<typeof TypingEnum>;

// Runtime model enum
export const RuntimeModelEnum = z.enum([
  'compiled',
  'interpreted',
  'jit_compiled',
  'jit',
  'bytecode_vm',
  'transpiled',
  'none',
  'native',
  'vm',
  'tool',
]);

export type RuntimeModel = z.infer<typeof RuntimeModelEnum>;

// Current users estimate enum
export const CurrentUsersEstimateEnum = z.enum(['niche', 'moderate', 'large', 'dominant']);

export type CurrentUsersEstimate = z.infer<typeof CurrentUsersEstimateEnum>;

// Relationship type enum
export const RelationshipTypeEnum = z.enum([
  'influenced',
  'influenced_by', // Don't auto-create reverse edges
  'compiler_written_in',
  'runtime_written_in',
  'bootstrap_written_in',
  'transpiled_to',
  'rewritten_in',
]);

export type RelationshipType = z.infer<typeof RelationshipTypeEnum>;

// Language schema (15 fields: 10 existing + 5 new)
export const LanguageSchema = z.object({
  // Existing fields (10)
  id: z.string(),
  name: z.string(),
  first_release_year: z.number().int(),
  current_primary_implementation_language: z.string(),
  paradigm: z.array(ParadigmEnum),
  typing: TypingEnum,
  runtime_model: RuntimeModelEnum,
  self_hosting: z.boolean(),
  notes: z.string().nullable(),
  cluster_hint: z.string().nullable(),
  // New fields (5)
  company: z.string().nullable(),
  garbage_collected: z.boolean().nullable(),
  logo_url: z.null(),
  peak_year: z.number().int().nullable(),
  current_users_estimate: CurrentUsersEstimateEnum.nullable(),
});

export type Language = z.infer<typeof LanguageSchema>;

// Relationship schema (8 fields)
export const RelationshipSchema = z.object({
  from_language: z.string(),
  to_language: z.string(),
  relationship: RelationshipTypeEnum,
  start_year: z.number().int().nullable(),
  end_year: z.number().int().nullable(),
  confidence: z.number().min(0).max(1),
  evidence_source: z.string(),
  notes: z.string().nullable(),
});

export type Relationship = z.infer<typeof RelationshipSchema>;

// Dataset schema
export const DatasetSchema = z.object({
  version: z.string(),
  description: z.string(),
  languages: z.array(LanguageSchema),
  relationships: z.array(RelationshipSchema),
});

export type Dataset = z.infer<typeof DatasetSchema>;
