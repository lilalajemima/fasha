import { useState } from 'react'
import { Loaded } from '../../components/Loader'
import { Button, EmptyState, StatusBadge, Tag, TextField } from '../../components/ui'
import { api } from '../../lib/api'
import { longDate, meta, quantity } from '../../lib/format'
import { SECTORS } from '../../lib/sectors'
import type { OpportunityView } from '../../lib/types'
import { messageFor, useGet } from '../../lib/useGet'
import { kindOf } from './filters'
import '../../styles/workspace.css'
import './Admin.css'

export default function Approvals() {
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
      <section className="banner banner--approvals">
        <h1 className="banner__title">Approvals</h1>
      </section>

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
            <>
              <p className="toolbar__count" style={{ marginBottom: 10 }}>
                {quantity(visible.length, 'opportunity', 'opportunities')} waiting
              </p>

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
            </>
          )
        }}
      </Loaded>
    </>
  )
}
