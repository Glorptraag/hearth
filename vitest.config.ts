import { defineConfig } from 'vitest/config';
import path from 'node:path';

/**
 * UNIT TEST CONFIG
 *
 * Fast. Mocks everything external (Clerk, DB, Anthropic, Sanity, Blob).
 * Use for: pure functions, component logic, API handler branching.
 * Run with: `npm test` or `npm run test:watch`
 *
 * For tests that hit a real Postgres, see vitest.integration.config.ts.
 */
export default defineConfig({
  test: {
    name: 'unit',
    setupFiles: ['./vitest.setup.ts'],
    environment: 'jsdom',
    globals: true,

    // Only discover unit tests. Integration tests use a different extension
    // (*.integration.test.ts) and are excluded here so `npm test` stays fast.
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: [
      'node_modules',
      'drizzle',
      '.next',
      'src/sanity/schemas/**',
      'src/**/*.integration.test.{ts,tsx}',
      'prototypes',
    ],

    // Threads are the default pool in Vitest 4; no explicit config needed.

    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      // Coverage only applies to source files, not tests/fixtures themselves.
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.integration.test.{ts,tsx}',
        'src/test/**',
        'src/sanity/schemas/**',
        'src/**/*.d.ts',
      ],
    },
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
