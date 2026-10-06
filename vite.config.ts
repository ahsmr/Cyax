import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    // Regular test suite only matches .spec or .test files
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    benchmark: {
      // Benchmark suite only matches .bench files
      include: ['src/**/*.bench.{ts,tsx}'],
    },
  },
});