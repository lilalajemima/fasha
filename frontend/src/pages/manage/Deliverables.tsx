import { useState } from 'react'
import { Loaded, Problem } from '../../components/Loader'
import { Button, EmptyState, StatusBadge, Tabs } from '../../components/ui'
import { api } from '../../lib/api'
import { longDate } from '../../lib/format'
import type { OpportunityView, SubmissionStatus, SubmissionView } from '../../lib/types'
import { messageFor, useGet } from '../../lib/useGet'
import './Manage.css'

const STATES: { id: string; label: string }[] = [
  { id: 'PENDING', label: 'To review' },
  { id: 'APPROVED', label: 'Accepted' },
  { id: 'REJECTED', label: 'Rejected' },
  { id: 'all', label: 'All' },
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

/**
 * What volunteers sent in for one opportunity, and the accept or reject on
 * each. Exported so the same review sits inside a volunteer's own initiative.
 */
export function DeliverablesPanel({ opportunityId }: { opportunityId: string }) {
  const deliverables = useGet<SubmissionView[]>(`/opportunities/${opportunityId}/submissions`)
  const [state, setState] = useState('PENDING')
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')

  async function decide(id: string, decision: 'APPROVE' | 'REJECT') {
    setError('')
    setBusy(id)

    try {
      await api.patch(`/submissions/${id}/status`, { decision })
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
      <Tabs
        active={state}
        onChange={setState}
        items={STATES.map(entry =>
          entry.id === 'PENDING' && waiting > 0
            ? { id: entry.id, label: `${entry.label} (${waiting})` }
            : entry,
        )}
      />

      <div className="toolbar">
        <input
          className="input toolbar__search"
          placeholder="Search by volunteer"
          aria-label="Search deliverables"
          value={query}
          onChange={event => setQuery(event.target.value)}
        />
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
                  <tr key={item.id} className="data__row--plain">
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
                        <span className="cluster">
                          <Button
                            variant="primary"
                            className="btn--small"
                            disabled={busy === item.id}
                            onClick={() => decide(item.id, 'APPROVE')}
                          >
                            Accept
                          </Button>
                          <Button
                            className="btn--small btn--danger"
                            disabled={busy === item.id}
                            onClick={() => decide(item.id, 'REJECT')}
                          >
                            Reject
                          </Button>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        }}
      </Loaded>
    </>
  )
}

/** The organisation's page: pick one of their opportunities, review its work. */
export default function Deliverables() {
  const mine = useGet<OpportunityView[]>('/opportunities/mine')
  const [chosen, setChosen] = useState('')

  const published = (mine.data ?? []).filter(item => item.status === 'PUBLISHED')
  const current = chosen || published[0]?.id || ''

  return (
    <>
      <section className="banner banner--deliverables">
        <h1 className="banner__title">Deliverables</h1>
      </section>

      {mine.error && <Problem message={mine.error} onRetry={mine.reload} />}

      {published.length === 0 ? (
        <EmptyState>Publish an opportunity and the work sent in for it shows up here.</EmptyState>
      ) : (
        <>
          <div className="toolbar">
            <label className="toolbar__label" htmlFor="which">Opportunity</label>
            <select
              id="which"
              className="input toolbar__wide"
              value={current}
              onChange={event => setChosen(event.target.value)}
            >
              {published.map(item => (
                <option key={item.id} value={item.id}>{item.title}</option>
              ))}
            </select>
          </div>

          <DeliverablesPanel key={current} opportunityId={current} />
        </>
      )}
    </>
  )
}
