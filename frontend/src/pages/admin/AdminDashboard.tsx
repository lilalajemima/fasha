import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Imigongo from '../../components/Imigongo'
import { Loaded } from '../../components/Loader'
import Logo from '../../components/Logo'
import { Button, Card, EmptyState, StatTile, StatusBadge, Tabs, Tag, TextField } from '../../components/ui'
import { useAuth } from '../../auth/AuthContext'
import { api } from '../../lib/api'
import { longDate, sentenceCase } from '../../lib/format'
import type { ActivityRow, AdminSummary, OpportunityView } from '../../lib/types'
import { messageFor, useGet } from '../../lib/useGet'

function Numbers({ summary }: { summary: AdminSummary }) {
  return (
    <div className="stack">
      <Card>
        <h2>People</h2>
        <div className="stat-row">
          <StatTile label="Volunteers" value={summary.people.volunteers} />
          <StatTile label="Organisations" value={summary.people.organisations} />
        </div>
      </Card>

      <Card>
        <h2>Initiatives</h2>
        <div className="stat-row">
          <StatTile label="Published" value={summary.initiatives.published} />
          <StatTile
            label="Proposed by citizens"
            value={summary.initiatives.citizenProposed}
            note={`${summary.initiatives.approvalRate}% of those reviewed were approved`}
          />
          <StatTile label="Awaiting review" value={summary.initiatives.awaitingReview} />
        </div>
      </Card>

      <Card>
        <h2>Participation</h2>
        <div className="stat-row">
          <StatTile label="Places accepted" value={summary.attendance.acceptedPlaces} />
          <StatTile
            label="Turned up"
            value={summary.attendance.checkedIn}
            note={`${summary.attendance.turnoutRate}% turnout`}
          />
          <StatTile label="Hours verified" value={`${summary.attendance.hoursCredited} h`} />
          <StatTile
            label="Scanned"
            value={summary.attendance.scanned}
            note={`${summary.attendance.byHand} marked by hand`}
          />
        </div>
      </Card>

      <Card>
        <h2>By sector</h2>
        {summary.sectors.length === 0 ? (
          <EmptyState>No opportunities recorded yet.</EmptyState>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Sector</th>
                <th>Opportunities</th>
              </tr>
            </thead>
            <tbody>
              {summary.sectors.map(row => (
                <tr key={row.sector}>
                  <td>{row.sector}</td>
                  <td>{row.opportunities}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}

function Queue({ onDecided }: { onDecided: () => void }) {
  const queue = useGet<OpportunityView[]>('/opportunities/pending')
  const [notes, setNotes] = useState<Record<string, string>>({})
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
      onDecided()
    } catch (problem) {
      setError(messageFor(problem))
    } finally {
      setBusy('')
    }
  }

  return (
    <Card>
      <h2>Citizen initiatives awaiting a decision</h2>
      <p className="muted">
        Proposed by residents. They stay out of Discover until approved here. Opportunities posted
        by organisations publish directly and never appear in this queue.
      </p>

      {error && <p className="error" role="alert">{error}</p>}

      <Loaded state={queue} what="the queue">
        {items =>
          items.length === 0 ? (
            <EmptyState>Nothing is waiting for a decision.</EmptyState>
          ) : (
            <div className="divided">
              {items.map(item => (
                <div key={item.id}>
                  <div className="row" style={{ alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ marginBottom: 2 }}>{item.title}</h3>
                      <p className="muted" style={{ margin: 0 }}>
                        {item.creator.name} · {item.sector ?? 'Sector not set'} ·{' '}
                        {sentenceCase(item.mode)} · up to {item.maxCapacity} · apply by{' '}
                        {longDate(item.applicationDeadline)}
                      </p>
                    </div>
                    <StatusBadge tone="warn">Awaiting review</StatusBadge>
                  </div>

                  <p style={{ marginTop: 10 }}>{item.description}</p>

                  <div className="cluster" style={{ marginBottom: 14 }}>
                    {[...item.requiredSkills, ...item.categories].map(tag => (
                      <Tag key={tag}>{tag}</Tag>
                    ))}
                  </div>

                  <TextField
                    id={`note-${item.id}`}
                    label="Feedback, optional"
                    placeholder="Only sent if you reject it."
                    value={notes[item.id] ?? ''}
                    onChange={event => setNotes({ ...notes, [item.id]: event.target.value })}
                  />

                  <div className="cluster">
                    <Button
                      variant="primary"
                      disabled={busy === item.id}
                      onClick={() => decide(item.id, 'APPROVE')}
                    >
                      Approve and publish
                    </Button>
                    <Button disabled={busy === item.id} onClick={() => decide(item.id, 'REJECT')}>
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </Loaded>
    </Card>
  )
}

function Activity() {
  const activity = useGet<ActivityRow[]>('/admin/activity')

  return (
    <Card>
      <h2>Every opportunity</h2>
      <Loaded state={activity} what="activity">
        {rows =>
          rows.length === 0 ? (
            <EmptyState>Nothing has been posted yet.</EmptyState>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Opportunity</th>
                  <th>Sector</th>
                  <th>Organiser</th>
                  <th>Applied</th>
                  <th>Accepted</th>
                  <th>Turned up</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.id}>
                    <td>{row.title}</td>
                    <td>{row.sector ?? '—'}</td>
                    <td>
                      {row.organiser}
                      <div className="muted" style={{ marginTop: 2 }}>
                        {row.organiserRole === 'VOLUNTEER' ? 'Citizen initiative' : 'Organisation'}
                      </div>
                    </td>
                    <td>{row.applications}</td>
                    <td>{row.accepted}</td>
                    <td>{row.checkedIn}</td>
                    <td>{sentenceCase(row.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        }
      </Loaded>
    </Card>
  )
}

function Export() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function download() {
    setError('')
    setBusy(true)

    try {
      const query = new URLSearchParams()
      if (from) query.set('from', from)
      if (to) query.set('to', `${to}T23:59:59.999Z`)

      const blob = await api.download(`/admin/attendance.csv?${query.toString()}`)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = url
      link.download = `fasha-attendance-${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } catch (problem) {
      setError(messageFor(problem))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <h2>Export attendance</h2>
      <p className="muted">
        One row per check in, with the sector, the hours and whether it was scanned or marked by
        hand. Opens in Excel.
      </p>

      <div className="two-col">
        <div className="field">
          <label className="label" htmlFor="from">From</label>
          <input
            id="from"
            className="input"
            type="date"
            value={from}
            onChange={event => setFrom(event.target.value)}
          />
        </div>
        <div className="field">
          <label className="label" htmlFor="to">To</label>
          <input
            id="to"
            className="input"
            type="date"
            value={to}
            onChange={event => setTo(event.target.value)}
          />
        </div>
      </div>

      {error && <p className="error" role="alert">{error}</p>}

      <Button variant="primary" disabled={busy} onClick={download}>
        {busy ? 'Preparing…' : 'Download CSV'}
      </Button>

      <p className="muted" style={{ marginTop: 12, marginBottom: 0 }}>
        Leaving the dates empty exports the last 90 days.
      </p>
    </Card>
  )
}

export default function AdminDashboard() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const summary = useGet<AdminSummary>('/admin/summary')
  const [tab, setTab] = useState('queue')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-base)' }}>
      <header className="topbar">
        <span className="topbar__left">
          <Logo size={24} />
        </span>
        <div className="topbar__right">
          <span className="muted">Oversight · {user?.name}</span>
          <Button onClick={() => { signOut(); navigate('/signin') }}>Sign out</Button>
        </div>
      </header>

      <main style={{ maxWidth: 1140, margin: '0 auto', padding: '32px 24px 72px' }}>
        <span className="eyebrow">Community works oversight</span>
        <h1>Fasha across the district</h1>
        <p className="lede">
          Approve the initiatives residents propose, watch participation, and export the register.
        </p>
        <div style={{ margin: '18px 0 24px' }}><Imigongo /></div>

        <Tabs
          active={tab}
          onChange={setTab}
          items={[
            { id: 'queue', label: 'Approvals' },
            { id: 'numbers', label: 'Numbers' },
            { id: 'activity', label: 'Activity' },
            { id: 'export', label: 'Export' },
          ]}
        />

        {tab === 'queue' && <Queue onDecided={summary.reload} />}
        {tab === 'numbers' && (
          <Loaded state={summary} what="the numbers">
            {data => <Numbers summary={data} />}
          </Loaded>
        )}
        {tab === 'activity' && <Activity />}
        {tab === 'export' && <Export />}
      </main>
    </div>
  )
}
