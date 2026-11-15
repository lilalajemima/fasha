import { configDefaults, defineConfig } from 'vitest/config'

// `npm test` runs the rules with nothing but fakes. The query tests need a
// real database and run on their own, through `npm run test:db`.
export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, 'src/**/*.db.test.ts'],
  },
})
