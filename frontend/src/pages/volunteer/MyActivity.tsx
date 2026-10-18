import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../../components/Icon'
import PageHeader from '../../components/PageHeader'
import { Button, Card, Field, FileDrop, StatusBadge, Tabs, TextField } from '../../components/ui'
import { getApplications, getVirtualTask } from '../../mocks/api'
import type { Application, ApplicationStatus, VirtualTask } from '../../mocks/types'

const tone: Record<ApplicationStatus, 'ok' | 'warn' | 'bad'> =
  { Accepted: 'ok', Pending: 'warn', Rejected: 'bad' }

export default function MyActivity() {
  const [applications, setApplications] = useState<Application[]>([])
  const [task, setTask] = useState<VirtualTask | null>(null)
  const [tab, setTab] = useState('overview')
  const [hours, setHours] = useState('3.5')
  const [report, setReport] = useState(
    'Translated the 6-page welcome pack into Kinyarwanda and checked the reading level with a second volunteer.')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    getApplications().then(setApplications)
    getVirtualTask().then(setTask)
  }, [])

  function submitTask(event: FormEvent) {
    event.preventDefault()
    setSubmitted(true)
  }

  return (
    <>
      <PageHeader title="My activity" />

      <Card variant="tint">
        <h3>4 hours verified</h3>
        <p className="muted" style={{ margin: 0 }}>
          Your September reading guide was approved. The hours and graphic design skill are now in
          your public portfolio.
        </p>
      </Card>

      <div style={{ marginTop: 26 }}>
        <Tabs active={tab} onChange={setTab} items={[
          { id: 'overview', label: 'Overview' },
          { id: 'applications', label: `Applications · ${applications.length}` },
          { id: 'events', label: 'Events · 1' },
          { id: 'tasks', label: 'Virtual tasks · 1' },
          { id: 'completed', label: 'Completed · 6' },
        ]} />
      </div>

      <div className="page-grid">
        <div className="stack">
          <Card>
            <h2>Your applications</h2>
            <div className="divided">
              {applications.map(application => (
                <div key={application.id}>
                  <div className="row" style={{ alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ marginBottom: 2 }}>{application.title}</h3>
                      <p className="muted" style={{ margin: 0 }}>
                        {application.organiser} · {application.when}
                      </p>
                    </div>
                    <StatusBadge tone={tone[application.status]}>{application.status}</StatusBadge>
                  </div>
                  {application.note
                    ? <p className="muted" style={{ marginTop: 10, marginBottom: 0 }}>{application.note}</p>
                    : (
                      <div className="row" style={{ marginTop: 10, justifyContent: 'flex-start', gap: 28 }}>
                        <Link to={`/opportunities/${application.opportunityId}`}>View application ↗</Link>
                        <span className="muted">Withdraw application</span>
                      </div>
                    )}
                </div>
              ))}
            </div>
          </Card>

          {task && (
            <Card>
              <h2>Virtual task · submit your contribution</h2>
              <div className="row">
                <StatusBadge tone="ok">Accepted task</StatusBadge>
                <StatusBadge tone="neutral">Due {task.due}</StatusBadge>
              </div>
              <h3 style={{ marginTop: 16, fontSize: 18 }}>{task.title}</h3>
              <p className="muted">{task.organiser} · Virtual · {task.skill}</p>

              {submitted ? (
                <Card variant="tint">
                  <h3>Sent for review</h3>
                  <p className="muted" style={{ margin: 0 }}>
                    Hours are credited once the organiser approves your submission.
                  </p>
                </Card>
              ) : (
                <form onSubmit={submitTask}>
                  <div className="two-col">
                    <Field id="hours" label="Claimed hours" type="number" step="0.5" min="0"
                           value={hours} onChange={e => setHours(e.target.value)} />
                    <Field id="completed" label="Completion date" type="date" defaultValue="2026-10-09" />
                  </div>
                  <TextField id="report" label="Completion report" value={report}
                             onChange={e => setReport(e.target.value)} required />
                  <Field id="proof" label="Proof link" type="url"
                         defaultValue="https://docs.example.org/welcome-rw" />
                  <FileDrop label="Or attach proof of work" hint="PDF, images or document · up to 10 MB" />
                  <Card variant="tint">
                    <h3 style={{ color: 'var(--primary)' }}>Hours are credited after approval</h3>
                    <p className="muted" style={{ margin: 0 }}>
                      Your organiser will review the report and proof. Pending or rejected submissions
                      do not add public hours or skills.
                    </p>
                  </Card>
                  <div style={{ marginTop: 18 }}>
                    <Button type="submit" variant="primary">Submit for review</Button>
                  </div>
                </form>
              )}
            </Card>
          )}
        </div>

        <aside className="stack">
          <Card variant="tint">
            <h2>Up next</h2>
            <StatusBadge tone="ok">Accepted</StatusBadge>
            <h3 style={{ marginTop: 12 }}>Kimironko planting morning</h3>
            <p className="muted">Sat, 10 Oct · 09:00-12:00<br />Kimironko wetland</p>
            <p className="muted">Bring sturdy shoes and a water bottle.</p>
            <Link to="/activity"><Button block>View event</Button></Link>
          </Card>
          <Card>
            <h2>Event check-in</h2>
            <p className="muted">
              At the event, open the scanner in your phone&rsquo;s browser. Scan again before
              leaving to check out.
            </p>
            <Link to="/check-in">
              <Button block><span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Icon name="scan" /> Open QR scanner
              </span></Button>
            </Link>
          </Card>
        </aside>
      </div>
    </>
  )
}
