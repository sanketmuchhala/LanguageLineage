import { z } from 'zod';

export const EntityTypeEnum = z.enum([
  'language',
  'compiler',
  'runtime',
  'virtual_machine',
  'toolchain',
  'compiler_infrastructure',
  'ai_framework',
  'ai_compiler',
  'gpu_runtime'
]);

export type EntityType = z.infer<typeof EntityTypeEnum>;

export const ParadigmEnum = z.enum([
  'array', 'concurrent', 'data-driven', 'dataflow', 'declarative',
  'dependent-typed', 'functional', 'generic', 'imperative', 'logic',
  'low-level', 'markup', 'modular', 'multi-paradigm', 'object-oriented',
  'procedural', 'proof-assistant', 'prototype-based', 'query',
  'scientific', 'scripting', 'static-analysis', 'statistical', 'systems', 'tool'
]);

export type Paradigm = z.infer<typeof ParadigmEnum>;

export const TypingEnum = z.enum([
  'static', 'dynamic', 'gradual', 'weak', 'strong', 'none', 'untyped', 'unspecified'
]);

export type Typing = z.infer<typeof TypingEnum>;

export const RuntimeModelEnum = z.enum([
  'compiled', 'interpreted', 'jit_compiled', 'jit', 'bytecode_vm',
  'transpiled', 'none', 'native', 'vm', 'tool'
]);

export type RuntimeModel = z.infer<typeof RuntimeModelEnum>;

export const LogoKindEnum = z.enum(['devicon', 'wikimedia', 'proxy', 'none']);

export const EntitySchema = z.object({
  id: z.string(),
  name: z.string(),
  entity_type: EntityTypeEnum,
  first_release_year: z.number().int().nullable(),

  // Base metadata common to most things
  notes: z.string().nullable().optional(),
  cluster_hint: z.string().nullable().optional(),
  company: z.string().nullable().optional(),

  // Logo metadata
  logo_url: z.string().nullable().optional(),
  logo_source: z.string().nullable().optional(),
  logo_license: z.string().nullable().optional(),
  logo_kind: LogoKindEnum.nullable().optional(),

  // Language specific fields (should be null for non-languages, but keeping flat for now or nested?)
  // Let's keep them optional flat fields to match existing data ease, or nested.
  // The user said: "Keep language-specific fields inside optional language metadata rather than pretending every entity is a language."

  language_metadata: z.object({
    current_primary_implementation_language: z.string().optional(),
    paradigm: z.array(ParadigmEnum).optional(),
    typing: TypingEnum.optional(),
    runtime_model: RuntimeModelEnum.optional(),
    self_hosting: z.boolean().optional(),
    garbage_collected: z.boolean().nullable().optional(),
    peak_year: z.number().int().nullable().optional(),
    current_users_estimate: z.enum(['niche', 'moderate', 'large', 'dominant']).nullable().optional()
  }).optional()
});

export type Entity = z.infer<typeof EntitySchema>;

export const RelationshipTypeEnum = z.enum([
  'influenced',
  'influenced_by',
  'compiler_written_in',
  'runtime_written_in',
  'bootstrap_written_in',
  'transpiled_to',
  'compiles_to',
  'rewritten_in',
  'targets_runtime',
  'runs_on',
  'superseded_by'
]);

export type RelationshipType = z.infer<typeof RelationshipTypeEnum>;

export const RelationshipSchema = z.object({
  from: z.string(),
  to: z.string(),
  relationship: RelationshipTypeEnum,
  start_year: z.number().int().nullable().optional(),
  end_year: z.number().int().nullable().optional(),
  confidence: z.number().min(0).max(1),
  evidence_source: z.string(),
  notes: z.string().nullable().optional(),
});

export type Relationship = z.infer<typeof RelationshipSchema>;
