import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import HelpButton from '../../components/HelpButton'
import { Loaded } from '../../components/Loader'
import Logo from '../../components/Logo'
import { Button, EmptyState, StatusBadge, Tabs, Tag, TextField } from '../../components/ui'
import { useAuth } from '../../auth/AuthContext'
import { api } from '../../lib/api'
import { longDate, meta, quantity, sentenceCase } from '../../lib/format'
import { PER_PAGE, pageCount, pageNumbers, pageSlice } from '../../lib/paging'
import { SECTORS } from '../../lib/sectors'
import type { ActivityRow, OpportunityView } from '../../lib/types'
import { messageFor, useGet } from '../../lib/useGet'
import { OVERSIGHT_GUIDE } from './guide'
import '../../styles/workspace.css'

const PRESETS = [
  { id: 'month', label: 'This month' },
  { id: '30', label: 'Last 30 days' },
  { id: '90', label: 'Last 3 months' },
  { id: 'all', label: 'All time' },
  { id: 'custom', label: 'Custom' },
]

/** Local date, not UTC: in Kigali an ISO conversion lands on the day before. */
function isoDay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${date.getFullYear()}-${month}-${day}`
}

function rangeFor(preset: string): { from: string; to: string } {
  const today = new Date()

  if (preset === 'month') {
    return { from: isoDay(new Date(today.getFullYear(), today.getMonth(), 1)), to: isoDay(today) }
  }

  if (preset === '30' || preset === '90') {
    const back = new Date(today)

    back.setDate(back.getDate() - Number(preset))

    return { from: isoDay(back), to: isoDay(today) }
  }

  return { from: '', to: '' }
}

/** One control for the period, with the two date fields only when they are needed. */
function Period({ preset, from, to, onPreset, onFrom, onTo }: {
  preset: string
  from: string
  to: string
  onPreset: (value: string) => void
  onFrom: (value: string) => void
  onTo: (value: string) => void
}) {
  return (
    <>
      <span className="toolbar__field">
        <label className="toolbar__label" htmlFor="period">Period</label>
        <select
          id="period"
          className="input toolbar__select"
          value={preset}
          onChange={event => onPreset(event.target.value)}
        >
          {PRESETS.map(option => (
            <option key={option.id} value={option.id}>{option.label}</option>
          ))}
        </select>
      </span>

      {preset === 'custom' && (
        <>
          <span className="toolbar__field">
            <label className="toolbar__label" htmlFor="from">From</label>
            <input
              id="from"
              className="input toolbar__select"
              type="date"
              value={from}
              onChange={event => onFrom(event.target.value)}
            />
          </span>
          <span className="toolbar__field">
            <label className="toolbar__label" htmlFor="to">To</label>
            <input
              id="to"
              className="input toolbar__select"
              type="date"
              value={to}
              onChange={event => onTo(event.target.value)}
            />
          </span>
        </>
      )}
    </>
  )
}

function kindOf(mode: string): string {
  return mode === 'VIRTUAL' ? 'Virtual' : 'In person'
}

function Approvals() {
  const queue = useGet<OpportunityView[]>('/opportunities/pending')
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState('all')
  const [sector, setSector] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')

  async function decide(id: string, decision: 'APPROVE' | 'REJECT') {
    setError('')
    setBusy(id)

    try {
      await api.patch(`/opportunities/${id}/status`, {
        decision,
        reviewNote: notes[id]?.trim() ? notes[id].trim() : null,
      })
      queue.reload()
    } catch (problem) {
      setError(messageFor(problem))
    } finally {
      setBusy('')
    }
  }

  const words = query.trim().toLowerCase()

  return (
    <>
      <div className="toolbar">
        <input
          className="input toolbar__search"
          placeholder="Search by title, resident or place"
          aria-label="Search the queue"
          value={query}
          onChange={event => setQuery(event.target.value)}
        />
        <select
          className="input toolbar__select"
          aria-label="Kind of work"
          value={mode}
          onChange={event => setMode(event.target.value)}
        >
          <option value="all">Any kind</option>
          <option value="PHYSICAL">In person</option>
          <option value="VIRTUAL">Virtual</option>
        </select>
        <select
          className="input toolbar__select"
          aria-label="Sector"
          value={sector}
          onChange={event => setSector(event.target.value)}
        >
          <option value="">Any sector</option>
          {SECTORS.map(option => <option key={option} value={option}>{option}</option>)}
        </select>
      </div>

      {error && <p className="error" role="alert">{error}</p>}

      <Loaded state={queue} what="the queue">
        {items => {
          const visible = items
            .filter(item => mode === 'all' || item.mode === mode)
            .filter(item => sector === '' || item.sector === sector)
            .filter(
              item =>
                words === '' ||
                `${item.title} ${item.creator.name} ${item.sector ?? ''} ${item.location ?? ''}`
                  .toLowerCase()
                  .includes(words),
            )

          if (visible.length === 0) {
            return (
              <EmptyState>
                {items.length === 0
                  ? 'Nothing is waiting for a decision.'
                  : 'Nothing in the queue matches that.'}
              </EmptyState>
            )
          }

          return (
            <div className="cards">
              {visible.map(item => (
                <article key={item.id} className="review">
                  <div className="review__head">
                    <div>
                      <h3 className="review__title">{item.title}</h3>
                      <div className="data__meta">
                        {meta(item.creator.name, kindOf(item.mode), item.sector)}
                      </div>
                      <div className="data__meta">
                        {meta(
                          item.location,
                          `up to ${quantity(item.maxCapacity, 'volunteer')}`,
                          `apply by ${longDate(item.applicationDeadline)}`,
                        )}
                      </div>
                    </div>
                    <StatusBadge tone="warn">Awaiting review</StatusBadge>
                  </div>

                  <p className="review__body">{item.description}</p>

                  <div className="cluster" style={{ marginBottom: 14 }}>
                    {[...item.requiredSkills, ...item.categories].map(tag => (
                      <Tag key={tag}>{tag}</Tag>
                    ))}
                  </div>

                  <div className="review__foot">
                    <TextField
                      id={`note-${item.id}`}
                      label="Feedback, optional"
                      placeholder="Sent with a rejection."
                      value={notes[item.id] ?? ''}
                      onChange={event => setNotes({ ...notes, [item.id]: event.target.value })}
                    />

                    <div className="cluster">
                      <Button
                        variant="primary"
                        className="btn--small"
                        disabled={busy === item.id}
                        onClick={() => decide(item.id, 'APPROVE')}
                      >
                        Approve and publish
                      </Button>
                      <Button
                        className="btn--small btn--danger"
                        disabled={busy === item.id}
                        onClick={() => decide(item.id, 'REJECT')}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )
        }}
      </Loaded>
    </>
  )
}

function Activity() {
  const activity = useGet<ActivityRow[]>('/admin/activity')
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState('all')
  const [sector, setSector] = useState('')
  const [preset, setPreset] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)

  function change(apply: () => void) {
    apply()
    setPage(1)
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

  const words = query.trim().toLowerCase()

  return (
    <>
      <div className="toolbar">
        <input
          className="input toolbar__search"
          placeholder="Search by opportunity, organiser or place"
          aria-label="Search every opportunity"
          value={query}
          onChange={event => change(() => setQuery(event.target.value))}
        />
        <span className="toolbar__field">
          <label className="toolbar__label" htmlFor="activity-kind">Kind</label>
          <select
            id="activity-kind"
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
          <label className="toolbar__label" htmlFor="activity-sector">Sector</label>
          <select
            id="activity-sector"
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

      <Loaded state={activity} what="activity">
        {rows => {
          const visible = rows
            .filter(row => mode === 'all' || row.mode === mode)
            .filter(row => sector === '' || (row.sector ?? '') === sector)
            .filter(row => {
              const day = row.happenedAt.slice(0, 10)

              if (from !== '' && day < from) return false
              if (to !== '' && day > to) return false

              return true
            })
            .filter(
              row =>
                words === '' ||
                `${row.title} ${row.organiser} ${row.sector ?? ''} ${row.location ?? ''}`
                  .toLowerCase()
                  .includes(words),
            )

          const pages = pageCount(visible.length, PER_PAGE)
          const current = Math.min(page, pages)
          const shown = pageSlice(visible, current, PER_PAGE)

          if (visible.length === 0) {
            return <EmptyState>Nothing matches that.</EmptyState>
          }

          return (
            <>
              <p className="toolbar__count" style={{ marginBottom: 10 }}>
                {quantity(visible.length, 'opportunity', 'opportunities')}
              </p>

              <table className="data">
                <thead>
                  <tr>
                    <th>Opportunity</th>
                    <th>Happened</th>
                    <th>Where</th>
                    <th>People</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map(row => (
                    <tr key={row.id} className="data__row--plain">
                      <td>
                        <span className="data__title">{row.title}</span>
                        <div className="data__meta">
                          {row.organiser} ·{' '}
                          {row.organiserRole === 'VOLUNTEER'
                            ? 'Citizen initiative'
                            : 'Organisation'}
                        </div>
                      </td>
                      <td>
                        {longDate(row.happenedAt)}
                        <div className="data__meta">{kindOf(row.mode)}</div>
                      </td>
                      <td>
                        {row.sector ?? '—'}
                        <div className="data__meta">{row.location ?? 'Online'}</div>
                      </td>
                      <td>
                        {row.mode === 'VIRTUAL'
                          ? `${row.delivered} delivered`
                          : `${row.checkedIn} turned up`}
                        <div className="data__meta">
                          {row.applications} applied · {row.accepted} accepted
                        </div>
                      </td>
                      <td>{sentenceCase(row.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {pages > 1 && (
                <div className="pager">
                  <span className="pager__info">
                    {(current - 1) * PER_PAGE + 1}–{(current - 1) * PER_PAGE + shown.length} of{' '}
                    {visible.length}
                  </span>
                  <button
                    type="button"
                    disabled={current === 1}
                    aria-label="Previous page"
                    onClick={() => setPage(current - 1)}
                  >
                    ‹
                  </button>
                  {pageNumbers(current, pages).map((step, index) =>
                    step === 'gap' ? (
                      <span key={`gap-${index}`} className="pager__gap">…</span>
                    ) : (
                      <button
                        key={step}
                        type="button"
                        aria-current={step === current ? 'page' : undefined}
                        onClick={() => setPage(step)}
                      >
                        {step}
                      </button>
                    ),
                  )}
                  <button
                    type="button"
                    disabled={current === pages}
                    aria-label="Next page"
                    onClick={() => setPage(current + 1)}
                  >
                    ›
                  </button>
                </div>
              )}
            </>
          )
        }}
      </Loaded>
    </>
  )
}

function Report() {
  const [grain, setGrain] = useState('events')
  const [mode, setMode] = useState('all')
  const [sector, setSector] = useState('')
  const [preset, setPreset] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function choosePreset(value: string) {
    const span = rangeFor(value)

    setPreset(value)

    if (value !== 'custom') {
      setFrom(span.from)
      setTo(span.to)
    }
  }

  async function download() {
    setError('')
    setBusy(true)

    try {
      const query = new URLSearchParams({ grain })

      if (mode !== 'all') query.set('mode', mode)
      if (sector !== '') query.set('sector', sector)
      if (from !== '') query.set('from', from)
      if (to !== '') query.set('to', to)

      const blob = await api.download(`/admin/report.csv?${query.toString()}`)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = url
      link.download = `fasha-${grain}-${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } catch (problem) {
      setError(messageFor(problem))
    } finally {
      setBusy(false)
    }
  }

  const sentence = [
    grain === 'events' ? 'One row per opportunity' : 'One row per person per check in',
    mode === 'all' ? 'of any kind' : mode === 'VIRTUAL' ? 'for virtual work' : 'for work in person',
    sector === '' ? 'in every sector' : `in ${sector}`,
    from === '' && to === ''
      ? 'over all time'
      : `from ${from === '' ? 'the beginning' : from} to ${to === '' ? 'today' : to}`,
  ].join(', ')

  return (
    <>
      <div className="toolbar">
        <span className="toolbar__field">
          <label className="toolbar__label" htmlFor="grain">Rows</label>
          <select
            id="grain"
            className="input toolbar__select"
            value={grain}
            onChange={event => setGrain(event.target.value)}
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
            onChange={event => setMode(event.target.value)}
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
            onChange={event => setSector(event.target.value)}
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
          onFrom={setFrom}
          onTo={setTo}
        />
      </div>

      <p className="lede" style={{ marginBottom: 16 }}>{sentence}.</p>

      {error && <p className="error" role="alert">{error}</p>}

      <Button variant="primary" disabled={busy} onClick={download}>
        {busy ? 'Preparing…' : 'Download CSV'}
      </Button>
    </>
  )
}

export default function AdminDashboard() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('approvals')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-base)' }}>
      <header className="topbar">
        <span className="topbar__left"><Logo size={24} /></span>
        <div className="topbar__right">
          <span className="muted">Community admin</span>
          <Button onClick={() => { signOut(); navigate('/signin') }}>Sign out</Button>
        </div>
      </header>

      <main className="admin-sheet">
        <section className="banner banner--admin">
          <h1 className="banner__title">Your community at a glance</h1>
        </section>

        <Tabs
          active={tab}
          onChange={setTab}
          items={[
            { id: 'approvals', label: 'Approvals' },
            { id: 'activity', label: 'Activity' },
            { id: 'export', label: 'Export' },
          ]}
        />

        {tab === 'approvals' && <Approvals />}
        {tab === 'activity' && <Activity />}
        {tab === 'export' && <Report />}
      </main>

      <HelpButton title="Community admin" notes={OVERSIGHT_GUIDE} />
    </div>
  )
}