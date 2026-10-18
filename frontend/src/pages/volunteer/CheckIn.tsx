import { useState } from 'react'
import { Link } from 'react-router-dom'
import Imigongo from '../../components/Imigongo'
import Logo from '../../components/Logo'
import { Button, Card, StatusBadge } from '../../components/ui'

type ScanState = 'ready' | 'checked-in' | 'expired' | 'unknown'


export default function CheckIn() {
  const [state, setState] = useState<ScanState>('ready')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-base)' }}>
      <header className="topbar" style={{ padding: '12px 16px' }}>
        <Logo size={22} />
        <Link to="/activity">← My activity</Link>
      </header>

      <main style={{ maxWidth: 430, margin: '0 auto', padding: '22px 16px 56px' }}>
        <h1 style={{ fontSize: 27 }}>You&rsquo;re in the right place.</h1>
        <p className="lede">Scan the organiser&rsquo;s event QR to check in or check out.</p>
        <div style={{ margin: '16px 0 18px' }}><Imigongo /></div>

        <StatusBadge tone="ok">VOLUNTEER · ACCEPTED ATTENDEE</StatusBadge>

        <div className="camera" style={{ margin: '18px 0' }}>
          <div style={{ textAlign: 'center', color: 'var(--primary)' }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 8a2 2 0 012-2h1.5l1-2h7l1 2H18a2 2 0 012 2v9a2 2 0 01-2 2H6a2 2 0 01-2-2z" />
              <circle cx="12" cy="12.5" r="3.2" />
            </svg>
            <div className="muted" style={{ marginTop: 10 }}>Camera preview appears here</div>
          </div>
        </div>

        <Card>
          <h2>Allow camera access</h2>
          <p className="muted">
            Your browser will ask for camera permission. Allow it to scan the event QR, no app
            download needed.
          </p>
          <Button variant="primary" block onClick={() => setState('checked-in')}>
            Allow camera &amp; scan
          </Button>
          <p className="muted" style={{ marginTop: 12, marginBottom: 0 }}>
            If access is blocked, open your browser&rsquo;s site settings and enable Camera for Fasha.
          </p>
        </Card>

        <div className="stack" style={{ marginTop: 18 }}>
          {state === 'checked-in' && (
            <Card>
              <h2 style={{ color: 'var(--ok)' }}>✓ You&rsquo;re checked in</h2>
              <h3>Kimironko planting morning</h3>
              <p className="muted">10 Oct 2026 · 09:02 CAT<br />Kimironko wetland</p>
              <hr />
              <p className="muted">Before leaving, scan the latest code again to check out.</p>
              <Button block onClick={() => setState('ready')}>Scan to check out</Button>
            </Card>
          )}

          {state === 'expired' && (
            <>
              <Card variant="tint">
                <h3 style={{ color: 'var(--primary)' }}>This code has expired</h3>
                <p className="muted" style={{ margin: 0 }}>
                  Ask the organiser for the newest QR and scan again. It refreshes every 30 seconds,
                  so a saved screenshot may be too old.
                </p>
              </Card>
              <Button block onClick={() => setState('ready')}>Try a fresh code</Button>
            </>
          )}

          {state === 'unknown' && (
            <Card variant="tint">
              <h3 style={{ color: 'var(--primary)' }}>Code not recognised</h3>
              <p className="muted" style={{ margin: 0 }}>
                Make sure you&rsquo;re scanning the QR for this event, not a link from another initiative.
              </p>
            </Card>
          )}

          <div className="cluster">
            <Button onClick={() => setState('expired')}>Preview expired code</Button>
            <Button onClick={() => setState('unknown')}>Preview unknown code</Button>
          </div>
        </div>
      </main>
    </div>
  )
}
