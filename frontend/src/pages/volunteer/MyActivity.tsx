import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../../components/Icon'
import { Loaded } from '../../components/Loader'
import { Button, Card, EmptyState, Field, StatusBadge, Tabs } from '../../components/ui'
import { api } from '../../lib/api'
import { longDate, timeOfDay } from '../../lib/format'
import type {
  ApplicationStatus,
  ApplicationView,
  CheckinView,
  PortfolioView,
  SubmissionStatus,
  SubmissionView,
} from '../../lib/types'
import { useDraft } from '../../lib/useDraft'
import { messageFor, useGet } from '../../lib/useGet'
import '../../components/pickers.css'
import '../../styles/workspace.css'

const APPLICATION_TONE: Record<ApplicationStatus, 'ok' | 'warn' | 'bad' | 'neutral'> = {
  ACCEPTED: 'ok',
  PENDING: 'warn',
  REJECTED: 'bad',
  WITHDRAWN: 'neutral',
}

const APPLICATION_LABEL: Record<ApplicationStatus, string> = {
  ACCEPTED: 'Accepted',
  PENDING: 'Under review',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
}

const SUBMISSION_TONE: Record<SubmissionStatus, 'ok' | 'warn' | 'bad'> = {
  APPROVED: 'ok',
  PENDING: 'warn',
  REJECTED: 'bad',
}

const SUBMISSION_LABEL: Record<SubmissionStatus, string> = {
  APPROVED: 'Accepted',
  PENDING: 'Under review',
  REJECTED: 'Rejected',
}

const STATES = [
  { id: 'all', label: 'Any state' },
  { id: 'review', label: 'Under review' },
  { id: 'accepted', label: 'Accepted' },
  { id: 'rejected', label: 'Rejected' },
]

const ATTENDANCE_STATES = [
  { id: 'all', label: 'Any state' },
  { id: 'open', label: 'Checked in now' },
  { id: 'credited', label: 'Credited' },
]

const APPLICATION_STATE: Record<string, ApplicationStatus> = {
  review: 'PENDING',
  accepted: 'ACCEPTED',
  rejected: 'REJECTED',
}

const SUBMISSION_STATE: Record<string, SubmissionStatus> = {
  review: 'PENDING',
  accepted: 'APPROVED',
  rejected: 'REJECTED',
}

type Sendable = { id: string; title: string }

type AttendanceRow = {
  id: string
  opportunityId: string
  title: string
  on: string
  hours: number | null
  open: boolean
}

const HERE = { to: '/activity', label: 'My activity' }

function hits(haystack: string, query: string): boolean {
  return haystack.toLowerCase().includes(query.trim().toLowerCase())
}

/**
 * Which attempt each claim is, per opportunity. A rejection is not the end of
 * the road — the work can be fixed and sent again — so the table says
 * "Attempt 2 of 2" rather than showing rows that look like duplicates.
 */
function attemptsOf(items: SubmissionView[]): Map<string, { index: number; total: number }> {
  const byOpportunity = new Map<string, SubmissionView[]>()

  for (const item of items) {
    const bucket = byOpportunity.get(item.opportunity.id)

    if (bucket) bucket.push(item)
    else byOpportunity.set(item.opportunity.id, [item])
  }

  const attempts = new Map<string, { index: number; total: number }>()

  for (const bucket of byOpportunity.values()) {
    const ordered = [...bucket].sort((a, b) => a.createdAt.localeCompare(b.createdAt))

    ordered.forEach((item, index) => {
      attempts.set(item.id, { index: index + 1, total: ordered.length })
    })
  }

  return attempts
}

