import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.js'],
    environment: 'node',
    setupFiles: ['tests/setup.js'],
    // Make tests more deterministic across platforms
    restoreMocks: true,
    clearMocks: true,
    testTimeout: 10000,
    // Run in a single thread to avoid timer/env leakage between workers
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
  },
});
