import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loaded } from '../../components/Loader'
import { Button, EmptyState, StatusBadge, Tabs, type Tone } from '../../components/ui'
import { api } from '../../lib/api'
import { hasPassed, longDate, meta, quantity } from '../../lib/format'
import { PER_PAGE, pageCount, pageNumbers, pageSlice } from '../../lib/paging'
import type { OpportunityView, WorkloadRow } from '../../lib/types'
import { messageFor, useGet } from '../../lib/useGet'
import './Manage.css'

type Standing = { id: string; label: string; tone: Tone }

const GROUPS = [
  { id: 'all', label: 'All' },
  { id: 'physical', label: 'In person' },
  { id: 'virtual', label: 'Virtual' },
]

/** One opportunity, one plain-language state. */
function standingOf(item: OpportunityView): Standing {
  if (item.status === 'PENDING_APPROVAL') return { id: 'review', label: 'In review', tone: 'warn' }
  if (item.status === 'REJECTED') return { id: 'rejected', label: 'Not approved', tone: 'bad' }
  if (hasPassed(item.endsAt ?? item.applicationDeadline)) {
    return { id: 'closed', label: 'Closed', tone: 'neutral' }
  }
  if (hasPassed(item.applicationDeadline)) {
    return { id: 'closed', label: 'Applications closed', tone: 'neutral' }
  }

  return { id: 'open', label: 'Open', tone: 'ok' }
}

/** Editable until applications close. */
function editable(item: OpportunityView): boolean {
  return item.status !== 'PUBLISHED' || !hasPassed(item.applicationDeadline)
}

function closable(item: OpportunityView): boolean {
  return item.status === 'PUBLISHED' && !hasPassed(item.applicationDeadline)
}

function happening(item: OpportunityView): string | null {
  if (item.startsAt) return longDate(item.startsAt)
  if (item.endsAt) return `Due ${longDate(item.endsAt)}`

  return null
}

function inGroup(item: OpportunityView, group: string): boolean {
  if (group === 'physical') return item.mode === 'PHYSICAL'
  if (group === 'virtual') return item.mode === 'VIRTUAL'

  return true
}

function searchable(item: OpportunityView): string {
  return `${item.title} ${item.sector ?? ''} ${item.location ?? ''}`.toLowerCase()
}

/**
 * The organisation's own workspace. A volunteer's initiatives live at
 * /initiatives, with the organiser tools inside the initiative itself, so this
 * page serves one role and no longer has to relabel itself.
 */
export default function Opportunities() {
  const navigate = useNavigate()
  const mine = useGet<OpportunityView[]>('/opportunities/mine')
  const workload = useGet<WorkloadRow[]>('/opportunities/mine/workload')

  const [group, setGroup] = useState('all')
  const [state, setState] = useState('all')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [problem, setProblem] = useState('')
  const [busy, setBusy] = useState('')

  const counts = new Map((workload.data ?? []).map(row => [row.opportunityId, row] as const))
  const words = query.trim().toLowerCase()

  function change(apply: () => void) {
    apply()
    setPage(1)
  }

  async function run(id: string, work: () => Promise<unknown>) {
    setProblem('')
    setBusy(id)

    try {
      await work()
      mine.reload()
      workload.reload()
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
    // The server refuses once anyone has applied; this is for the slip of the hand.
    if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) return

    run(item.id, () => api.delete(`/opportunities/${item.id}`))
  }

  return (
    <>
      <section className="banner banner--opportunities">
        <div className="banner__bar">
          <h1 className="banner__title">Opportunities</h1>
          <Link to="/manage/opportunities/new">
            <Button variant="primary">+ Create opportunity</Button>
          </Link>
        </div>
      </section>

      <Tabs active={group} onChange={next => change(() => setGroup(next))} items={GROUPS} />

      {problem && <p className="error" role="alert">{problem}</p>}

      <Loaded state={mine} what="your opportunities">
        {items => {
          const visible = items
            .filter(item => inGroup(item, group))
            .filter(item => state === 'all' || standingOf(item).id === state)
            .filter(item => words === '' || searchable(item).includes(words))

          const pages = pageCount(visible.length, PER_PAGE)
          const current = Math.min(page, pages)
          const rows = pageSlice(visible, current, PER_PAGE)
          const firstShown = visible.length === 0 ? 0 : (current - 1) * PER_PAGE + 1

          return (
            <>
              <div className="toolbar">
                <input
                  className="input toolbar__search"
                  placeholder="Search by title, sector or place"
                  aria-label="Search your opportunities"
                  value={query}
                  onChange={event => change(() => setQuery(event.target.value))}
                />
                <select
                  className="input toolbar__select"
                  aria-label="Filter by state"
                  value={state}
                  onChange={event => change(() => setState(event.target.value))}
                >
                  <option value="all">Any state</option>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
                <span className="toolbar__count">
                  {quantity(visible.length, 'opportunity', 'opportunities')}
                </span>
              </div>

              {visible.length === 0 ? (
                <EmptyState>Nothing matches that.</EmptyState>
              ) : (
                <>
                  <table className="data">
                    <thead>
                      <tr>
                        <th>Opportunity</th>
                        <th>When</th>
                        <th>Applications</th>
                        <th>State</th>
                        <th aria-hidden="true" />
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map(item => {
                        const mark = standingOf(item)
                        const row = counts.get(item.id)
                        const applications = `/manage/opportunities/${item.id}/applications`

                        return (
                          <tr key={item.id} onClick={() => navigate(applications)}>
                            <td>
                              <Link
                                className="data__title"
                                to={applications}
                                onClick={event => event.stopPropagation()}
                              >
                                {item.title}
                              </Link>
                              <div className="data__meta">
                                {meta(
                                  item.mode === 'PHYSICAL' ? 'In person' : 'Virtual',
                                  item.location,
                                  item.sector,
                                )}
                              </div>
                            </td>
                            <td>
                              {happening(item)}
                              <div className="data__meta">
                                Apply by {longDate(item.applicationDeadline)}
                              </div>
                            </td>
                            <td>
                              {row && row.pendingApplications > 0 ? (
                                <span className="pill">{row.pendingApplications} to review</span>
                              ) : (
                                <span className="muted">
                                  {row ? row.acceptedApplications : 0} accepted
                                </span>
                              )}
                            </td>
                            <td>
                              <StatusBadge tone={mark.tone}>{mark.label}</StatusBadge>
                            </td>
                            {/* Own click handler: changing a row should never open it. */}
                            <td
                              className="data__actions"
                              onClick={event => event.stopPropagation()}
                            >
                              {editable(item) && (
                                <Link
                                  className="data__action"
                                  to={`/manage/opportunities/${item.id}/edit`}
                                >
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
                        )
                      })}
                    </tbody>
                  </table>

                  <div className="pager">
                    <span className="pager__info">
                      {firstShown}–{(current - 1) * PER_PAGE + rows.length} of {visible.length}
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
                </>
              )}
            </>
          )
        }}
      </Loaded>
    </>
  )
}
