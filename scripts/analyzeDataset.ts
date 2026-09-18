import fs from 'fs';
import { EntitySchema, RelationshipSchema, type Entity, type Relationship } from './schema_v6.js';

function main() {
  const entitiesPath = process.argv[2] || 'dataset/v6/entities.json';
  const relationshipsPath = process.argv[3] || 'dataset/v6/relationships.json';

  console.log('='.repeat(80));
  console.log('DATASET ANALYSIS REPORT (v6)');
  console.log('='.repeat(80));

  const rawEntities = fs.readFileSync(entitiesPath, 'utf-8');
  const rawRelationships = fs.readFileSync(relationshipsPath, 'utf-8');

  const entities = JSON.parse(rawEntities);
  const relationships = JSON.parse(rawRelationships);

  console.log('─'.repeat(80));
  console.log('1. SCHEMA VALIDATION');
  console.log('─'.repeat(80));

  let hasError = false;

  entities.forEach((e: any, idx: number) => {
    const res = EntitySchema.safeParse(e);
    if (!res.success) {
      console.log(`❌ Entity validation failed at index ${idx} (id: ${e.id}):`);
      console.log(res.error.issues);
      hasError = true;
    }
  });

  relationships.forEach((r: any, idx: number) => {
    const res = RelationshipSchema.safeParse(r);
    if (!res.success) {
      console.log(`❌ Relationship validation failed at index ${idx} (from: ${r.from} to: ${r.to}):`);
      console.log(res.error.issues);
      hasError = true;
    }
  });

  if (!hasError) {
    console.log('✅ Schema validation passed for all entities and relationships.');
  }

  console.log('─'.repeat(80));
  console.log('2. REFERENTIAL INTEGRITY');
  console.log('─'.repeat(80));

  const ids = new Set(entities.map((e: any) => e.id));
  const missingRefs = new Set<string>();

  relationships.forEach((r: any) => {
    if (!ids.has(r.from)) missingRefs.add(r.from);
    if (!ids.has(r.to)) missingRefs.add(r.to);
  });

  if (missingRefs.size > 0) {
    console.log(`❌ Missing referenced nodes:`);
    missingRefs.forEach(m => console.log(`  - ${m}`));
  } else {
    console.log('✅ All relationship references are valid.');
  }

  console.log('\nSummary:');
  console.log(`Entities: ${entities.length}`);
  console.log(`Relationships: ${relationships.length}`);

  if (hasError || missingRefs.size > 0) {
    process.exit(1);
  }
}

main();
