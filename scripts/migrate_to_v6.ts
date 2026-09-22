import fs from 'fs';
import { Entity, Relationship, EntitySchema, RelationshipSchema } from './schema_v6.js';
import { z } from 'zod';

const v5Path = 'dataset/v5/lineage_v5.json';
const entitiesPath = 'dataset/v6/entities.json';
const relationshipsPath = 'dataset/v6/relationships.json';

const rawData = fs.readFileSync(v5Path, 'utf-8');
const v5Data = JSON.parse(rawData);

const entities: Entity[] = v5Data.languages.map((lang: any) => {
  // Determine if it's a language, compiler, runtime based on notes/id or default to language
  let entity_type: any = 'language';
  if (lang.id.startsWith('tool:')) {
    if (lang.notes?.toLowerCase().includes('compiler') || lang.name.toLowerCase().includes('compiler')) {
      entity_type = 'compiler';
    } else if (lang.notes?.toLowerCase().includes('runtime') || lang.name.toLowerCase().includes('runtime')) {
      entity_type = 'runtime';
    } else if (lang.notes?.toLowerCase().includes('engine') || lang.name.toLowerCase().includes('engine') || lang.name.toLowerCase().includes('vm') || lang.notes?.toLowerCase().includes('vm')) {
      entity_type = 'virtual_machine';
    } else {
      entity_type = 'toolchain';
    }
  }

  const entity: Entity = {
    id: lang.id,
    name: lang.name,
    entity_type,
    first_release_year: lang.first_release_year,
    notes: lang.notes,
    cluster_hint: lang.cluster_hint,
    company: lang.company,
    logo_url: lang.logo_url,
    logo_source: lang.logo_source,
    logo_license: lang.logo_license,
    logo_kind: lang.logo_kind,
  };

  if (entity_type === 'language') {
    entity.language_metadata = {
      current_primary_implementation_language: lang.current_primary_implementation_language,
      paradigm: lang.paradigm,
      typing: lang.typing,
      runtime_model: lang.runtime_model,
      self_hosting: lang.self_hosting,
      garbage_collected: lang.garbage_collected,
      peak_year: lang.peak_year,
      current_users_estimate: lang.current_users_estimate,
    };
  }

  return entity;
});

const relationships: Relationship[] = (v5Data.relationships || v5Data.edges || []).map((rel: any) => {
  return {
    from: rel.from_language,
    to: rel.to_language,
    relationship: rel.relationship,
    start_year: rel.start_year,
    end_year: rel.end_year,
    confidence: rel.confidence,
    evidence_source: rel.evidence_source,
    notes: rel.notes,
  };
});

// Validate migrated data
entities.forEach(e => EntitySchema.parse(e));
relationships.forEach(r => RelationshipSchema.parse(r));

fs.writeFileSync(entitiesPath, JSON.stringify(entities, null, 2));
fs.writeFileSync(relationshipsPath, JSON.stringify(relationships, null, 2));

console.log(`Migrated ${entities.length} entities and ${relationships.length} relationships.`);
