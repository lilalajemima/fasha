// Load test for the Fasha API.

import { mkdir, writeFile } from 'node:fs/promises'
import { argv } from 'node:process'

function flag(name, fallback) {
  const at = argv.indexOf(`--${name}`)

  return at === -1 ? fallback : argv[at + 1]
}

const BASE = (flag('base', 'http://localhost:4000')).replace(/\/$/, '')
const SECONDS = Number(flag('seconds', '15'))
const LEVELS = String(flag('levels', '10,25,50')).split(',').map(Number)
const FORCE = argv.includes('--force')

const local = /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(BASE)

if (!local && !FORCE) {
  console.error(`Refusing to load test ${BASE}. Pass --force if you really mean it.`)
  process.exit(1)
}

const PASSWORD = 'load-test-password-2026'

async function signUp() {
  const email = `load-${Date.now().toString(36)}@example.invalid`
  const response = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Load Test', email, password: PASSWORD, role: 'VOLUNTEER' }),
  })

  if (!response.ok) {
    throw new Error(`Could not create an account to test with: ${response.status}`)
  }

  const { token } = await response.json()

  return token
}

function percentile(sorted, fraction) {
  if (sorted.length === 0) return 0

  const at = Math.min(sorted.length - 1, Math.ceil(fraction * sorted.length) - 1)

  return sorted[Math.max(0, at)]
}

async function measure(path, headers, connections, seconds) {
  const latencies = []
  const deadline = Date.now() + seconds * 1000
  const statuses = new Map()
  let failed = 0

  async function worker() {
    while (Date.now() < deadline) {
      const started = performance.now()

      try {
        const response = await fetch(`${BASE}${path}`, { headers })

        await response.arrayBuffer()
        latencies.push(performance.now() - started)
        statuses.set(response.status, (statuses.get(response.status) ?? 0) + 1)

        if (!response.ok) failed += 1
      } catch {
        failed += 1
        latencies.push(performance.now() - started)
      }
    }
  }

  const began = performance.now()

  await Promise.all(Array.from({ length: connections }, worker))

  const elapsed = (performance.now() - began) / 1000
  const sorted = [...latencies].sort((a, b) => a - b)

  return {
    path,
    connections,
    requests: latencies.length,
    failed,
    perSecond: latencies.length / elapsed,
    mean: latencies.reduce((total, value) => total + value, 0) / (latencies.length || 1),
    p50: percentile(sorted, 0.5),
    p95: percentile(sorted, 0.95),
    p99: percentile(sorted, 0.99),
    max: sorted[sorted.length - 1] ?? 0,
    statuses: Object.fromEntries(statuses),
  }
}

const ms = value => `${value.toFixed(0)} ms`

function table(rows) {
  const lines = [
    '| Endpoint | Users | Requests | Failed | Req/s | p50 | p95 | p99 | Max |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
  ]

  for (const row of rows) {
    lines.push(
      `| \`${row.path}\` | ${row.connections} | ${row.requests} | ${row.failed} | ` +
      `${row.perSecond.toFixed(1)} | ${ms(row.p50)} | ${ms(row.p95)} | ${ms(row.p99)} | ${ms(row.max)} |`,
    )
  }

  return lines.join('\n')
}

async function main() {
  console.log(`Target      ${BASE}`)
  console.log(`Levels      ${LEVELS.join(', ')} concurrent users`)
  console.log(`Duration    ${SECONDS}s per endpoint per level\n`)

  const token = await signUp()
  const signedIn = { Authorization: `Bearer ${token}` }

  const endpoints = [
    { path: '/catalogue', headers: {}, about: 'no database' },
    { path: '/health', headers: {}, about: 'one SELECT 1' },
    { path: '/opportunities', headers: signedIn, about: 'the real feed' },
  ]

  // Warm up, so the first measured request is not the one opening the pool.
  await measure('/health', {}, 2, 2)

  const rows = []

  for (const level of LEVELS) {
    for (const endpoint of endpoints) {
      process.stdout.write(`  ${String(level).padStart(3)} users  ${endpoint.path.padEnd(16)}`)

      const result = await measure(endpoint.path, endpoint.headers, level, SECONDS)

      rows.push({ ...result, about: endpoint.about })
      console.log(`p95 ${ms(result.p95).padStart(8)}   ${result.perSecond.toFixed(0)} req/s`)
    }
  }

  console.log(`\n${table(rows)}\n`)

  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const folder = 'load-results'

  await mkdir(folder, { recursive: true })
  await writeFile(`${folder}/${stamp}.json`, JSON.stringify({ base: BASE, rows }, null, 2))
  await writeFile(
    `${folder}/${stamp}.md`,
    `# Load test\n\nTarget: ${BASE}\nRun: ${new Date().toUTCString()}\n` +
    `Duration: ${SECONDS}s per endpoint per level\n\n${table(rows)}\n`,
  )

  console.log(`Written to ${folder}/${stamp}.md`)

  const broke = rows.filter(row => row.failed > 0)

  if (broke.length > 0) {
    console.log('\nRequests failed at these levels, which is the number that matters:')
    for (const row of broke) {
      console.log(`  ${row.path} at ${row.connections} users: ${row.failed} of ${row.requests}`)
    }
  }
}

main().catch(problem => {
  console.error(problem.message)
  process.exit(1)
})
