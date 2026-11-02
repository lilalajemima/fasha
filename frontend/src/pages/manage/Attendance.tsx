import { useEffect, useState } from 'react'
import { Loaded, Problem } from '../../components/Loader'
import PageHeader from '../../components/PageHeader'
import { Button, Card, EmptyState, StatTile, StatusBadge } from '../../components/ui'
import { api } from '../../lib/api'
import { sentenceCase, timeOfDay, whenLabel } from '../../lib/format'
import type { ApplicationView, CheckinCodeView, CheckinView, OpportunityView } from '../../lib/types'
import { messageFor, useGet } from '../../lib/useGet'
import './Attendance.css'

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
    <Card>
      <h2>Show this to check people in and out</h2>

      {error && <p className="error" role="alert">{error}</p>}

      {code ? (
        <>
          <div
            style={{ display: 'grid', placeItems: 'center', margin: '20px 0' }}
            dangerouslySetInnerHTML={{ __html: code.qrSvg }}
          />

          <div className="row">
            <strong className="stat-value" style={{ fontSize: 34, letterSpacing: 4 }}>
              {code.code}
            </strong>
            <strong className="stat-value" style={{ fontSize: 24, color: 'var(--primary)' }}>
              00:{String(Math.max(secondsLeft, 0)).padStart(2, '0')}
            </strong>
          </div>

          <div style={{ height: 3, background: 'var(--neutral-border)', borderRadius: 2,
                        margin: '10px 0 18px' }}>
            <div style={{ width: `${(Math.max(secondsLeft, 0) / 30) * 100}%`, height: 3,
                          background: 'var(--primary)', borderRadius: 2 }} />
          </div>

          <h3>The same code works both ways</h3>
          <p className="muted" style={{ marginBottom: 0 }}>
            Volunteers enter it when they arrive and again when they leave, so nobody can close
            themselves off from home. It changes every 30 seconds.
          </p>
        </>
      ) : (
        <>
          <p className="muted">
            Open check in when the event starts. A code appears here and refreshes itself.
          </p>
          <Button variant="primary" block disabled={open} onClick={() => setOpen(true)}>
            {open ? 'Opening…' : 'Open check in'}
          </Button>
        </>
      )}
    </Card>
  )
}

