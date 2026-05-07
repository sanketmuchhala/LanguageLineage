import type { RawDataset, DatasetVersion } from './types';

export const DATASET_VERSIONS: DatasetVersion[] = [
  { version: 'v1', path: 'dataset/v1/lineage.json', label: 'Version 1.0 (Initial)' },
  { version: 'v2', path: 'dataset/v2/lineage.json', label: 'Version 2.0 (Extended)' },
  { version: 'v4', path: 'dataset/v4/lineage_v4.json', label: 'Version 4.0 (Enriched - 112 languages)' },
];

export async function loadDataset(version: string = 'v1'): Promise<RawDataset> {
  const versionConfig = DATASET_VERSIONS.find((v) => v.version === version);

  if (!versionConfig) {
    throw new Error(`Dataset version "${version}" not found`);
  }

  const basePath = import.meta.env.BASE_URL || '/';
  const fullPath = `${basePath}${versionConfig.path}`.replace(/\/+/g, '/');

  try {
    const response = await fetch(fullPath);

    if (!response.ok) {
      throw new Error(`Failed to fetch dataset: ${response.status} ${response.statusText}`);
    }

    const dataset: RawDataset = await response.json();
    return dataset;
  } catch (error) {
    console.error('Error loading dataset:', error);
    throw error;
  }
}
