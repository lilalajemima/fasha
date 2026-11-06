import { Fragment, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Loaded } from '../../components/Loader'
import { Button, EmptyState, StatusBadge } from '../../components/ui'
import { api } from '../../lib/api'
import { longDate, quantity } from '../../lib/format'
import type { SubmissionStatus, SubmissionView } from '../../lib/types'
import { messageFor, useGet } from '../../lib/useGet'
import './Manage.css'

const STATES: { id: string; label: string }[] = [
  { id: 'PENDING', label: 'To review' },
  { id: 'APPROVED', label: 'Accepted' },
  { id: 'REJECTED', label: 'Rejected' },
  { id: 'all', label: 'Any state' },
]

function toneFor(status: SubmissionStatus) {
  if (status === 'APPROVED') return 'ok' as const
  if (status === 'PENDING') return 'warn' as const

  return 'bad' as const
}

function labelFor(status: SubmissionStatus): string {
  if (status === 'PENDING') return 'To review'
  if (status === 'APPROVED') return 'Accepted'

  return 'Rejected'
}

const MIN_REASON = 10

/**
 * The reason for a rejection, asked for in a row of its own under the claim it
 * belongs to. A dialog would hide the hours and the proof at the moment you
 * are writing about them.
 */
function RejectNote({ columns, busy, onCancel, onSend }: {
  columns: number
  busy: boolean
  onCancel: () => void
  onSend: (reason: string) => void
}) {
  const [reason, setReason] = useState('')
  const ready = reason.trim().length >= MIN_REASON

  return (
    <tr className="data__row--plain">
      <td colSpan={columns}>
        <label className="label" htmlFor="reason">Why are these hours not approved?</label>
        <div className="cluster" style={{ alignItems: 'flex-start', gap: 10 }}>
          <input
            id="reason"
            className="input"
            autoFocus
            placeholder="The photograph does not show the finished work."
            value={reason}
            onChange={event => setReason(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter' && ready) onSend(reason.trim())
              if (event.key === 'Escape') onCancel()
            }}
          />
          <Button
            variant="primary"
            className="btn--small"
            disabled={!ready || busy}
            onClick={() => onSend(reason.trim())}
          >
            Send rejection
          </Button>
          <Button className="btn--small" disabled={busy} onClick={onCancel}>Cancel</Button>
        </div>
        <p className="muted" style={{ marginTop: 6 }}>
          The volunteer is told this, so they can fix it and send the hours again.
        </p>
      </td>
    </tr>
  )
}

/**
 * What volunteers sent in for one opportunity, and the accept or reject on
 * each. Exported so the same review sits inside a volunteer's own initiative.
 */
