import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@consera/contracts': fileURLToPath(
        new URL('./packages/contracts/src/index.ts', import.meta.url),
      ),
    },
  },
  test: {
    include: ['sub0/contract-tests/**/*.test.ts'],
    environment: 'node',
    globals: false,
    passWithNoTests: false,
  },
});
