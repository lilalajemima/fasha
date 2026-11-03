import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Imigongo from '../../components/Imigongo'
import { Loaded } from '../../components/Loader'
import Logo from '../../components/Logo'
import QrScanner, { type ScannedCode } from '../../components/QrScanner'
import { Button, Card, EmptyState, Field, StatusBadge, Tabs } from '../../components/ui'
import { api } from '../../lib/api'
import { timeOfDay } from '../../lib/format'
import type { ApplicationView, CheckinView } from '../../lib/types'
import { messageFor, useGet } from '../../lib/useGet'
import './CheckIn.css'

function CodeField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <Field
      id="code"
      label="Six digit code"
      inputMode="numeric"
      maxLength={6}
      placeholder="000000"
      value={value}
      required
      onChange={event => onChange(event.target.value.replace(/\D/g, ''))}
    />
  )
}

function CheckInPanel({ accepted, scanned, onDone }: {
  accepted: ApplicationView[]
  scanned: ScannedCode | null
  onDone: () => void
}) {
  const [opportunityId, setOpportunityId] = useState(
    scanned?.opportunityId || accepted[0]?.opportunity.id || '',
  )
  const [code, setCode] = useState(scanned?.code ?? '')
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function take(found: ScannedCode) {
    setOpportunityId(found.opportunityId)
    setCode(found.code)
    setScanning(false)
  }

  async function checkIn(event: FormEvent) {
    event.preventDefault()
    setError('')
    setBusy(true)

    try {
      await api.post<CheckinView>(`/opportunities/${opportunityId}/checkins`, { code })
      setCode('')
      onDone()
    } catch (problem) {
      setError(messageFor(problem))
    } finally {
      setBusy(false)
    }
  }

  if (accepted.length === 0) {
    return (
      <EmptyState>
        You have no accepted places yet, so there is nothing to check in to.
      </EmptyState>
    )
  }

  if (scanning) {
    return <QrScanner onFound={take} onClose={() => setScanning(false)} />
  }

  return (
    <Card>
      <h2>Check in</h2>
      <p className="muted">
        Scan the organiser&rsquo;s code, or type the six digits showing on their screen.
      </p>

      <Button block onClick={() => setScanning(true)}>Scan the code</Button>

      <form onSubmit={checkIn} style={{ marginTop: 18 }}>
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

        <CodeField value={code} onChange={setCode} />

        {error && <p className="error" role="alert">{error}</p>}

        <Button type="submit" variant="primary" block disabled={busy || code.length !== 6}>
          {busy ? 'Checking in…' : 'Check in'}
        </Button>
      </form>

      <p className="muted" style={{ marginTop: 14, marginBottom: 0 }}>
        A code lasts about a minute, so a screenshot taken earlier will be refused.
      </p>
    </Card>
  )
}

function CheckOutPanel({ open, scanned, onDone }: {
  open: CheckinView[]
  scanned: ScannedCode | null
  onDone: () => void
}) {
  const [checkinId, setCheckinId] = useState(open[0]?.id ?? '')
  const [code, setCode] = useState(scanned?.code ?? '')
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<CheckinView | null>(null)

  function take(found: ScannedCode) {
    const match = open.find(entry => entry.opportunity.id === found.opportunityId)

    if (match) setCheckinId(match.id)

    setCode(found.code)
    setScanning(false)
  }

  async function checkOut(event: FormEvent) {
    event.preventDefault()
    setError('')
    setBusy(true)

    try {
      setDone(await api.patch<CheckinView>(`/checkins/${checkinId}/checkout`, { code }))
      setCode('')
      onDone()
    } catch (problem) {
      setError(messageFor(problem))
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <Card>
        <h2 style={{ color: 'var(--ok)' }}>✓ Checked out</h2>
        <h3>{done.opportunity.title}</h3>
        <p className="muted">
          In at {timeOfDay(done.checkedInAt)}
          {done.checkedOutAt ? `, out at ${timeOfDay(done.checkedOutAt)}` : ''}
        </p>
        <hr />
        <h3>{done.hours} hours recorded</h3>
        <p className="muted">They are already on your portfolio.</p>
        <Link to="/portfolio"><Button block>View portfolio</Button></Link>
      </Card>
    )
  }

  if (open.length === 0) {
    return (
      <EmptyState>
        You are not checked in anywhere at the moment.
      </EmptyState>
    )
  }

  if (scanning) {
    return <QrScanner onFound={take} onClose={() => setScanning(false)} />
  }

  return (
    <Card>
      <h2>Check out</h2>
      <p className="muted">
        Scan the organiser&rsquo;s code again before you leave, so your hours are recorded.
      </p>

      <Button block onClick={() => setScanning(true)}>Scan the code</Button>

      <form onSubmit={checkOut} style={{ marginTop: 18 }}>
        <div className="field">
          <label className="label" htmlFor="checkin">Where are you?</label>
          <select
            id="checkin"
            className="input"
            value={checkinId}
            onChange={event => setCheckinId(event.target.value)}
          >
            {open.map(entry => (
              <option key={entry.id} value={entry.id}>
                {entry.opportunity.title}, in at {timeOfDay(entry.checkedInAt)}
              </option>
            ))}
          </select>
        </div>

        <CodeField value={code} onChange={setCode} />

        {error && <p className="error" role="alert">{error}</p>}

        <Button type="submit" variant="primary" block disabled={busy || code.length !== 6}>
          {busy ? 'Checking out…' : 'Check out'}
        </Button>
      </form>
    </Card>
  )
}

export default function CheckIn() {
  const applications = useGet<ApplicationView[]>('/applications/mine')
  const openCheckins = useGet<CheckinView[]>('/checkins/mine')
  const [params] = useSearchParams()
  const [tab, setTab] = useState('')

  const code = (params.get('c') ?? '').replace(/\D/g, '').slice(0, 6)
  const opportunityId = params.get('o') ?? ''
  const scanned = opportunityId && code.length === 6 ? { opportunityId, code } : null

  const open = openCheckins.data ?? []
  const accepted = (applications.data ?? []).filter(item => item.status === 'ACCEPTED')
  const insideThisOne = scanned
    ? open.some(entry => entry.opportunity.id === scanned.opportunityId)
    : open.length > 0

  const current = tab || (insideThisOne ? 'out' : 'in')

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
          {() => (
            <>
              <StatusBadge tone={open.length > 0 ? 'ok' : 'neutral'}>
                {open.length > 0 ? 'CHECKED IN' : 'ACCEPTED ATTENDEE'}
              </StatusBadge>

              <div style={{ margin: '18px 0' }}>
                <Tabs
                  active={current}
                  onChange={setTab}
                  items={[
                    { id: 'in', label: 'Check in' },
                    { id: 'out', label: `Check out${open.length > 0 ? ` · ${open.length}` : ''}` },
                  ]}
                />
              </div>

              {current === 'out' ? (
                <CheckOutPanel
                  open={open}
                  scanned={scanned}
                  onDone={openCheckins.reload}
                />
              ) : (
                <CheckInPanel
                  accepted={accepted}
                  scanned={scanned}
                  onDone={() => {
                    openCheckins.reload()
                    setTab('out')
                  }}
                />
              )}
            </>
          )}
        </Loaded>
      </main>
    </div>
  )
}