export function DeliverablesPanel({ opportunityId }: { opportunityId: string }) {
  const deliverables = useGet<SubmissionView[]>(`/opportunities/${opportunityId}/submissions`)
  const [state, setState] = useState('PENDING')
  const [query, setQuery] = useState('')
  const [rejecting, setRejecting] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')

  async function decide(id: string, decision: 'APPROVE' | 'REJECT', reviewNote?: string) {
    setError('')
    setBusy(id)

    try {
      await api.patch(`/submissions/${id}/status`, { decision, reviewNote: reviewNote ?? null })
      setRejecting('')
      deliverables.reload()
    } catch (problem) {
      setError(messageFor(problem))
    } finally {
      setBusy('')
    }
  }

  const waiting = (deliverables.data ?? []).filter(item => item.status === 'PENDING').length
  const words = query.trim().toLowerCase()

  return (
    <>
      <div className="toolbar">
        <input
          className="input toolbar__search"
          placeholder="Search by volunteer"
          aria-label="Search deliverables"
          value={query}
          onChange={event => setQuery(event.target.value)}
        />
        <select
          className="input toolbar__select"
          aria-label="Filter by state"
          value={state}
          onChange={event => setState(event.target.value)}
        >
          {STATES.map(entry => (
            <option key={entry.id} value={entry.id}>
              {entry.id === 'PENDING' && waiting > 0 ? `${entry.label} (${waiting})` : entry.label}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="error" role="alert">{error}</p>}

      <Loaded state={deliverables} what="deliverables">
        {items => {
          const visible = items
            .filter(item => state === 'all' || item.status === state)
            .filter(item => words === '' || item.volunteer.name.toLowerCase().includes(words))

          if (visible.length === 0) {
            return <EmptyState>Nothing sent in for this one yet.</EmptyState>
          }

          return (
            <table className="data">
              <thead>
                <tr>
                  <th>Volunteer</th>
                  <th>Sent</th>
                  <th>Proof</th>
                  <th>State</th>
                  <th aria-hidden="true" />
                </tr>
              </thead>
              <tbody>
                {visible.map(item => (
                  <Fragment key={item.id}>
                  <tr className="data__row--plain">
                    <td className="data__title">{item.volunteer.name}</td>
                    <td>{longDate(item.createdAt)}</td>
                    <td>
                      <a href={item.proofUrl} target="_blank" rel="noreferrer">Open ↗</a>
                    </td>
                    <td>
                      <StatusBadge tone={toneFor(item.status)}>{labelFor(item.status)}</StatusBadge>
                    </td>
                    <td className="data__actions">
                      {item.status === 'PENDING' && (
                        <>
                          <button
                            type="button"
                            className="data__action"
                            disabled={busy === item.id}
                            onClick={() => decide(item.id, 'APPROVE')}
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            className="data__action data__action--danger"
                            disabled={busy === item.id}
                            onClick={() => setRejecting(item.id)}
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>

                  {rejecting === item.id && (
                    <RejectNote
                      columns={5}
                      busy={busy === item.id}
                      onCancel={() => setRejecting('')}
                      onSend={reason => decide(item.id, 'REJECT', reason)}
                    />
                  )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          )
        }}
      </Loaded>
    </>
  )
}

/**
 * The organisation's page: everything sent in to any of their opportunities,
 * in one list. It used to be one opportunity at a time behind a dropdown,
 * which hid work that was waiting and made "is anything outstanding?" a
 * question you answered by clicking through every event you run.
 */
export default function Deliverables() {
  const deliverables = useGet<SubmissionView[]>('/submissions/received')
  // ?opportunity=<id> arrives from the calendar: the list stays one list, but
  // it opens narrowed to the piece of work you tapped.
  const [params, setParams] = useSearchParams()
  const only = params.get('opportunity') ?? ''
  const [state, setState] = useState('PENDING')
  const [query, setQuery] = useState('')
  const [rejecting, setRejecting] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')

  async function decide(id: string, decision: 'APPROVE' | 'REJECT', reviewNote?: string) {
    setError('')
    setBusy(id)

    try {
      await api.patch(`/submissions/${id}/status`, { decision, reviewNote: reviewNote ?? null })
      setRejecting('')
      deliverables.reload()
    } catch (problem) {
      setError(messageFor(problem))
    } finally {
      setBusy('')
    }
  }

  const waiting = (deliverables.data ?? []).filter(item => item.status === 'PENDING').length
  const words = query.trim().toLowerCase()

  return (
    <>
      <section className="banner banner--deliverables">
        <h1 className="banner__title">Deliverables</h1>
      </section>

      <div className="toolbar">
        <input
          className="input toolbar__search"
          placeholder="Search by volunteer or opportunity"
          aria-label="Search deliverables"
          value={query}
          onChange={event => setQuery(event.target.value)}
        />
        <select
          className="input toolbar__select"
          aria-label="Filter by state"
          value={state}
          onChange={event => setState(event.target.value)}
        >
          {STATES.map(entry => (
            <option key={entry.id} value={entry.id}>
              {entry.id === 'PENDING' && waiting > 0 ? `${entry.label} (${waiting})` : entry.label}
            </option>
          ))}
        </select>
        {only !== '' && (
          <button type="button" className="data__action" onClick={() => setParams({})}>
            Showing one opportunity · show all ✕
          </button>
        )}
      </div>

      {error && <p className="error" role="alert">{error}</p>}

      <Loaded state={deliverables} what="deliverables">
        {items => {
          const visible = items
            .filter(item => only === '' || item.opportunity.id === only)
            .filter(item => state === 'all' || item.status === state)
            .filter(
              item =>
                words === '' ||
                `${item.volunteer.name} ${item.opportunity.title}`.toLowerCase().includes(words),
            )

          if (visible.length === 0) {
            return (
              <EmptyState>
                {items.length === 0
                  ? 'Nothing has been sent in yet. Publish an opportunity and the work people submit for it shows up here.'
                  : 'Nothing matches that.'}
              </EmptyState>
            )
          }

          return (
            <>
              <p className="toolbar__count" style={{ marginBottom: 10 }}>
                {quantity(visible.length, 'deliverable')}
              </p>

              <table className="data">
                <thead>
                  <tr>
                    <th>Volunteer</th>
                    <th>Opportunity</th>
                    <th>Sent</th>
                    <th>Proof</th>
                    <th>State</th>
                    <th aria-hidden="true" />
                  </tr>
                </thead>
                <tbody>
                  {visible.map(item => (
                    <Fragment key={item.id}>
                    <tr className="data__row--plain">
                      <td>
                        <span className="data__title">{item.volunteer.name}</span>
                        <div className="data__meta">
                          {quantity(item.hoursClaimed, 'hour')} claimed
                        </div>
                      </td>
                      <td>{item.opportunity.title}</td>
                      <td>{longDate(item.createdAt)}</td>
                      <td>
                        <a href={item.proofUrl} target="_blank" rel="noreferrer">Open ↗</a>
                      </td>
                      <td>
                        <StatusBadge tone={toneFor(item.status)}>
                          {labelFor(item.status)}
                        </StatusBadge>
                        {item.reviewNote && <div className="data__meta">{item.reviewNote}</div>}
                      </td>
                      <td className="data__actions">
                        {item.status === 'PENDING' && (
                          <>
                            <button
                              type="button"
                              className="data__action"
                              disabled={busy === item.id}
                              onClick={() => decide(item.id, 'APPROVE')}
                            >
                              Accept
                            </button>
                            <button
                              type="button"
                              className="data__action data__action--danger"
                              disabled={busy === item.id}
                              onClick={() => setRejecting(item.id)}
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </td>
                    </tr>

                    {rejecting === item.id && (
                      <RejectNote
                        columns={6}
                        busy={busy === item.id}
                        onCancel={() => setRejecting('')}
                        onSend={reason => decide(item.id, 'REJECT', reason)}
                      />
                    )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </>
          )
        }}
      </Loaded>
    </>
  )
}