function Register({ opportunity }: { opportunity: OpportunityView }) {
  const checkins = useGet<CheckinView[]>(`/opportunities/${opportunity.id}/checkins`)
  const applicants = useGet<ApplicationView[]>(`/opportunities/${opportunity.id}/applications`)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')

  const present = checkins.data ?? []
  const accepted = (applicants.data ?? []).filter(item => item.status === 'ACCEPTED')
  const arrived = new Set(present.map(entry => entry.volunteer.id))
  const missing = accepted.filter(item => !arrived.has(item.volunteer.id))

  async function markPresent(volunteerId: string) {
    setError('')
    setBusy(volunteerId)

    try {
      await api.post(`/opportunities/${opportunity.id}/checkins/manual`, { volunteerId })
      checkins.reload()
    } catch (problem) {
      setError(messageFor(problem))
    } finally {
      setBusy('')
    }
  }

  async function checkOut(id: string) {
    setError('')
    setBusy(id)

    try {
      await api.patch(`/checkins/${id}/checkout`)
      checkins.reload()
    } catch (problem) {
      setError(messageFor(problem))
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
    } catch (problem) {
      setError(messageFor(problem))
    }
  }

  return (
    <div className="stack">
      <Card>
        <div className="stat-row">
          <StatTile label="Checked in" value={present.filter(entry => !entry.checkedOutAt).length} />
          <StatTile label="Checked out" value={present.filter(entry => entry.checkedOutAt).length} />
          <StatTile label="Not arrived" value={missing.length} />
          <StatTile
            label="Scanned"
            value={present.filter(entry => entry.method === 'QR').length}
            note={`${present.filter(entry => entry.method === 'MANUAL').length} by hand`}
          />
        </div>
      </Card>

      {error && <p className="error" role="alert">{error}</p>}

      <section className="card register">
        <div className="register__head">
          <h2 style={{ marginBottom: 4 }}>{opportunity.title}</h2>
          <p className="muted" style={{ margin: 0 }}>
            {whenLabel(opportunity.startsAt, opportunity.endsAt)} ·{' '}
            {opportunity.location ?? 'Online'}
          </p>
        </div>

        <div className="row register__hide">
          <h2 style={{ margin: 0 }}>Attendance</h2>
          <span className="cluster">
            <Button onClick={downloadCsv}>Download CSV</Button>
            <Button onClick={() => window.print()}>Print or save as PDF</Button>
          </span>
        </div>

        <Loaded state={checkins} what="the register">
          {items =>
            items.length === 0 ? (
              <EmptyState>Nobody has checked in yet.</EmptyState>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Volunteer</th>
                    <th>In</th>
                    <th>Out</th>
                    <th>Hours</th>
                    <th>How</th>
                    <th className="register__hide" />
                  </tr>
                </thead>
                <tbody>
                  {items.map(entry => (
                    <tr key={entry.id}>
                      <td>{entry.volunteer.name}</td>
                      <td>{timeOfDay(entry.checkedInAt)}</td>
                      <td>{entry.checkedOutAt ? timeOfDay(entry.checkedOutAt) : '—'}</td>
                      <td>{entry.hours ?? '—'}</td>
                      <td>{entry.method === 'QR' ? 'Scanned' : 'By hand'}</td>
                      <td className="register__hide">
                        {!entry.checkedOutAt && (
                          <Button disabled={busy === entry.id} onClick={() => checkOut(entry.id)}>
                            Check out
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
        </Loaded>
      </section>

      <Card>
        <h2>Not arrived</h2>
        <p className="muted">
          If someone&rsquo;s phone will not work, check them in yourself. It is recorded as by hand
          rather than scanned, and you can close them off from the table above.
        </p>
        <div className="divided">
          {missing.map(item => (
            <div key={item.id} className="row">
              <span>{item.volunteer.name}</span>
              <Button
                disabled={busy === item.volunteer.id}
                onClick={() => markPresent(item.volunteer.id)}
              >
                Check in by hand
              </Button>
            </div>
          ))}
          {missing.length === 0 && accepted.length > 0 && (
            <EmptyState>Everyone accepted has arrived.</EmptyState>
          )}
          {accepted.length === 0 && (
            <EmptyState>Nobody has been accepted onto this one yet.</EmptyState>
          )}
        </div>
      </Card>
    </div>
  )
}

export default function Attendance() {
  const mine = useGet<OpportunityView[]>('/opportunities/mine')
  const [chosen, setChosen] = useState('')
  const [query, setQuery] = useState('')

  const published = (mine.data ?? []).filter(item => item.status === 'PUBLISHED')
  const current = published.find(item => item.id === chosen)
  const words = query.trim().toLowerCase()

  if (current) {
    return (
      <>
        <p style={{ marginBottom: 18 }}>
          <button className="linkbtn" onClick={() => setChosen('')}>← All events</button>
        </p>

        <PageHeader
          eyebrow={whenLabel(current.startsAt, current.endsAt)}
          title={current.title}
          meta={`${current.location ?? 'Online'} · ${current.sector ?? 'Sector not set'} · up to ${current.maxCapacity} volunteers`}
        />

        <div className="page-grid">
          <CodePanel opportunityId={current.id} />
          <Register opportunity={current} />
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        eyebrow="On the day"
        title="Attendance"
        meta="Pick an event to open check in, watch people arrive and export the register."
      />

      {mine.error && <Problem message={mine.error} onRetry={mine.reload} />}

      <div style={{ marginBottom: 20 }}>
        <input
          className="input"
          placeholder="Search your events"
          value={query}
          aria-label="Search your events"
          onChange={event => setQuery(event.target.value)}
        />
      </div>

      <Loaded state={mine} what="your events">
        {() => {
          const visible = published.filter(item =>
            `${item.title} ${item.sector ?? ''} ${item.location ?? ''}`
              .toLowerCase()
              .includes(words),
          )

          if (published.length === 0) {
            return (
              <EmptyState>
                You need a published opportunity before you can take attendance for it.
              </EmptyState>
            )
          }

          if (visible.length === 0) {
            return <EmptyState>Nothing matches that search.</EmptyState>
          }

          return (
            <div className="events">
              {visible.map(item => (
                <article key={item.id} className="event-card">
                  <div>
                    <h3>{item.title}</h3>
                    <p className="event-card__meta">
                      {whenLabel(item.startsAt, item.endsAt)} · {item.location ?? 'Online'}
                    </p>
                    <p className="event-card__meta">
                      {item.sector ?? 'Sector not set'} · {sentenceCase(item.mode)} · up to{' '}
                      {item.maxCapacity} volunteers
                    </p>
                  </div>
                  <span className="cluster">
                    <StatusBadge tone="ok">Published</StatusBadge>
                    <Button variant="primary" onClick={() => setChosen(item.id)}>
                      Take attendance
                    </Button>
                  </span>
                </article>
              ))}
            </div>
          )
        }}
      </Loaded>
    </>
  )
}
