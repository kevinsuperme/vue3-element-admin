import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['tests/integration/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov', 'clover'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mock/**',
        '**/dist/**',
        '**/cypress/**',
        '**/.{eslint,prettier}rc.{js,cjs,yml}',
        'src/main.ts',
        'src/assets/**',
        'src/styles/**'
      ],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 85,
        statements: 90
      },
      enabled: true,
      clean: true,
      cleanOnRerun: true,
      all: true,
      include: [
        'src/**/*.{js,ts,vue}',
        '!src/**/*.d.ts',
        '!src/main.ts',
        '!src/assets/**',
        '!src/styles/**'
      ]
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
});
