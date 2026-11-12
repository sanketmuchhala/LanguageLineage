import { defineConfig } from 'vitest/config';
import { datasetCounts } from './scripts/datasetCounts';

export default defineConfig({
  define: { __DATASET_COUNTS__: JSON.stringify(datasetCounts(__dirname)) },
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'scripts/**/*.test.ts'],
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
  },
});
