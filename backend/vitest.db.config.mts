import { defineConfig } from 'vitest/config'

// One file at a time: they share one database and each starts by emptying it.
export default defineConfig({
  test: {
    include: ['src/**/*.db.test.ts'],
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 30_000,
  },
})
