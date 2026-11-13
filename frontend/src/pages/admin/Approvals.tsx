import { useState } from 'react'
import { Loaded } from '../../components/Loader'
import { Button, EmptyState, StatusBadge, Tag, TextField } from '../../components/ui'
import { api } from '../../lib/api'
import { useCatalogue } from '../../lib/catalogue'
import { longDate, meta, quantity } from '../../lib/format'
import { SECTORS } from '../../lib/sectors'
import type { OpportunityView } from '../../lib/types'
import { messageFor, useGet, type Loaded as LoadedState } from '../../lib/useGet'
import { Period, kindOf, rangeFor } from './filters'
import { PrintReport, ReportRows } from './Report'
import { Summary, type Tile } from './Summary'
import {
  comparePhrase,
  decisionOf,
  interestPhrase,
  periodPhrase,
  previousSpan,
  spanLabel,
  stamp,
  tallyApprovals,
  topInterests,
  within,
  type Decision,
  type Span,
} from './stats'
import '../../styles/workspace.css'
import './Admin.css'

const OUTCOMES: { id: Decision | 'any'; label: string; count: string }[] = [
  { id: 'waiting', label: 'Waiting for a decision', count: 'waiting' },
  { id: 'approved', label: 'Approved', count: 'approved' },
  { id: 'rejected', label: 'Rejected', count: 'rejected' },
  { id: 'any', label: 'Any outcome', count: '' },
]

const OUTCOME_LABEL: Record<Decision, string> = {
  waiting: 'Waiting',
  approved: 'Approved',
  rejected: 'Rejected',
}

/**
 * The queue and the history come from two endpoints: what is waiting, and
 * everything from the last twelve months. Read as one list, with the queue's
 * copy winning, because it is the one that changes as decisions are made.
 */
function combine(
  queue: LoadedState<OpportunityView[]>,
  history: LoadedState<OpportunityView[]>,
): LoadedState<OpportunityView[]> {
  const byId = new Map<string, OpportunityView>()

  for (const item of history.data ?? []) byId.set(item.id, item)
  for (const item of queue.data ?? []) byId.set(item.id, item)

  return {
    data: queue.data && history.data ? [...byId.values()] : null,
    error: queue.error ?? history.error,
    loading: queue.loading || history.loading,
    stale: queue.stale || history.stale,
    at: queue.at,
    reload: () => {
      queue.reload()
      history.reload()
    },
  }
}

function dayOf(item: OpportunityView) {
  return item.createdAt.slice(0, 10)
}

