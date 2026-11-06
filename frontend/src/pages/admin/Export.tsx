import { useState } from 'react'
import { Button, EmptyState } from '../../components/ui'
import { api } from '../../lib/api'
import { parseCsv } from '../../lib/csv'
import { quantity } from '../../lib/format'
import { SECTORS } from '../../lib/sectors'
import { messageFor } from '../../lib/useGet'
import { Period, rangeFor } from './filters'
import '../../styles/workspace.css'
import './Admin.css'

/** Enough to see the shape of the file without scrolling for a minute. */
const PREVIEW_ROWS = 10

type Preview = { header: string[]; rows: string[][]; blob: Blob }

export default function Export() {
  const [grain, setGrain] = useState('events')
  const [mode, setMode] = useState('all')
  const [sector, setSector] = useState('')
  const [preset, setPreset] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [preview, setPreview] = useState<Preview | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  /** Any change to the filters throws the preview away, so what you download
   *  is always the file you were just shown. */
  function change(apply: () => void) {
    apply()
    setPreview(null)
    setError('')
  }

  function choosePreset(value: string) {
    const span = rangeFor(value)

    change(() => {
      setPreset(value)

      if (value !== 'custom') {
        setFrom(span.from)
        setTo(span.to)
      }
    })
  }

  function query(): string {
    const search = new URLSearchParams({ grain })

    if (mode !== 'all') search.set('mode', mode)
    if (sector !== '') search.set('sector', sector)
    if (from !== '') search.set('from', from)
    if (to !== '') search.set('to', to)

    return search.toString()
  }

  /** Fetches the real file. The preview and the download are the same bytes:
   *  the server is asked once, and saving reuses what is already here. */
  async function load(): Promise<Preview | null> {
    setError('')
    setBusy(true)

    try {
      const blob = await api.download(`/admin/report.csv?${query()}`)
      const table = parseCsv(await blob.text())
      const next = { header: table[0] ?? [], rows: table.slice(1), blob }

      setPreview(next)

      return next
    } catch (problem) {
      setError(messageFor(problem))

      return null
    } finally {
      setBusy(false)
    }
  }

  function save(blob: Blob) {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = `fasha-${grain}-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  async function download() {
    const ready = preview ?? (await load())

    if (ready) save(ready.blob)
  }

  const sentence = [
    grain === 'events' ? 'One row per opportunity' : 'One row per person per check in',
    mode === 'all' ? 'of any kind' : mode === 'VIRTUAL' ? 'for virtual work' : 'for work in person',
    sector === '' ? 'in every sector' : `in ${sector}`,
    from === '' && to === ''
      ? 'over all time'
      : `from ${from === '' ? 'the beginning' : from} to ${to === '' ? 'today' : to}`,
  ].join(', ')

  const shown = preview ? preview.rows.slice(0, PREVIEW_ROWS) : []

  return (
    <>
      <section className="banner banner--export">
        <h1 className="banner__title">Export</h1>
      </section>

      <div className="toolbar">
        <span className="toolbar__field">
          <label className="toolbar__label" htmlFor="grain">Rows</label>
          <select
            id="grain"
            className="input toolbar__select"
            value={grain}
            onChange={event => change(() => setGrain(event.target.value))}
          >
            <option value="events">One per event</option>
            <option value="checkins">One per check in</option>
          </select>
        </span>
        <span className="toolbar__field">
          <label className="toolbar__label" htmlFor="export-kind">Kind</label>
          <select
            id="export-kind"
            className="input toolbar__select"
            value={mode}
            onChange={event => change(() => setMode(event.target.value))}
          >
            <option value="all">Any kind</option>
            <option value="PHYSICAL">In person</option>
            <option value="VIRTUAL">Virtual</option>
          </select>
        </span>
        <span className="toolbar__field">
          <label className="toolbar__label" htmlFor="export-sector">Sector</label>
          <select
            id="export-sector"
            className="input toolbar__select"
            value={sector}
            onChange={event => change(() => setSector(event.target.value))}
          >
            <option value="">Any sector</option>
            {SECTORS.map(option => <option key={option} value={option}>{option}</option>)}
          </select>
        </span>
        <Period
          preset={preset}
          from={from}
          to={to}
          onPreset={choosePreset}
          onFrom={value => change(() => setFrom(value))}
          onTo={value => change(() => setTo(value))}
        />
      </div>

      <p className="lede" style={{ marginBottom: 16 }}>{sentence}.</p>

      {error && <p className="error" role="alert">{error}</p>}

      <div className="cluster" style={{ marginBottom: preview ? 20 : 0 }}>
        <Button variant="primary" disabled={busy} onClick={() => load()}>
          {busy ? 'Reading…' : preview ? 'Refresh preview' : 'Preview'}
        </Button>
        <Button disabled={busy} onClick={download}>Download CSV</Button>
      </div>

      {preview && preview.rows.length === 0 && (
        <EmptyState>
          Nothing matches that, so the file would hold its headings and nothing else.
        </EmptyState>
      )}

      {preview && preview.rows.length > 0 && (
        <>
          <p className="toolbar__count" style={{ marginBottom: 10 }}>
            {quantity(preview.rows.length, 'row')} ·{' '}
            {quantity(preview.header.length, 'column')}
            {preview.rows.length > PREVIEW_ROWS && ` · showing the first ${PREVIEW_ROWS}`}
          </p>

          <div className="preview">
            <table className="data">
              <thead>
                <tr>
                  {preview.header.map((heading, column) => (
                    <th key={`${heading}-${column}`}>{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown.map((row, line) => (
                  <tr key={line} className="data__row--plain">
                    {preview.header.map((_, column) => (
                      <td key={column} className="preview__cell">{row[column] ?? ''}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  )
}
