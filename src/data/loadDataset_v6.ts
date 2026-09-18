import type { Entity, Relationship, NormalizedDataset } from './types_v6';
import { normalizeDataset } from './normalizeDataset_v6';

export async function loadDatasetV6(): Promise<NormalizedDataset> {
  const basePath = import.meta.env.BASE_URL || '/';

  const entitiesPath = `${basePath}dataset/v6/entities.json`.replace(/\/+/g, '/');
  const relationshipsPath = `${basePath}dataset/v6/relationships.json`.replace(/\/+/g, '/');

  try {
    const [entitiesRes, relationshipsRes] = await Promise.all([
      fetch(entitiesPath),
      fetch(relationshipsPath)
    ]);

    if (!entitiesRes.ok || !relationshipsRes.ok) {
      throw new Error('Failed to fetch v6 dataset components');
    }

    const entities: Entity[] = await entitiesRes.json();
    const relationships: Relationship[] = await relationshipsRes.json();

    return normalizeDataset(entities, relationships);
  } catch (error) {
    console.error('Error loading v6 dataset:', error);
    throw error;
  }
}
