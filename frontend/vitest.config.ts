import { defineConfig } from 'vitest/config'

// Only the pure parts of lib are covered here: they take arguments and return
// values, so they need no browser and the whole suite runs in well under a
// second. The timezone is pinned because several of these format dates, and a
// test that passes in Kigali and fails in GitHub Actions is worse than no test.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    env: { TZ: 'Africa/Kigali' },
  },
})
