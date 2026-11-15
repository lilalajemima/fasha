// Runs the query tests against a throwaway Postgres: applies every migration
// to it, then runs src/**/*.db.test.ts. Refuses anything that is not on this
// computer, because the tests empty every table before they start.
//
//   docker compose -f docker-compose.test.yml up -d
//   TEST_DATABASE_URL=postgresql://fasha:fasha@localhost:5433/fasha_test npm run test:db
//
// TEST_DATABASE_URL can also go in .env.
import 'dotenv/config'
import { spawnSync } from 'node:child_process'

const url = process.env.TEST_DATABASE_URL
const LOCAL_HOSTS = ['localhost', '127.0.0.1', '::1', '[::1]']

function isLocal(address) {
  try {
    const parsed = new URL(address)

    return ['postgres:', 'postgresql:'].includes(parsed.protocol) && LOCAL_HOSTS.includes(parsed.hostname)
  } catch {
    return false
  }
}

if (!url || !isLocal(url)) {
  console.error('Set TEST_DATABASE_URL to a Postgres on this computer, for example')
  console.error('postgresql://fasha:fasha@localhost:5433/fasha_test')
  console.error('Supabase is refused on purpose: these tests empty every table.')
  process.exit(1)
}

// Both database settings point at the test database for these two commands
// only, whatever .env says. dotenv never overrides a variable already set.
const env = {
  ...process.env,
  DATABASE_URL: url,
  DIRECT_URL: url,
  JWT_SECRET: process.env.JWT_SECRET || 'test-only-secret',
}

function run(commandLine) {
  const result = spawnSync(commandLine, { stdio: 'inherit', env, shell: true })

  if (result.status !== 0) process.exit(result.status ?? 1)
}

run('npx prisma migrate deploy')
run('npx vitest run --config vitest.db.config.mts')