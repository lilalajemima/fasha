import { useEffect, useState } from 'react'
import { Button, Card, FileDrop, StatTile, StatusBadge } from '../../components/ui'
import { getAttendees } from '../../mocks/api'
import type { Attendee, AttendanceStatus } from '../../mocks/types'

const WINDOW_SECONDS = 30
const tone: Record<AttendanceStatus, 'ok' | 'neutral'> =
  { 'Checked in': 'ok', 'Checked out': 'ok', 'Not arrived': 'neutral' }

export default function Attendance() {
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [secondsLeft, setSecondsLeft] = useState(WINDOW_SECONDS)

  useEffect(() => { getAttendees().then(setAttendees) }, [])

  // The countdown mirrors the 30-second TOTP window the verification API will use.
  useEffect(() => {
    const timer = setInterval(() => setSecondsLeft(s => (s <= 1 ? WINDOW_SECONDS : s - 1)), 1000)
    return () => clearInterval(timer)
  }, [])

  const counts = {
    in: attendees.filter(a => a.status === 'Checked in').length,
    out: attendees.filter(a => a.status === 'Checked out').length,
    absent: attendees.filter(a => a.status === 'Not arrived').length,
  }
  const progress = (secondsLeft / WINDOW_SECONDS) * 100

  return (
    <>
      <div className="row">
        <div>
          <p className="eyebrow">Physical event - 10 October</p>
          <h1>Kimironko planting morning</h1>
          <p className="lede">Kimironko wetland - 09:00-12:00 - 18 accepted volunteers</p>
        </div>
        <Button>Export attendance</Button>
      </div>

      <div className="page-grid">
        <Card>
          <h2>Scan to check in or out</h2>
          <StatusBadge tone="ok">Event QR - illustrative</StatusBadge>

          <div style={{ background: 'var(--chip)', borderRadius: 'var(--radius)', height: 230,
                        display: 'grid', placeItems: 'center', margin: '16px 0' }}>
            <span className="muted">QR code renders here once the verification API is connected</span>
          </div>

          <div className="row">
            <span className="muted">Next refresh in</span>
            <strong style={{ fontSize: 22 }}>00:{String(secondsLeft).padStart(2, '0')}</strong>
          </div>
          <div style={{ height: 4, background: 'var(--chip)', borderRadius: 2, margin: '8px 0 16px' }}>
            <div style={{ width: `${progress}%`, height: 4, background: 'var(--navy-900)', borderRadius: 2 }} />
          </div>

          <h3>Refreshes every 30 seconds</h3>
          <p className="muted">
            Volunteers scan in their phone browser on arrival, then scan again when leaving.
          </p>
          <Button block>Present QR</Button>
          <p className="muted" style={{ marginTop: 12 }}>
            Only the current or immediately preceding 30-second window is accepted,
            so a photographed code cannot be reused.
          </p>
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
                    <td>{attendee.checkIn ?? '-'}</td>
                    <td>{attendee.checkOut ?? '-'}</td>
                    <td><StatusBadge tone={tone[attendee.status]}>{attendee.status}</StatusBadge></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="muted" style={{ marginTop: 12 }}>
              Showing {attendees.length} of 18 volunteers - all times local (CAT)
            </p>
          </Card>

          <Card>
            <h2>Event photo evidence</h2>
            <p className="muted">Add photos of the completed work for the event record.</p>
            <FileDrop label="Upload event photos" hint="JPG or PNG - up to 10 MB each" />
            <div style={{ marginTop: 16 }}>
              <Button variant="primary">Save event evidence</Button>
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
