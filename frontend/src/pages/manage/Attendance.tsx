import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Loading, Problem } from '../../components/Loader'
import PageHeader from '../../components/PageHeader'
import { Button, EmptyState } from '../../components/ui'
import { api } from '../../lib/api'
import { hasPassed, meta, quantity, timeOfDay, whenLabel } from '../../lib/format'
import { buildRoster, matches } from '../../lib/roster'
import type {
  ApplicationView,
  CheckinCodeView,
  CheckinView,
  OpportunityView,
  WorkloadRow,
} from '../../lib/types'
import { messageFor, useGet } from '../../lib/useGet'
import './Manage.css'

const CODE_SECONDS = 30
const LAST_SECONDS = 5

/** 429439 is read back as 429 439, which is how somebody says it out loud. */
function grouped(code: string): string {
  return `${code.slice(0, 3)} ${code.slice(3)}`
}

function CodePanel({ opportunityId }: { opportunityId: string }) {
  const [open, setOpen] = useState(false)
  const [round, setRound] = useState(0)
  const [code, setCode] = useState<CheckinCodeView | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return

    let live = true
    let timer: number | undefined

    api
      .post<CheckinCodeView>(`/opportunities/${opportunityId}/checkin-code`)
      .then(next => {
        if (!live) return

        const expiresAt = Date.now() + next.secondsRemaining * 1000

        setCode(next)
        setSecondsLeft(next.secondsRemaining)
        setError('')

        timer = window.setInterval(() => {
          const left = Math.ceil((expiresAt - Date.now()) / 1000)

          if (left <= 0) {
            setRound(count => count + 1)
          } else {
            setSecondsLeft(left)
          }
        }, 500)
      })
      .catch(problem => {
        if (live) setError(messageFor(problem))
      })

    return () => {
      live = false
      if (timer) clearInterval(timer)
    }
  }, [open, round, opportunityId])

  return (
    <section className="card codepanel">
      <h2>Check in code</h2>

      {error && <p className="error" role="alert">{error}</p>}

      {code ? (
        <div className="codepanel__body">
          <div
            className="codepanel__qr"
            dangerouslySetInnerHTML={{ __html: code.qrSvg }}
          />

          <div>
            <strong className="codepanel__code">{grouped(code.code)}</strong>

            <div className="codepanel__track">
              <div
                className={`codepanel__fill${
                  secondsLeft <= LAST_SECONDS ? ' codepanel__fill--last' : ''
                }`}
                style={{ width: `${(Math.max(secondsLeft, 0) / CODE_SECONDS) * 100}%` }}
              />
            </div>

            <p className="muted" style={{ marginBottom: 0 }}>
              The same code checks people out. It changes every 30 seconds.
            </p>
          </div>
        </div>
      ) : (
        <Button variant="primary" block disabled={open} onClick={() => setOpen(true)}>
          {open ? 'Opening…' : 'Open check in'}
        </Button>
      )}
    </section>
  )
}

