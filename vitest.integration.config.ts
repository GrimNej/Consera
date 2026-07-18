import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['db/tests/**/*.test.ts'],
    environment: 'node',
    globals: false,
    passWithNoTests: false,
  },
});
