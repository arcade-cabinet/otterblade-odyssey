import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: [path.resolve(__dirname, './tests/setup.ts')],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        'tests/',
        'e2e/',
        '**/*.spec.ts',
        '**/*.spec.js',
        '**/*.test.ts',
        '**/*.test.js',
        '**/*.d.ts',
        '**/types/',
        'vite.config.ts',
        'vitest.config.ts',
        'playwright.config.ts',
        'drizzle.config.ts',
        '.github/',
        'proofs/',
        'pocs/',
        'attached_assets/',
        'server/',
        'script/',
      ],
      all: true,
      lines: 25,
      functions: 25,
      branches: 25,
      statements: 25,
      // Output coverage to standard location for Coveralls
      reportsDirectory: './coverage',
    },
    // Test both legacy TypeScript and new JavaScript code
    include: [
      'tests/**/*.{test,spec}.{ts,tsx,js,jsx}',
      'client/src/**/*.{test,spec}.{ts,tsx}',
      'game/src/**/*.{test,spec}.{js,jsx}',
    ],
    exclude: [
      'node_modules',
      'dist',
      'e2e',
      'tests/unit/react-components.test.tsx',
      'tests/unit/ecs.test.ts',
    ],
    // Handle ESM packages that have directory imports or other Node ESM issues
    server: {
      deps: {
        inline: ['matter-js', 'yuka'],
      },
    },
    // Mock modules that have ESM issues in test environment
    deps: {
      optimizer: {
        web: {
          include: ['matter-js'],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@shared': path.resolve(__dirname, './shared'),
      '@game': path.resolve(__dirname, './game/src'),
    },
    conditions: ['node', 'default', 'import'],
  },
});
