import { useEffect, useState } from 'react'
import PageHeader from '../../components/PageHeader'
import { Button, Card, FileDrop, StatTile, StatusBadge } from '../../components/ui'
import { getAttendees } from '../../mocks/api'
import type { AttendanceStatus, Attendee } from '../../mocks/types'

const WINDOW_SECONDS = 30
const tone: Record<AttendanceStatus, 'ok' | 'bad' | 'neutral'> =
  { 'Checked in': 'ok', 'Checked out': 'bad', 'Not arrived': 'neutral' }

export default function Attendance() {
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [secondsLeft, setSecondsLeft] = useState(18)

  useEffect(() => { getAttendees().then(setAttendees) }, [])

  // Mirrors the 30-second TOTP window the verification API will use.
  useEffect(() => {
    const timer = setInterval(() => setSecondsLeft(s => (s <= 1 ? WINDOW_SECONDS : s - 1)), 1000)
    return () => clearInterval(timer)
  }, [])

  const counts = {
    in: attendees.filter(a => a.status === 'Checked in').length,
    out: attendees.filter(a => a.status === 'Checked out').length,
    absent: attendees.filter(a => a.status === 'Not arrived').length,
  }

  return (
    <>
      <PageHeader
        eyebrow="Physical event · 10 October"
        title="Kimironko planting morning"
        meta="Kimironko wetland · 09:00-12:00 · 18 accepted volunteers"
        action={<Button>Export attendance</Button>}
      />

      <div className="page-grid">
        <Card>
          <h2>Scan to check in or out</h2>
          <StatusBadge tone="bad">Event QR · illustrative</StatusBadge>

          <div style={{ display: 'grid', placeItems: 'center', margin: '20px 0' }}>
            <div style={{ width: 220, height: 220, background: 'var(--surface-muted)',
                          border: '1px solid var(--neutral-border)', borderRadius: 'var(--radius-sm)',
                          display: 'grid', placeItems: 'center', textAlign: 'center', padding: 16 }}>
              <span className="muted">
                The QR renders here once the verification API issues a code
              </span>
            </div>
          </div>

          <div className="row">
            <span className="muted">Next refresh in</span>
            <strong className="stat-value" style={{ fontSize: 24, color: 'var(--primary)' }}>
              00:{String(secondsLeft).padStart(2, '0')}
            </strong>
          </div>
          <div style={{ height: 3, background: 'var(--neutral-border)', borderRadius: 2, margin: '10px 0 18px' }}>
            <div style={{ width: `${(secondsLeft / WINDOW_SECONDS) * 100}%`, height: 3,
                          background: 'var(--primary)', borderRadius: 2 }} />
          </div>

          <h3>Refreshes every 30 seconds</h3>
          <p className="muted">
            Volunteers scan in their phone browser on arrival, then scan again when leaving.
          </p>
          <Button block>Present QR</Button>
          <p className="muted" style={{ marginTop: 14 }}>
            Only the current or immediately preceding 30-second window is accepted, so a
            photographed code cannot be reused.
          </p>

          <Card variant="tint">
            <h3 style={{ color: 'var(--primary)' }}>Invalid or expired code</h3>
            <p className="muted" style={{ margin: 0 }}>
              The volunteer is guided to scan the newest event code. Old screenshots are not accepted.
            </p>
          </Card>
        </Card>

        <div className="stack">
          <Card>
            <div className="stat-row">
              <StatTile label="Checked in" value={counts.in} />
              <StatTile label="Checked out" value={counts.out} />
              <StatTile label="Not arrived" value={counts.absent} />
            </div>
          </Card>

          <Card>
            <h2>Volunteer attendance</h2>
            <table className="table">
              <thead>
                <tr><th>Volunteer</th><th>Check-in</th><th>Check-out</th><th>Status</th></tr>
              </thead>
              <tbody>
                {attendees.map(attendee => (
                  <tr key={attendee.id}>
                    <td>{attendee.name}</td>
                    <td>{attendee.checkIn ?? '—'}</td>
                    <td>{attendee.checkOut ?? '—'}</td>
                    <td><StatusBadge tone={tone[attendee.status]}>{attendee.status}</StatusBadge></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="muted" style={{ marginTop: 14, marginBottom: 0 }}>
              Showing {attendees.length} of 18 volunteers · all times local (CAT)
            </p>
          </Card>

          <Card>
            <h2>Event photo evidence</h2>
            <p className="muted">Add photos of the completed work for the event record.</p>
            <div className="two-col" style={{ marginBottom: 14 }}>
              {['planting-team.jpg', 'saplings.jpg'].map(name => (
                <div key={name}>
                  <div style={{ height: 120, background: 'var(--surface-muted)',
                                border: '1px solid var(--neutral-border)',
                                borderRadius: 'var(--radius-sm)' }} />
                  <div className="muted" style={{ marginTop: 6 }}>{name}</div>
                </div>
              ))}
            </div>
            <FileDrop label="Upload event photos" hint="JPG or PNG · up to 10 MB each" />
            <div style={{ marginTop: 18 }}>
              <Button variant="primary">Save event evidence</Button>
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
