import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loaded } from '../../components/Loader'
import { Button, EmptyState, StatusBadge } from '../../components/ui'
import { api } from '../../lib/api'
import { hasPassed, longDate, meta, quantity, whenLabel } from '../../lib/format'
import type { OpportunityStatus, OpportunityView } from '../../lib/types'
import { messageFor, useGet } from '../../lib/useGet'
import '../../styles/workspace.css'

const LABEL: Record<OpportunityStatus, string> = {
  PUBLISHED: 'Published',
  PENDING_APPROVAL: 'Awaiting approval',
  REJECTED: 'Not approved',
}

const TONE: Record<OpportunityStatus, 'ok' | 'warn' | 'bad'> = {
  PUBLISHED: 'ok',
  PENDING_APPROVAL: 'warn',
  REJECTED: 'bad',
}

function editable(item: OpportunityView): boolean {
  return item.status !== 'PUBLISHED' || !hasPassed(item.applicationDeadline)
}

function closable(item: OpportunityView): boolean {
  return item.status === 'PUBLISHED' && !hasPassed(item.applicationDeadline)
}

export default function MyInitiatives() {
  const navigate = useNavigate()
  const mine = useGet<OpportunityView[]>('/opportunities/mine')
  const [state, setState] = useState('all')
  const [query, setQuery] = useState('')
  const [problem, setProblem] = useState('')
  const [busy, setBusy] = useState('')

  const words = query.trim().toLowerCase()

  async function run(id: string, work: () => Promise<unknown>) {
    setProblem('')
    setBusy(id)

    try {
      await work()
      mine.reload()
    } catch (failure) {
      setProblem(messageFor(failure))
    } finally {
      setBusy('')
    }
  }

  function closeEarly(item: OpportunityView) {
    run(item.id, () => api.patch(`/opportunities/${item.id}/close`, {}))
  }

  function remove(item: OpportunityView) {
    if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) return

    run(item.id, () => api.delete(`/opportunities/${item.id}`))
  }

  return (
    <>
      <section className="banner banner--initiatives">
        <div className="banner__bar">
          <h1 className="banner__title">My initiatives</h1>
          <Link to="/initiatives/new">
            <Button variant="primary">+ Propose an initiative</Button>
          </Link>
        </div>
      </section>

      <div className="toolbar">
        <input
          className="input toolbar__search"
          placeholder="Search your initiatives"
          aria-label="Search your initiatives"
          value={query}
          onChange={event => setQuery(event.target.value)}
        />
        <select
          className="input toolbar__select"
          aria-label="Filter by state"
          value={state}
          onChange={event => setState(event.target.value)}
        >
          <option value="all">Any state</option>
          <option value="PENDING_APPROVAL">Awaiting approval</option>
          <option value="PUBLISHED">Published</option>
          <option value="REJECTED">Not approved</option>
        </select>
      </div>

      {problem && <p className="error" role="alert">{problem}</p>}

      <Loaded state={mine} what="your initiatives">
        {items => {
          const visible = items
            .filter(item => state === 'all' || item.status === state)
            .filter(
              item =>
                words === '' ||
                `${item.title} ${item.sector ?? ''}`.toLowerCase().includes(words),
            )

          if (visible.length === 0) {
            return (
              <EmptyState>
                {items.length === 0
                  ? 'You have not proposed an initiative yet.'
                  : 'Nothing matches that.'}
              </EmptyState>
            )
          }

          return (
            <table className="data">
              <thead>
                <tr>
                  <th>Initiative</th>
                  <th>When</th>
                  <th>Apply by</th>
                  <th>State</th>
                  <th aria-hidden="true" />
                </tr>
              </thead>
              <tbody>
                {visible.map(item => (
                  <tr key={item.id} onClick={() => navigate(`/initiatives/${item.id}`)}>
                    <td>
                      <Link
                        className="data__title"
                        to={`/initiatives/${item.id}`}
                        onClick={event => event.stopPropagation()}
                      >
                        {item.title}
                      </Link>
                      <div className="data__meta">
                        {meta(item.sector, `up to ${quantity(item.maxCapacity, 'volunteer')}`)}
                      </div>
                      {item.status === 'REJECTED' && item.reviewNote && (
                        <div className="data__meta">
                          <strong>Reviewer:</strong> {item.reviewNote}
                        </div>
                      )}
                    </td>
                    {/* whenLabel already says "Due by" for work with no start time. */}
                    <td>{whenLabel(item.startsAt, item.endsAt) ?? 'No date set'}</td>
                    <td>{longDate(item.applicationDeadline)}</td>
                    <td>
                      <StatusBadge tone={TONE[item.status]}>{LABEL[item.status]}</StatusBadge>
                    </td>
                    {/* Own click handler: changing a row should never open it. */}
                    <td className="data__actions" onClick={event => event.stopPropagation()}>
                      {editable(item) && (
                        <Link className="data__action" to={`/initiatives/${item.id}/edit`}>
                          Edit
                        </Link>
                      )}
                      {closable(item) && (
                        <button
                          type="button"
                          className="data__action"
                          disabled={busy === item.id}
                          onClick={() => closeEarly(item)}
                        >
                          Close early
                        </button>
                      )}
                      <button
                        type="button"
                        className="data__action data__action--danger"
                        disabled={busy === item.id}
                        onClick={() => remove(item)}
                      >
                        Delete
                      </button>
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