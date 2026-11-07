// Turns a folder of Lighthouse JSON reports into one table.
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { argv } from 'node:process'

const folder = argv[2] ?? 'lighthouse-results'

function median(values) {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)

  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle]
}

function pathOf(url) {
  try {
    return new URL(url).pathname || '/'
  } catch {
    return url
  }
}

function read(report) {
  const audit = id => report.audits?.[id]?.numericValue ?? null
  const score = id => {
    const value = report.categories?.[id]?.score

    return typeof value === 'number' ? Math.round(value * 100) : null
  }

  return {
    url: report.finalDisplayedUrl ?? report.finalUrl ?? report.requestedUrl ?? '?',
    form: report.configSettings?.formFactor ?? 'unknown',
    performance: score('performance'),
    accessibility: score('accessibility'),
    bestPractices: score('best-practices'),
    seo: score('seo'),
    lcp: audit('largest-contentful-paint'),
    cls: audit('cumulative-layout-shift'),
    tbt: audit('total-blocking-time'),
    fcp: audit('first-contentful-paint'),
    speedIndex: audit('speed-index'),
  }
}

const ms = value => (value === null ? '—' : `${(value / 1000).toFixed(2)} s`)
const raw = value => (value === null ? '—' : value.toFixed(3))
const pts = value => (value === null ? '—' : String(value))

async function main() {
  const files = (await readdir(folder)).filter(name => name.endsWith('.json'))

  if (files.length === 0) {
    console.error(`No JSON reports in ${folder}`)
    process.exit(1)
  }

  const runs = []

  for (const file of files) {
    try {
      const report = JSON.parse(await readFile(`${folder}/${file}`, 'utf8'))

      if (!report.categories || !report.audits) throw new Error('not a report')

      runs.push(read(report))
    } catch {
      console.error(`Skipped ${file}: not a Lighthouse report`)
    }
  }

  const groups = new Map()

  for (const run of runs) {
    const key = `${pathOf(run.url)}|${run.form}`

    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(run)
  }

  const rows = [...groups.entries()]
    .map(([key, group]) => {
      const [path, form] = key.split('|')
      const of = field => median(group.map(run => run[field]).filter(value => value !== null))

      return {
        path,
        form,
        runs: group.length,
        performance: of('performance'),
        accessibility: of('accessibility'),
        bestPractices: of('bestPractices'),
        seo: of('seo'),
        fcp: of('fcp'),
        lcp: of('lcp'),
        speedIndex: of('speedIndex'),
        tbt: of('tbt'),
        cls: of('cls'),
      }
    })
    .sort((a, b) => a.path.localeCompare(b.path) || a.form.localeCompare(b.form))

  const lines = [
    '| Page | Device | Runs | Perf | A11y | Best practices | SEO | FCP | LCP | Speed index | TBT | CLS |',
    '| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
  ]

  for (const row of rows) {
    lines.push(
      `| \`${row.path}\` | ${row.form} | ${row.runs} | ${pts(row.performance)} | ` +
      `${pts(row.accessibility)} | ${pts(row.bestPractices)} | ${pts(row.seo)} | ` +
      `${ms(row.fcp)} | ${ms(row.lcp)} | ${ms(row.speedIndex)} | ` +
      `${row.tbt === null ? '—' : `${row.tbt.toFixed(0)} ms`} | ${raw(row.cls)} |`,
    )
  }

  const table = lines.join('\n')

  console.log(`\n${table}\n`)

  await writeFile(`${folder}/summary.md`, `# Lighthouse\n\n${table}\n`)
  console.log(`Written to ${folder}/summary.md`)

  // Google's own thresholds, so the judgement is not mine.
  const slow = rows.filter(row => row.lcp !== null && row.lcp > 2500)
  const jumpy = rows.filter(row => row.cls !== null && row.cls > 0.1)

  if (slow.length > 0) {
    console.log('\nLCP over 2.5s, which is the line Google calls "needs improvement":')
    for (const row of slow) console.log(`  ${row.path} (${row.form}) ${ms(row.lcp)}`)
  }

  if (jumpy.length > 0) {
    console.log('\nCLS over 0.1, meaning the page moves under the reader:')
    for (const row of jumpy) console.log(`  ${row.path} (${row.form}) ${raw(row.cls)}`)
  }
}

main().catch(problem => {
  console.error(problem.message)
  process.exit(1)
})
