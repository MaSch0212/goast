import { configDefaults, defineConfig } from 'vitest/config';

const exclude = [
  ...configDefaults.exclude,
  '**/dist/**',
  'npm/**',
  'test/output/**',
  'test/compile/**',
  'test/wire/**',
];

export default defineConfig({
  resolve: {
    conditions: ['source'],
  },
  ssr: {
    resolve: {
      conditions: ['source'],
    },
  },
  test: {
    // Compile and integration tiers drive Docker and Gradle for minutes per test.
    testTimeout: 30 * 60 * 1000,
    hookTimeout: 30 * 60 * 1000,
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['packages/**/*.test.ts', 'test/harness/**/*.test.ts', 'test/cases/**/*.test.ts'],
          exclude: [...exclude, 'test/harness/docker.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          // Shares containers, Gradle caches and snapshot trees between files.
          name: 'e2e',
          include: [
            'test/output-tests/**/*.test.ts',
            'test/compile-tests/**/*.test.ts',
            'test/integration/**/*.test.ts',
            'test/integration-tests/**/*.test.ts',
            'test/harness/docker.test.ts',
          ],
          exclude,
          fileParallelism: false,
        },
      },
    ],
  },
});
