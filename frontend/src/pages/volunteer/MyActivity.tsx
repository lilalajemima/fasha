import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
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
import { messageFor, useGet } from '../../lib/useGet'
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

/** One set of words for both tabs, mapped to whatever each one calls its states. */
const STATES = [
  { id: 'all', label: 'Any state' },
  { id: 'review', label: 'Under review' },
  { id: 'accepted', label: 'Accepted' },
  { id: 'rejected', label: 'Rejected' },
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

function hits(haystack: string, query: string): boolean {
  return haystack.toLowerCase().includes(query.trim().toLowerCase())
}

function SendDeliverable({ accepted, onSent }: {
  accepted: ApplicationView[]
  onSent: () => void
}) {
  const [opportunityId, setOpportunityId] = useState(accepted[0]?.opportunity.id ?? '')
  const [hours, setHours] = useState('3')
  const [proofUrl, setProofUrl] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (accepted.length === 0) {
    return <EmptyState>Once an organiser accepts you, you can send in your work here.</EmptyState>
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setBusy(true)

    try {
      await api.post(`/opportunities/${opportunityId}/submissions`, {
        hoursClaimed: Number(hours),
        proofUrl: proofUrl.trim(),
      })
      setProofUrl('')
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
        <label className="label" htmlFor="deliverable-opportunity">Opportunity</label>
        <select
          id="deliverable-opportunity"
          className="input"
          value={opportunityId}
          onChange={event => setOpportunityId(event.target.value)}
        >
          {accepted.map(application => (
            <option key={application.id} value={application.opportunity.id}>
              {application.opportunity.title}
            </option>
          ))}
        </select>
      </div>

      <div className="two-col">
        <Field
          id="hours"
          label="Hours it took"
          type="number"
          step="0.5"
          min="0.5"
          max="24"
          value={hours}
          required
          onChange={event => setHours(event.target.value)}
        />
        <Field
          id="proof"
          label="Link to what you produced"
          type="url"
          placeholder="https://"
          value={proofUrl}
          required
          onChange={event => setProofUrl(event.target.value)}
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
  const applications = useGet<ApplicationView[]>('/applications/mine')
  const deliverables = useGet<SubmissionView[]>('/submissions/mine')
  const openCheckins = useGet<CheckinView[]>('/checkins/mine')
  const portfolio = useGet<PortfolioView>('/portfolio/mine')

  const [tab, setTab] = useState('applications')
  const [query, setQuery] = useState('')
  const [state, setState] = useState('all')
  const [error, setError] = useState('')

  async function withdraw(id: string) {
    setError('')

    try {
      await api.patch(`/applications/${id}/withdraw`)
      applications.reload()
    } catch (problem) {
      setError(messageFor(problem))
    }
  }

  const accepted = (applications.data ?? []).filter(item => item.status === 'ACCEPTED')
  const open = (openCheckins.data ?? [])[0]
  const attended = (portfolio.data?.entries ?? []).filter(
    entry => entry.opportunity.mode === 'PHYSICAL',
  )

  return (
    <>
      <section className="banner banner--activity">
        <h1 className="banner__title">My activity</h1>
      </section>

      <Tabs
        active={tab}
        onChange={setTab}
        items={[
          { id: 'applications', label: `Applications · ${(applications.data ?? []).length}` },
          { id: 'attendance', label: 'Attendance' },
          { id: 'deliverables', label: `Deliverables · ${(deliverables.data ?? []).length}` },
        ]}
      />

      <input
        className="input searchbar"
        placeholder="Search by opportunity"
        aria-label="Search your activity"
        value={query}
        onChange={event => setQuery(event.target.value)}
      />

      {tab !== 'attendance' && (
        <div className="filterbar">
          <select value={state} aria-label="State" onChange={event => setState(event.target.value)}>
            {STATES.map(option => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </select>
        </div>
      )}

      {error && <p className="error" role="alert">{error}</p>}

      <div className="stack" style={{ marginTop: 16 }}>
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
                      <tr key={application.id} className="data__row--plain">
                        <td className="data__title">{application.opportunity.title}</td>
                        <td>{longDate(application.createdAt)}</td>
                        <td>
                          <StatusBadge tone={APPLICATION_TONE[application.status]}>
                            {APPLICATION_LABEL[application.status]}
                          </StatusBadge>
                        </td>
                        <td className="data__actions">
                          <span className="cluster">
                            <Link to={`/opportunities/${application.opportunity.id}`}>View ↗</Link>
                            {(application.status === 'PENDING' ||
                              application.status === 'ACCEPTED') && (
                              <button
                                className="linkbtn"
                                onClick={() => withdraw(application.id)}
                              >
                                Withdraw
                              </button>
                            )}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            }}
          </Loaded>
        )}

        {tab === 'attendance' && (
          <>
            <Card>
              <h2>Event check in</h2>
              <p className="muted">
                {open
                  ? `You are checked in to ${open.opportunity.title}, since ${timeOfDay(
                      open.checkedInAt,
                    )}.`
                  : 'Scan the code the organiser is showing when you arrive.'}
              </p>
              <Link to="/check-in">
                <Button block variant={open ? 'primary' : 'default'}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <Icon name="scan" /> {open ? 'Check out' : 'Open check in'}
                  </span>
                </Button>
              </Link>
            </Card>

            {(() => {
              const visible = attended.filter(entry => hits(entry.opportunity.title, query))

              if (visible.length === 0) {
                return (
                  <EmptyState>
                    {attended.length === 0
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
                      <th aria-hidden="true" />
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map(entry => (
                      <tr key={entry.id} className="data__row--plain">
                        <td className="data__title">{entry.opportunity.title}</td>
                        <td>{longDate(entry.creditedOn)}</td>
                        <td>{entry.hours} h</td>
                        <td className="data__actions">
                          <StatusBadge tone="ok">Credited</StatusBadge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            })()}
          </>
        )}

        {tab === 'deliverables' && (
          <>
            <Card>
              <h2>Send in what you did</h2>
              <SendDeliverable accepted={accepted} onSent={deliverables.reload} />
            </Card>

            <Loaded state={deliverables} what="your deliverables">
              {items => {
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
                      {visible.map(item => (
                        <tr key={item.id} className="data__row--plain">
                          <td className="data__title">{item.opportunity.title}</td>
                          <td>{longDate(item.createdAt)}</td>
                          <td>
                            <StatusBadge tone={SUBMISSION_TONE[item.status]}>
                              {SUBMISSION_LABEL[item.status]}
                            </StatusBadge>
                          </td>
                          <td className="data__actions">
                            <a href={item.proofUrl} target="_blank" rel="noreferrer">Open ↗</a>
                          </td>
                        </tr>
                      ))}
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
