import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, StatusBadge } from '../../components/ui'

type ScanState = 'ready' | 'checked-in' | 'expired' | 'unknown'

/**
 * Mobile check-in page, opened in the phone browser. The real scanner and the
 * rotating 30-second code arrive with the verification API; the states are wired here.
 */
export default function CheckIn() {
  const [state, setState] = useState<ScanState>('ready')

  return (
    <div style={{ maxWidth: 420, margin: '0 auto', padding: 20 }}>
      <div className="row" style={{ marginBottom: 20 }}>
        <strong>fasha</strong>
        <Link to="/activity">&larr; My activity</Link>
      </div>

      <h1>You are in the right place.</h1>
      <p className="lede">Scan the organiser&rsquo;s event QR to check in or check out.</p>
      <StatusBadge tone="ok">Volunteer - accepted attendee</StatusBadge>

      <div style={{ background: '#1d211f', color: '#fff', borderRadius: 'var(--radius)',
                    height: 220, display: 'grid', placeItems: 'center', margin: '20px 0' }}>
        <span className="muted" style={{ color: '#cfd4d0' }}>Camera preview appears here</span>
      </div>

      <Card>
        <h2>Allow camera access</h2>
        <p className="muted">
          Your browser will ask for camera permission. Allow it to scan the event QR, no app download needed.
        </p>
        <Button variant="primary" block onClick={() => setState('checked-in')}>Allow camera &amp; scan</Button>
        <p className="muted" style={{ marginTop: 10 }}>
          If access is blocked, open your browser&rsquo;s site settings and enable Camera for Fasha.
        </p>
      </Card>

      <div className="stack" style={{ marginTop: 20 }}>
        {state === 'checked-in' && (
          <Card variant="tint">
            <h2>You are checked in</h2>
            <h3>Kimironko planting morning</h3>
            <p className="muted">10 Oct 2026 - 09:02 CAT<br />Kimironko wetland</p>
            <hr />
            <p className="muted">Before leaving, scan the latest code again to check out.</p>
            <Button block onClick={() => setState('ready')}>Scan to check out</Button>
          </Card>
        )}

        {state === 'expired' && (
          <Card variant="note">
            <h3>This code has expired</h3>
            <p className="muted">
              Ask the organiser for the newest QR and scan again. It refreshes every 30 seconds,
              so a saved screenshot may be too old.
            </p>
            <Button block onClick={() => setState('ready')}>Try a fresh code</Button>
          </Card>
        )}

        {state === 'unknown' && (
          <Card>
            <h3 style={{ color: 'var(--bad-fg)' }}>Code not recognised</h3>
            <p className="muted" style={{ margin: 0 }}>
              Make sure you are scanning the QR for this event, not a link from another initiative.
            </p>
          </Card>
        )}

        <div className="cluster">
          <Button onClick={() => setState('expired')}>Preview expired state</Button>
          <Button onClick={() => setState('unknown')}>Preview unknown code</Button>
        </div>
      </div>
    </div>
  )
}
