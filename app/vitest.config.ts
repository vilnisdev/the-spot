import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    include: ['tests/integration/**/*.test.ts', 'tests/unit/**/*.test.ts'],
    environment: 'node',
    setupFiles: ['./tests/integration/setup.ts'],
    testTimeout: 180000,
    hookTimeout: 180000,
    fileParallelism: false,
    sequence: { concurrent: false },
  },
})