function SendDeliverable({ options, chosen, onChoose, onSent }: {
  options: Sendable[]
  chosen: string
  onChoose: (id: string) => void
  onSent: () => void
}) {
  const [find, setFind] = useState('')
  const [draft, setDraft, discardDraft] = useDraft('send-deliverable', { hours: '3', proofUrl: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (options.length === 0) {
    return (
      <EmptyState>
        Nothing is waiting on you. Work sent in here is remote work you were accepted for and
        have not already claimed; an event you turned up to is credited from the register.
      </EmptyState>
    )
  }

  const opportunityId = options.some(option => option.id === chosen) ? chosen : options[0]!.id
  const matching = options.filter(option => hits(option.title, find))

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setBusy(true)

    try {
      await api.post(`/opportunities/${opportunityId}/submissions`, {
        hoursClaimed: Number(draft.hours),
        proofUrl: draft.proofUrl.trim(),
      })
      discardDraft()
      setDraft({ hours: '3', proofUrl: '' })
      onSent()
    } catch (problem) {
      setError(messageFor(problem))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="field">
        <label className="label" htmlFor="deliverable-find">Which piece of work</label>
        {options.length > 4 && (
          <input
            id="deliverable-find"
            className="input"
            placeholder="Start typing to narrow the list"
            value={find}
            onChange={event => setFind(event.target.value)}
          />
        )}

        <div className="chipset" style={{ marginTop: options.length > 4 ? 10 : 0 }}>
          {matching.map(option => (
            <button
              key={option.id}
              type="button"
              className={option.id === opportunityId ? 'chip chip--on' : 'chip'}
              aria-pressed={option.id === opportunityId}
              onClick={() => onChoose(option.id)}
            >
              {option.title}
            </button>
          ))}
        </div>

        {matching.length === 0 && <p className="muted">Nothing of yours matches that.</p>}
      </div>

      <div className="two-col">
        <Field
          id="hours"
          label="Hours it took"
          type="number"
          step="0.5"
          min="0.5"
          max="24"
          value={draft.hours}
          required
          onChange={event => setDraft(current => ({ ...current, hours: event.target.value }))}
        />
        <Field
          id="proof"
          label="Link to what you produced"
          type="url"
          placeholder="https://"
          value={draft.proofUrl}
          required
          onChange={event => setDraft(current => ({ ...current, proofUrl: event.target.value }))}
        />
      </div>

      {error && <p className="error" role="alert">{error}</p>}

      <Button type="submit" variant="primary" disabled={busy}>
        {busy ? 'Sending…' : 'Send for review'}
      </Button>
    </form>
  )
}

export default function MyActivity() {
  const applications = useGet<ApplicationView[]>('/applications/mine', 3_000)
  const deliverables = useGet<SubmissionView[]>('/submissions/mine', 3_000)
  const openCheckins = useGet<CheckinView[]>('/checkins/mine')
  const portfolio = useGet<PortfolioView>('/portfolio/mine')
  const navigate = useNavigate()

  const [tab, setTab] = useState('applications')
  const [query, setQuery] = useState('')
  const [state, setState] = useState('all')
  const [sending, setSending] = useState(false)
  const [chosen, setChosen] = useState('')
  const [error, setError] = useState('')

  function choose(next: string) {
    setTab(next)
    setState('all')
  }

  async function withdraw(id: string) {
    setError('')

    try {
      await api.patch(`/applications/${id}/withdraw`)
      applications.reload()
    } catch (problem) {
      setError(messageFor(problem))
    }
  }

  function tryAgain(opportunityId: string) {
    setChosen(opportunityId)
    setSending(true)
  }

  const accepted = (applications.data ?? []).filter(item => item.status === 'ACCEPTED')

  // Only remote work can be sent in, since an event is credited from its
  // register, and only once: a claim that is waiting or already accepted
  // closes it. A rejected one does not, which is what makes a second attempt
  // possible.
  const settled = new Set(
    (deliverables.data ?? [])
      .filter(item => item.status !== 'REJECTED')
      .map(item => item.opportunity.id),
  )
  const sendable: Sendable[] = accepted
    .filter(item => item.opportunity.mode === 'VIRTUAL')
    .filter(item => !settled.has(item.opportunity.id))
    .map(item => ({ id: item.opportunity.id, title: item.opportunity.title }))
  const open = (openCheckins.data ?? [])[0]
  const attended = (portfolio.data?.entries ?? []).filter(
    entry => entry.opportunity.mode === 'PHYSICAL',
  )

  const attendance: AttendanceRow[] = [
    ...(open
      ? [
          {
            id: open.id,
            opportunityId: open.opportunity.id,
            title: open.opportunity.title,
            on: open.checkedInAt,
            hours: null,
            open: true,
          },
        ]
      : []),
    ...attended.map(entry => ({
      id: entry.id,
      opportunityId: entry.opportunity.id,
      title: entry.opportunity.title,
      on: entry.creditedOn,
      hours: entry.hours,
      open: false,
    })),
  ]

  return (
    <>
      <section className="banner banner--activity">
        <h1 className="banner__title">My activity</h1>
      </section>

      <Tabs
        active={tab}
        onChange={choose}
        items={[
          { id: 'applications', label: `Applications · ${(applications.data ?? []).length}` },
          { id: 'attendance', label: 'Attendance' },
          { id: 'deliverables', label: `Deliverables · ${(deliverables.data ?? []).length}` },
        ]}
      />

      <div className="toolbar">
        <input
          className="input toolbar__search"
          placeholder="Search by opportunity"
          aria-label="Search your activity"
          value={query}
          onChange={event => setQuery(event.target.value)}
        />
        <select
          className="input toolbar__select"
          aria-label="Filter by state"
          value={state}
          onChange={event => setState(event.target.value)}
        >
          {(tab === 'attendance' ? ATTENDANCE_STATES : STATES).map(option => (
            <option key={option.id} value={option.id}>{option.label}</option>
          ))}
        </select>

        {tab === 'attendance' && (
          <Link to="/check-in" style={{ marginLeft: 'auto' }}>
            <Button variant="primary" className="btn--small">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Icon name="scan" /> {open ? 'Check out' : 'Open check in'}
              </span>
            </Button>
          </Link>
        )}

        {tab === 'deliverables' && (
          <Button
            variant="primary"
            className="btn--small"
            style={{ marginLeft: 'auto' }}
            onClick={() => setSending(value => !value)}
          >
            {sending ? 'Close' : 'Send for review'}
          </Button>
        )}
      </div>

      {error && <p className="error" role="alert">{error}</p>}

      {tab === 'attendance' && open && (
        <p className="muted" style={{ marginBottom: 12 }}>
          You are checked in to {open.opportunity.title}, since {timeOfDay(open.checkedInAt)}.
        </p>
      )}

      <div className="stack" style={{ marginTop: 4 }}>
        {tab === 'applications' && (
          <Loaded state={applications} what="your applications">
            {items => {
              const visible = items
                .filter(item => state === 'all' || item.status === APPLICATION_STATE[state])
                .filter(item => hits(item.opportunity.title, query))

              if (visible.length === 0) {
                return (
                  <EmptyState>
                    {items.length === 0 ? (
                      <>
                        You have not applied to anything yet.{' '}
                        <Link to="/discover">Find something</Link>.
                      </>
                    ) : (
                      'Nothing matches that.'
                    )}
                  </EmptyState>
                )
              }

              return (
                <table className="data">
                  <thead>
                    <tr>
                      <th>Opportunity</th>
                      <th>Applied</th>
                      <th>State</th>
                      <th aria-hidden="true" />
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map(application => (
                      <tr
                        key={application.id}
                        onClick={() =>
                          navigate(`/opportunities/${application.opportunity.id}`, {
                            state: { from: HERE },
                          })
                        }
                      >
                        <td className="data__title">{application.opportunity.title}</td>
                        <td>{longDate(application.createdAt)}</td>
                        <td>
                          <StatusBadge tone={APPLICATION_TONE[application.status]}>
                            {APPLICATION_LABEL[application.status]}
                          </StatusBadge>
                        </td>
                        <td className="data__actions" onClick={event => event.stopPropagation()}>
                          {(application.status === 'PENDING' ||
                            application.status === 'ACCEPTED') && (
                            <button
                              type="button"
                              className="data__action data__action--danger"
                              onClick={() => withdraw(application.id)}
                            >
                              Withdraw
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            }}
          </Loaded>
        )}

        {tab === 'attendance' &&
          (() => {
            const visible = attendance
              .filter(row => state === 'all' || (state === 'open' ? row.open : !row.open))
              .filter(row => hits(row.title, query))

            if (visible.length === 0) {
              return (
                <EmptyState>
                  {attendance.length === 0
                    ? 'Nothing yet. An event lands here once the organiser closes your check out.'
                    : 'Nothing matches that.'}
                </EmptyState>
              )
            }

            return (
              <table className="data">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Date</th>
                    <th>Hours</th>
                    <th>State</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map(row => (
                    <tr
                      key={row.id}
                      onClick={() =>
                        navigate(`/opportunities/${row.opportunityId}`, {
                          state: { from: HERE },
                        })
                      }
                    >
                      <td className="data__title">{row.title}</td>
                      <td>{longDate(row.on)}</td>
                      <td>{row.hours === null ? '—' : `${row.hours} h`}</td>
                      <td>
                        <StatusBadge tone={row.open ? 'warn' : 'ok'}>
                          {row.open ? 'Checked in' : 'Credited'}
                        </StatusBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          })()}

        {tab === 'deliverables' && (
          <>
            {sending && (
              <Card>
                <h2>Send in what you did</h2>
                <SendDeliverable
                  options={sendable}
                  chosen={chosen}
                  onChoose={setChosen}
                  onSent={() => {
                    setSending(false)
                    deliverables.reload()
                  }}
                />
              </Card>
            )}

            <Loaded state={deliverables} what="your deliverables">
              {items => {
                const attempts = attemptsOf(items)
                const visible = items
                  .filter(item => state === 'all' || item.status === SUBMISSION_STATE[state])
                  .filter(item => hits(item.opportunity.title, query))

                if (visible.length === 0) {
                  return (
                    <EmptyState>
                      {items.length === 0 ? 'Nothing sent in yet.' : 'Nothing matches that.'}
                    </EmptyState>
                  )
                }

                return (
                  <table className="data">
                    <thead>
                      <tr>
                        <th>Opportunity</th>
                        <th>Sent</th>
                        <th>State</th>
                        <th aria-hidden="true" />
                      </tr>
                    </thead>
                    <tbody>
                      {visible.map(item => {
                        const attempt = attempts.get(item.id)
                        const latest = attempt !== undefined && attempt.index === attempt.total
                        const canTryAgain =
                          item.status === 'REJECTED' &&
                          latest &&
                          sendable.some(option => option.id === item.opportunity.id)

                        return (
                          <tr
                            key={item.id}
                            onClick={() =>
                              navigate(`/opportunities/${item.opportunity.id}`, {
                                state: { from: HERE },
                              })
                            }
                          >
                            <td>
                              <span className="data__title">{item.opportunity.title}</span>
                              {attempt && attempt.total > 1 && (
                                <div className="data__meta">
                                  Attempt {attempt.index} of {attempt.total}
                                </div>
                              )}
                              {item.reviewNote && (
                                <div className="data__meta">Not approved: {item.reviewNote}</div>
                              )}
                            </td>
                            <td>
                              {longDate(item.createdAt)}
                              <div className="data__meta">{item.hoursClaimed} h claimed</div>
                            </td>
                            <td>
                              <StatusBadge tone={SUBMISSION_TONE[item.status]}>
                                {SUBMISSION_LABEL[item.status]}
                              </StatusBadge>
                            </td>
                            <td className="data__actions" onClick={event => event.stopPropagation()}>
                              <a
                                className="data__action"
                                href={item.proofUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Proof ↗
                              </a>
                              {canTryAgain && (
                                <button
                                  type="button"
                                  className="data__action"
                                  onClick={() => tryAgain(item.opportunity.id)}
                                >
                                  Try again
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )
              }}
            </Loaded>
          </>
        )}
      </div>
    </>
  )
}