function Register({ opportunity }: { opportunity: OpportunityView }) {
  const checkins = useGet<CheckinView[]>(`/opportunities/${opportunity.id}/checkins`)
  const applicants = useGet<ApplicationView[]>(`/opportunities/${opportunity.id}/applications`)
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')

  const accepted = (applicants.data ?? []).filter(item => item.status === 'ACCEPTED')
  const everyone = buildRoster(accepted, checkins.data ?? [])
  const here = everyone.filter(row => row.checkedInAt && !row.checkedOutAt).length
  const left = everyone.filter(row => row.checkedOutAt).length
  const rows = everyone.filter(row => matches(row, query))
  const loading = (checkins.loading && !checkins.data) || (applicants.loading && !applicants.data)
  const problem = checkins.error ?? applicants.error

  async function checkIn(volunteerId: string) {
    setError('')
    setBusy(volunteerId)

    try {
      await api.post(`/opportunities/${opportunity.id}/checkins/manual`, { volunteerId })
      checkins.reload()
    } catch (trouble) {
      setError(messageFor(trouble))
    } finally {
      setBusy('')
    }
  }

  async function checkOut(checkinId: string, volunteerId: string) {
    setError('')
    setBusy(volunteerId)

    try {
      await api.patch(`/checkins/${checkinId}/checkout`)
      checkins.reload()
    } catch (trouble) {
      setError(messageFor(trouble))
    } finally {
      setBusy('')
    }
  }

  async function downloadCsv() {
    setError('')

    try {
      const blob = await api.download(`/opportunities/${opportunity.id}/attendance.csv`)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = url
      link.download = `attendance-${opportunity.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } catch (trouble) {
      setError(messageFor(trouble))
    }
  }

  return (
    <section className="card register">
      <div className="register__head">
        <h2 style={{ marginBottom: 4 }}>{opportunity.title}</h2>
        <p className="muted" style={{ margin: 0 }}>
          {meta(whenLabel(opportunity.startsAt, opportunity.endsAt), opportunity.location)}
        </p>
      </div>

      <p className="roster__count register__hide">
        <strong>{here}</strong> of {accepted.length} here
        {left > 0 && <span className="muted"> · {left} left</span>}
      </p>

      <div className="roster__head register__hide">
        <input
          className="input toolbar__search"
          placeholder="Search volunteers"
          aria-label="Search volunteers"
          value={query}
          onChange={event => setQuery(event.target.value)}
        />
        <span className="cluster">
          <Button className="btn--small" onClick={downloadCsv}>Export CSV</Button>
          <Button className="btn--small" onClick={() => window.print()}>Print or PDF</Button>
        </span>
      </div>

      {error && <p className="error" role="alert">{error}</p>}
      {problem && <Problem message={problem} onRetry={checkins.reload} />}
      {loading && !problem && <Loading what="the register" />}

      {!loading && !problem && (
        rows.length === 0 ? (
          <EmptyState>
            {accepted.length === 0
              ? 'Nobody has been accepted onto this one yet.'
              : 'Nobody matches that search.'}
          </EmptyState>
        ) : (
          <table className="data">
            <thead>
              <tr>
                <th>Volunteer</th>
                <th>In</th>
                <th>Out</th>
                <th>How</th>
                <th className="register__hide" aria-hidden="true" />
              </tr>
            </thead>
            <tbody>
              {rows.map(row => {
                const openCheckin = row.checkedOutAt ? null : row.checkinId

                return (
                <tr key={row.volunteerId} className="data__row--plain">
                  <td className="data__title">{row.name}</td>
                  <td>{row.checkedInAt ? timeOfDay(row.checkedInAt) : '—'}</td>
                  <td>{row.checkedOutAt ? timeOfDay(row.checkedOutAt) : '—'}</td>
                  <td>
                    {row.method === null ? (
                      <span className="muted">Not arrived</span>
                    ) : row.method === 'QR' ? (
                      'Scanned'
                    ) : (
                      'By hand'
                    )}
                  </td>
                  <td className="data__actions register__hide">
                    {!row.checkinId && (
                      <Button
                        className="btn--small"
                        disabled={busy === row.volunteerId}
                        onClick={() => checkIn(row.volunteerId)}
                      >
                        Check in
                      </Button>
                    )}
                    {openCheckin && (
                      <Button
                        className="btn--small"
                        disabled={busy === row.volunteerId}
                        onClick={() => checkOut(openCheckin, row.volunteerId)}
                      >
                        Check out
                      </Button>
                    )}
                    {row.checkedOutAt && <span className="muted">Done</span>}
                  </td>
                </tr>
                )
              })}
            </tbody>
          </table>
        )
      )}
    </section>
  )
}

/**
 * Taking attendance at one event: the rolling code, then the register. Exported
 * so a volunteer runs their own initiative's door from inside that initiative.
 */
export function AttendancePanel({ opportunity }: { opportunity: OpportunityView }) {
  return (
    <div className="stack">
      <CodePanel opportunityId={opportunity.id} />
      <Register opportunity={opportunity} />
    </div>
  )
}

/** The organisation's page: their events as a table, then one event's door. */
export default function Attendance() {
  const mine = useGet<OpportunityView[]>('/opportunities/mine')
  const workload = useGet<WorkloadRow[]>('/opportunities/mine/workload')
  // ?event=<id> arrives from the calendar, so a tap on an entry lands on that
  // event's register rather than on a list you then have to search.
  const [params, setParams] = useSearchParams()
  const chosen = params.get('event') ?? ''

  function choose(id: string) {
    if (id) setParams({ event: id })
    else setParams({})
  }

  const [query, setQuery] = useState('')
  const [order, setOrder] = useState('newest')
  const [downloading, setDownloading] = useState('')
  const [error, setError] = useState('')

  const published = (mine.data ?? []).filter(
    item => item.status === 'PUBLISHED' && item.mode === 'PHYSICAL',
  )
  const counts = new Map((workload.data ?? []).map(row => [row.opportunityId, row] as const))
  // Only the next event gets the loud button; the rest are things you could do.
  const nextUp = published
    .filter(item => item.startsAt !== null && !hasPassed(item.startsAt))
    .sort((a, b) => Date.parse(a.startsAt ?? '') - Date.parse(b.startsAt ?? ''))[0]
  const current = published.find(item => item.id === chosen)
  const words = query.trim().toLowerCase()

  /** The register is already a CSV on the server; this only saves it. */
  async function download(item: OpportunityView) {
    setError('')
    setDownloading(item.id)

    try {
      const blob = await api.download(`/opportunities/${item.id}/attendance.csv`)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = url
      link.download = `attendance-${item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } catch (problem) {
      setError(messageFor(problem))
    } finally {
      setDownloading('')
    }
  }

  if (current) {
    return (
      <>
        <p className="backlink">
          <button className="linkbtn" onClick={() => choose('')}>← All events</button>
        </p>

        <PageHeader title={current.title} />

        <p className="lede" style={{ marginBottom: 18 }}>
          {meta(
            whenLabel(current.startsAt, current.endsAt),
            current.location,
            current.sector,
            `up to ${quantity(current.maxCapacity, 'volunteer')}`,
          )}
        </p>

        <AttendancePanel opportunity={current} />
      </>
    )
  }

  const visible = published
    .filter(item =>
      `${item.title} ${item.sector ?? ''} ${item.location ?? ''}`.toLowerCase().includes(words),
    )
    .sort((a, b) => {
      const left = Date.parse(a.startsAt ?? a.applicationDeadline)
      const right = Date.parse(b.startsAt ?? b.applicationDeadline)

      return order === 'newest' ? right - left : left - right
    })

  return (
    <>
      <section className="banner banner--attendance">
        <h1 className="banner__title">Attendance</h1>
      </section>

      {mine.error && <Problem message={mine.error} onRetry={mine.reload} />}
      {error && <p className="error" role="alert">{error}</p>}

      <div className="toolbar">
        <input
          className="input toolbar__search"
          placeholder="Search your events"
          aria-label="Search your events"
          value={query}
          onChange={event => setQuery(event.target.value)}
        />
        <span className="toolbar__field">
          <label className="toolbar__label" htmlFor="order">Order</label>
          <select
            id="order"
            className="input toolbar__select"
            value={order}
            onChange={event => setOrder(event.target.value)}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </span>
        <span className="toolbar__count">{quantity(visible.length, 'event')}</span>
      </div>

      {mine.loading && !mine.data && <Loading what="your events" />}

      {!mine.loading && published.length === 0 && (
        <EmptyState>
          Attendance is for work people turn up to. Publish something in person and it appears
          here. Virtual work is measured by what volunteers send in, on the Deliverables page.
        </EmptyState>
      )}

      {published.length > 0 && visible.length === 0 && (
        <EmptyState>Nothing matches that search.</EmptyState>
      )}

      {visible.length > 0 && (
        <table className="data">
          <thead>
            <tr>
              <th>Event</th>
              <th>When</th>
              <th>Where</th>
              <th>Accepted</th>
              <th aria-hidden="true" />
            </tr>
          </thead>
          <tbody>
            {visible.map(item => {
              const row = counts.get(item.id)

              return (
                <tr key={item.id} className="data__row--plain">
                  <td>
                    <span className="data__title">{item.title}</span>
                    {item.id === nextUp?.id && (
                      <div className="data__meta">Next up</div>
                    )}
                  </td>
                  <td>
                    {whenLabel(item.startsAt, item.endsAt)}
                    {hasPassed(item.endsAt ?? item.applicationDeadline) && (
                      <div className="data__meta">Finished</div>
                    )}
                  </td>
                  <td>
                    {item.location ?? '—'}
                    <div className="data__meta">{item.sector ?? ''}</div>
                  </td>
                  <td>
                    {row ? `${row.acceptedApplications} of ${item.maxCapacity}` : `up to ${item.maxCapacity}`}
                  </td>
                  <td className="data__actions">
                    <button
                      type="button"
                      className="data__action"
                      onClick={() => choose(item.id)}
                    >
                      Take attendance
                    </button>
                    <button
                      type="button"
                      className="data__action"
                      disabled={downloading === item.id}
                      onClick={() => download(item)}
                    >
                      {downloading === item.id ? 'Preparing…' : 'Export CSV'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </>
  )
}
