import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import Imigongo from '../../components/Imigongo'
import { Loaded } from '../../components/Loader'
import Logo from '../../components/Logo'
import { Button, Card, EmptyState, Field, StatusBadge } from '../../components/ui'
import { api } from '../../lib/api'
import { timeOfDay } from '../../lib/format'
import type { ApplicationView, CheckinView } from '../../lib/types'
import { messageFor, useGet } from '../../lib/useGet'

function CheckInForm({ accepted }: { accepted: ApplicationView[] }) {
  const [opportunityId, setOpportunityId] = useState(accepted[0]?.opportunity.id ?? '')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [checkin, setCheckin] = useState<CheckinView | null>(null)

  async function checkIn(event: FormEvent) {
    event.preventDefault()
    setError('')
    setBusy(true)

    try {
      setCheckin(await api.post<CheckinView>(`/opportunities/${opportunityId}/checkins`, { code }))
      setCode('')
    } catch (problem) {
      setError(messageFor(problem))
    } finally {
      setBusy(false)
    }
  }

  async function checkOut() {
    if (!checkin) return
    setError('')
    setBusy(true)

    try {
      setCheckin(await api.patch<CheckinView>(`/checkins/${checkin.id}/checkout`))
    } catch (problem) {
      setError(messageFor(problem))
    } finally {
      setBusy(false)
    }
  }

  if (checkin) {
    return (
      <Card>
        <h2 style={{ color: 'var(--ok)' }}>
          {checkin.checkedOutAt ? '✓ You are checked out' : '✓ You are checked in'}
        </h2>
        <h3>{checkin.opportunity.title}</h3>
        <p className="muted">
          In at {timeOfDay(checkin.checkedInAt)}
          {checkin.checkedOutAt ? ` · out at ${timeOfDay(checkin.checkedOutAt)}` : ''}
        </p>

        {checkin.checkedOutAt ? (
          <>
            <hr />
            <h3>{checkin.hours} hours recorded</h3>
            <p className="muted">They are already on your portfolio.</p>
            <Link to="/portfolio"><Button block>View portfolio</Button></Link>
          </>
        ) : (
          <>
            <hr />
            <p className="muted">Check out before you leave so your hours are recorded.</p>
            <Button block variant="primary" disabled={busy} onClick={checkOut}>
              {busy ? 'Checking out…' : 'Check out now'}
            </Button>
          </>
        )}

        {error && <p className="error" role="alert">{error}</p>}
      </Card>
    )
  }

  return (
    <Card>
      <h2>Enter the code</h2>
      <p className="muted">
        The organiser is showing a six digit code that changes every 30 seconds. Type the one on
        screen now.
      </p>

      <form onSubmit={checkIn}>
        <div className="field">
          <label className="label" htmlFor="opportunity">Which opportunity?</label>
          <select
            id="opportunity"
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

        <Field
          id="code"
          label="Six digit code"
          inputMode="numeric"
          maxLength={6}
          placeholder="000000"
          value={code}
          required
          onChange={event => setCode(event.target.value.replace(/\D/g, ''))}
        />

        {error && <p className="error" role="alert">{error}</p>}

        <Button type="submit" variant="primary" block disabled={busy || code.length !== 6}>
          {busy ? 'Checking in…' : 'Check in'}
        </Button>
      </form>

      <p className="muted" style={{ marginTop: 14, marginBottom: 0 }}>
        A code only works for about a minute, so a screenshot taken earlier will be refused.
      </p>
    </Card>
  )
}

export default function CheckIn() {
  const applications = useGet<ApplicationView[]>('/applications/mine')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-base)' }}>
      <header className="topbar" style={{ padding: '12px 16px' }}>
        <Logo size={22} />
        <Link to="/activity">← My activity</Link>
      </header>

      <main style={{ maxWidth: 430, margin: '0 auto', padding: '22px 16px 56px' }}>
        <h1 style={{ fontSize: 27 }}>You&rsquo;re in the right place.</h1>
        <p className="lede">Check in when you arrive, and check out before you leave.</p>
        <div style={{ margin: '16px 0 18px' }}><Imigongo /></div>

        <Loaded state={applications} what="your accepted places">
          {items => {
            const accepted = items.filter(item => item.status === 'ACCEPTED')

            if (accepted.length === 0) {
              return (
                <EmptyState>
                  You have no accepted places yet, so there is nothing to check in to.
                </EmptyState>
              )
            }

            return (
              <>
                <StatusBadge tone="ok">ACCEPTED ATTENDEE</StatusBadge>
                <div style={{ marginTop: 18 }}>
                  <CheckInForm accepted={accepted} />
                </div>
              </>
            )
          }}
        </Loaded>
      </main>
    </div>
  )
}
