import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
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
        '**/*.test.ts',
        '**/*.d.ts',
        '**/types/',
        'vite.config.ts',
        'vitest.config.ts',
        'playwright.config.ts',
        'drizzle.config.ts',
        '.github/',
        'proofs/',
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
    include: ['tests/**/*.{test,spec}.{ts,tsx}', 'client/src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', 'e2e'],
    // Handle ESM packages that have directory imports or other Node ESM issues
    server: {
      deps: {
        inline: [
          '@react-three/fiber',
          '@react-three/drei',
          '@react-three/postprocessing',
          'three',
          '@dimforge/rapier2d-compat',
          'miniplex',
          'miniplex-react',
          '@hmans/use-rerender',
        ],
      },
    },
    // Mock modules that have ESM issues in test environment
    deps: {
      optimizer: {
        web: {
          include: ['miniplex-react'],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@shared': path.resolve(__dirname, './shared'),
      '@assets': path.resolve(__dirname, './attached_assets'),
    },
    conditions: ['node', 'default', 'import'],
  },
});
