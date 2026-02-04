/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        '**/*.test.{ts,tsx}',
        '**/*.stories.{ts,tsx}',
        '**/vitest.setup.ts',
        '**/vitest.config.ts',
      ],
    },
  },
});