export default function Approvals() {
  const queue = useGet<OpportunityView[]>('/opportunities/pending')
  const history = useGet<OpportunityView[]>('/opportunities/all')
  const catalogue = useCatalogue()
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState('all')
  const [sector, setSector] = useState('')
  const [interest, setInterest] = useState('')
  const [outcome, setOutcome] = useState<Decision | 'any'>('waiting')
  const [preset, setPreset] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')
  const [printing, setPrinting] = useState<{ day: string; label: string } | null>(null)

  const state = combine(queue, history)

  async function decide(id: string, decision: 'APPROVE' | 'REJECT') {
    setError('')
    setBusy(id)

    try {
      await api.patch(`/opportunities/${id}/status`, {
        decision,
        reviewNote: notes[id]?.trim() ? notes[id].trim() : null,
      })
      state.reload()
    } catch (problem) {
      setError(messageFor(problem))
    } finally {
      setBusy('')
    }
  }

  function choosePreset(value: string) {
    const span = rangeFor(value)

    setPreset(value)

    if (value !== 'custom') {
      setFrom(span.from)
      setTo(span.to)
    }
  }

  const items = state.data ?? []
  const words = query.trim().toLowerCase()

  // Every filter but the outcome. The summary counts all outcomes so it can
  // show how they split; the list underneath then shows the one asked for.
  function inScope(item: OpportunityView, span: Span) {
    return (
      decisionOf(item) !== null &&
      (mode === 'all' || item.mode === mode) &&
      (sector === '' || item.sector === sector) &&
      (interest === '' || item.categories.includes(interest)) &&
      within(dayOf(item), span) &&
      (words === '' ||
        `${item.title} ${item.creator.name} ${item.sector ?? ''} ${item.location ?? ''}`
          .toLowerCase()
          .includes(words))
    )
  }

  const span = { from, to }
  const scoped = items.filter(item => inScope(item, span))
  const earlierSpan = previousSpan(span, preset)
  const earlier = earlierSpan ? items.filter(item => inScope(item, earlierSpan)) : null
  const against = earlierSpan ? spanLabel(earlierSpan) : null

  const now = tallyApprovals(scoped)
  const then = earlier ? tallyApprovals(earlier) : null
  const interests = topInterests(scoped.map(item => item.categories))

  const visible = scoped
    .filter(item => outcome === 'any' || decisionOf(item) === outcome)
    .sort((a, b) =>
      outcome === 'waiting' ? dayOf(a).localeCompare(dayOf(b)) : dayOf(b).localeCompare(dayOf(a)),
    )

  const counts: Record<Decision | 'any', number> = {
    waiting: now.waiting,
    approved: now.approved,
    rejected: now.rejected,
    any: now.submitted,
  }

  const change = (a: number, b: number | undefined, upIsGood: boolean | null) =>
    b === undefined || against === null ? null : { amount: a - b, against, kind: 'count' as const, upIsGood }

  const tiles: Tile[] = [
    { label: 'Proposed', value: String(now.submitted), change: change(now.submitted, then?.submitted, true) },
    {
      label: 'Approved',
      value: String(now.approved),
      note: now.rate === null ? undefined : `${now.rate}% of decisions`,
      change: change(now.approved, then?.approved, true),
    },
    { label: 'Rejected', value: String(now.rejected), change: change(now.rejected, then?.rejected, null) },
    { label: 'Waiting', value: String(now.waiting), note: 'still to decide' },
  ]

  const lede =
    now.submitted === 0
      ? `${periodPhrase(span)}, nothing was proposed that matches these filters.`
      : `${periodPhrase(span)}, ${quantity(now.submitted, 'initiative was', 'initiatives were')} proposed` +
        `${comparePhrase(now.submitted, then?.submitted ?? null, against)}.` +
        interestPhrase(interests.top)

  const summary = (
    <Summary
      heading="Initiatives proposed in this period"
      lede={lede}
      tiles={tiles}
      interests={interests}
      interestNote={`Out of ${quantity(scoped.length, 'initiative')}. One initiative can have several.`}
    />
  )

  const interestOptions = [
    ...new Set([...(catalogue.data?.interests ?? []), ...items.flatMap(item => item.categories)]),
  ].sort((a, b) => a.localeCompare(b))

  const periodLine = from === '' || to === '' ? 'Everything from the last 12 months' : `Proposed ${spanLabel(span)} ${to.slice(0, 4)}`
  const filterLine =
    meta(
      mode === 'all' ? null : kindOf(mode),
      sector || null,
      interest || null,
      words === '' ? null : `matching “${query.trim()}”`,
    ) || 'No other filters'

  return (
    <>
      <section className="banner banner--approvals">
        <h1 className="banner__title">Approvals</h1>
      </section>

      <div className="toolbar" data-tour="approval-filters">
        <input
          className="input toolbar__search"
          placeholder="Search by title, resident or place"
          aria-label="Search the queue"
          value={query}
          onChange={event => setQuery(event.target.value)}
        />
        <span className="toolbar__field">
          <label className="toolbar__label" htmlFor="approval-outcome">Showing</label>
          <select
            id="approval-outcome"
            className="input toolbar__select"
            value={outcome}
            onChange={event => setOutcome(event.target.value as Decision | 'any')}
          >
            {OUTCOMES.map(option => (
              <option key={option.id} value={option.id}>
                {state.data ? `${option.label} (${counts[option.id]})` : option.label}
              </option>
            ))}
          </select>
        </span>
        <span className="toolbar__field">
          <label className="toolbar__label" htmlFor="approval-kind">Kind</label>
          <select
            id="approval-kind"
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
          <label className="toolbar__label" htmlFor="approval-sector">Sector</label>
          <select
            id="approval-sector"
            className="input toolbar__select"
            value={sector}
            onChange={event => setSector(event.target.value)}
          >
            <option value="">Any sector</option>
            {SECTORS.map(option => <option key={option} value={option}>{option}</option>)}
          </select>
        </span>
        <span className="toolbar__field">
          <label className="toolbar__label" htmlFor="approval-interest">Interest</label>
          <select
            id="approval-interest"
            className="input toolbar__select"
            value={interest}
            onChange={event => setInterest(event.target.value)}
          >
            <option value="">Any interest</option>
            {interestOptions.map(option => <option key={option} value={option}>{option}</option>)}
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
        <Button
          variant="primary"
          className="btn--small"
          style={{ marginLeft: 'auto' }}
          disabled={!state.data || printing !== null}
          onClick={() => setPrinting(stamp())}
        >
          Download report (PDF)
        </Button>
      </div>

      {error && <p className="error" role="alert">{error}</p>}

      <Loaded state={state} what="the queue">
        {() => (
          <>
            {summary}

            <p className="toolbar__count" style={{ marginBottom: 10 }}>
              {quantity(visible.length, 'initiative')} {OUTCOMES.find(option => option.id === outcome)?.count}
              {from !== '' && to !== '' && ` · proposed ${spanLabel(span)}`}
            </p>

            {visible.length === 0 ? (
              <EmptyState>
                {outcome === 'waiting' && scoped.length === now.waiting
                  ? 'Nothing is waiting for a decision.'
                  : 'Nothing matches that.'}
              </EmptyState>
            ) : (
              <div className="cards">
                {visible.map(item =>
                  decisionOf(item) === 'waiting' ? (
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
                  ) : (
                    <article key={item.id} className="review review--decided">
                      <div className="review__head">
                        <div>
                          <h3 className="review__title">{item.title}</h3>
                          <div className="data__meta">
                            {meta(item.creator.name, kindOf(item.mode), item.sector)}
                          </div>
                          <div className="data__meta">Proposed {longDate(item.createdAt)}</div>
                        </div>
                        <StatusBadge tone={decisionOf(item) === 'approved' ? 'ok' : 'bad'}>
                          {decisionOf(item) === 'approved' ? 'Approved' : 'Rejected'}
                        </StatusBadge>
                      </div>

                      <p className="review__body">{item.description}</p>

                      <div className="cluster" style={{ marginBottom: 12 }}>
                        {item.categories.map(tag => <Tag key={tag}>{tag}</Tag>)}
                      </div>

                      {item.reviewNote && (
                        <p className="review__note">
                          <strong>Feedback sent:</strong> {item.reviewNote}
                        </p>
                      )}
                    </article>
                  ),
                )}
              </div>
            )}
          </>
        )}
      </Loaded>

      {printing && (
        <PrintReport
          title="Approvals report"
          file={`fasha-approvals-${printing.day}`}
          lines={[periodLine, filterLine, `Prepared on ${printing.label}`]}
          onDone={() => setPrinting(null)}
        >
          {summary}

          <ReportRows heading={`${quantity(visible.length, 'initiative')}: ${OUTCOMES.find(option => option.id === outcome)?.label.toLowerCase()}`}>
            {visible.length === 0 ? (
              <p className="report__empty">Nothing matches these filters.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Initiative</th>
                    <th>Proposed by</th>
                    <th>Proposed</th>
                    <th>Kind</th>
                    <th>Sector</th>
                    <th>Interests</th>
                    <th>Outcome</th>
                    <th>Feedback</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map(item => (
                    <tr key={item.id}>
                      <td>{item.title}</td>
                      <td>{item.creator.name}</td>
                      <td>{longDate(item.createdAt)}</td>
                      <td>{kindOf(item.mode)}</td>
                      <td>{item.sector ?? ''}</td>
                      <td>{item.categories.join(', ')}</td>
                      <td>{OUTCOME_LABEL[decisionOf(item) ?? 'waiting']}</td>
                      <td>{item.reviewNote ?? ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </ReportRows>
        </PrintReport>
      )}
    </>
  )
}
