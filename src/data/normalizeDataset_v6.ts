import type { Entity, Relationship, NormalizedEntity, NormalizedRelationship, NormalizedDataset } from './types_v6';
import { LOGO_MAP } from './logoMap';

export function normalizeDataset(entities: Entity[], relationships: Relationship[]): NormalizedDataset {
  const entityMap = new Map<string, NormalizedEntity>();
  const relationshipMap = new Map<string, NormalizedRelationship>();

  // First pass: create normalized entities
  const normalizedEntities: NormalizedEntity[] = entities.map(e => {
    // If no logo is provided in data, try to use the logo map fallback if one exists
    let logoUrl = e.logo_url;




    if (!logoUrl && LOGO_MAP[e.id]) {
      const asset = LOGO_MAP[e.id];
      if (asset.source === 'devicon') {
         logoUrl = `https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/${asset.path}`;
      } else {
         logoUrl = asset.path; // Assuming local or fully qualified for others in map
      }



    } else if (e.logo_kind === 'devicon' && e.logo_url) {
      // It's a devicon, set default size etc if we know it

    } else if (e.logo_kind === 'wikimedia' && e.logo_url) {

    }

    return {
      ...e,
      degree: 0,
      cluster: e.cluster_hint || 'other',
      logoUrl: logoUrl,
      // Just tacking some defaults onto the entity for convenience, cytoscape data will map it.
    };
  });

  normalizedEntities.forEach(e => entityMap.set(e.id, e));

  // Second pass: normalize relationships and compute degree
  const normalizedRelationships: NormalizedRelationship[] = relationships.map((r, i) => {
    const id = `rel_${i}_${r.from}_${r.to}_${r.relationship}`;

    // Update degrees
    const source = entityMap.get(r.from);
    const target = entityMap.get(r.to);

    if (source) source.degree++;
    if (target) target.degree++;

    const normRel = {
      ...r,
      id
    };
    relationshipMap.set(id, normRel);
    return normRel;
  });

  return {
    entities: normalizedEntities,
    relationships: normalizedRelationships,
    entityMap,
    relationshipMap
  };
}
