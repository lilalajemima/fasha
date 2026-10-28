import { useEffect, useState } from 'react'
import { Loaded, Problem } from '../../components/Loader'
import PageHeader from '../../components/PageHeader'
import { Button, Card, EmptyState, StatTile, StatusBadge } from '../../components/ui'
import { api } from '../../lib/api'
import { timeOfDay } from '../../lib/format'
import type { ApplicationView, CheckinCodeView, CheckinView, OpportunityView } from '../../lib/types'
import { messageFor, useGet } from '../../lib/useGet'

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
      <h2>Show this to check people in</h2>

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

          <div style={{ height: 3, background: 'var(--neutral-border)', borderRadius: 2, margin: '10px 0 18px' }}>
            <div
              style={{
                width: `${(Math.max(secondsLeft, 0) / 30) * 100}%`,
                height: 3,
                background: 'var(--primary)',
                borderRadius: 2,
              }}
            />
          </div>

          <h3>It changes every 30 seconds</h3>
          <p className="muted" style={{ marginBottom: 0 }}>
            Volunteers scan the code, or type the six digits into their own phone. Only the current
            window and the one before it are accepted, so a screenshot taken earlier will not work.
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

function Register({ opportunityId }: { opportunityId: string }) {
  const checkins = useGet<CheckinView[]>(`/opportunities/${opportunityId}/checkins`)
  const applicants = useGet<ApplicationView[]>(`/opportunities/${opportunityId}/applications`)
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
      await api.post(`/opportunities/${opportunityId}/checkins/manual`, { volunteerId })
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

  return (
    <div className="stack">
      <Card>
        <div className="stat-row">
          <StatTile label="Checked in" value={present.filter(entry => !entry.checkedOutAt).length} />
          <StatTile label="Checked out" value={present.filter(entry => entry.checkedOutAt).length} />
          <StatTile label="Not arrived" value={missing.length} />
        </div>
      </Card>

      {error && <p className="error" role="alert">{error}</p>}

      <Card>
        <h2>Volunteer attendance</h2>
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
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {items.map(entry => (
                    <tr key={entry.id}>
                      <td>{entry.volunteer.name}</td>
                      <td>{timeOfDay(entry.checkedInAt)}</td>
                      <td>{entry.checkedOutAt ? timeOfDay(entry.checkedOutAt) : '—'}</td>
                      <td>{entry.hours ?? '—'}</td>
                      <td>
                        <StatusBadge tone={entry.method === 'QR' ? 'ok' : 'neutral'}>
                          {entry.method === 'QR' ? 'Scanned' : 'By hand'}
                        </StatusBadge>
                      </td>
                      <td>
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
      </Card>

      <Card>
        <h2>Not arrived</h2>
        <p className="muted">
          If someone&rsquo;s phone will not work, you can mark them present yourself. It is recorded
          as by hand rather than scanned.
        </p>
        <div className="divided">
          {missing.map(item => (
            <div key={item.id} className="row">
              <span>{item.volunteer.name}</span>
              <Button
                disabled={busy === item.volunteer.id}
                onClick={() => markPresent(item.volunteer.id)}
              >
                Mark present
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

  const published = (mine.data ?? []).filter(item => item.status === 'PUBLISHED')
  const current = chosen || published[0]?.id || ''

  return (
    <>
      <PageHeader
        eyebrow="On the day"
        title="Attendance"
        meta="Open check in, watch people arrive, and record their hours."
      />

      {mine.error && <Problem message={mine.error} onRetry={mine.reload} />}

      {published.length === 0 ? (
        <EmptyState>
          You need a published opportunity before you can take attendance for it.
        </EmptyState>
      ) : (
        <>
          <Card>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label" htmlFor="event">Opportunity</label>
              <select
                id="event"
                className="input"
                value={current}
                onChange={event => setChosen(event.target.value)}
              >
                {published.map(item => (
                  <option key={item.id} value={item.id}>{item.title}</option>
                ))}
              </select>
            </div>
          </Card>

          <div className="page-grid" style={{ marginTop: 22 }}>
            <CodePanel key={current} opportunityId={current} />
            <Register key={`register-${current}`} opportunityId={current} />
          </div>
        </>
      )}
    </>
  )
}
