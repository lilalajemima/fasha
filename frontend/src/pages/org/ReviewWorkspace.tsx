import { useEffect, useState } from 'react'
import PageHeader from '../../components/PageHeader'
import { Button, Card, StatusBadge, Tabs, Tag, TextField } from '../../components/ui'
import { getDeliverables, getReviewApplications } from '../../mocks/api'
import type { Deliverable, ReviewApplication } from '../../mocks/types'

export default function ReviewWorkspace() {
  const [applications, setApplications] = useState<ReviewApplication[]>([])
  const [deliverables, setDeliverables] = useState<Deliverable[]>([])
  const [tab, setTab] = useState('all')

  useEffect(() => {
    getReviewApplications().then(setApplications)
    getDeliverables().then(setDeliverables)
  }, [])

  const application = applications[0]
  const deliverable = deliverables[0]
  const showApplication = tab !== 'deliverables' && application
  const showDeliverable = tab !== 'applications' && deliverable

  return (
    <>
      <PageHeader
        title="Applications & Contributions"
        action={<Button>Edit opportunity</Button>}
      />

      <Card variant="tint">
        <h3 style={{ color: 'var(--primary)' }}>Accepted co-organiser access</h3>
        <p className="muted" style={{ margin: 0 }}>
          You can edit opportunity details and review applications or deliverables. Deleting the
          opportunity and removing the original creator are not permitted.
        </p>
      </Card>

      <div style={{ marginTop: 26 }}>
        <Tabs active={tab} onChange={setTab} items={[
          { id: 'all', label: 'All reviews · 15' },
          { id: 'applications', label: 'Applications · 12' },
          { id: 'deliverables', label: 'Deliverables · 3' },
        ]} />
      </div>

      <div className="two-col">
        {showApplication && (
          <Card>
            <h2>Application · 1 of 12</h2>
            <StatusBadge tone="warn">Pending decision</StatusBadge>
            <p className="muted" style={{ marginTop: 12 }}>
              {application.opportunity} · submitted {application.submitted}
            </p>

            <div className="row" style={{ alignItems: 'flex-start', marginBottom: 12 }}>
              <span className="cluster" style={{ gap: 14 }}>
                <span className="avatar" style={{ width: 48, height: 48, fontSize: 15 }}>AM</span>
                <span>
                  <strong style={{ display: 'block', fontSize: 19 }}>{application.name}</strong>
                  <span className="muted">{application.location} · Volunteer</span>
                </span>
              </span>
              <StatusBadge tone="match">{application.match}% match</StatusBadge>
            </div>

            <p>{application.bio}</p>
            <p className="muted">General availability · {application.availability}</p>
            <div className="cluster">{application.skills.map(s => <Tag key={s}>{s}</Tag>)}</div>
            <p className="muted" style={{ marginTop: 12 }}>
              Interests · {application.interests.join(', ')}
            </p>

            <h3 style={{ marginTop: 20 }}>Motivation</h3>
            <p>&ldquo;{application.motivation}&rdquo;</p>

            <Card variant="note">
              <strong>{application.attachment}</strong>
              <div className="muted" style={{ marginTop: 2 }}>PDF · 2.4 MB · <a href="#file" onClick={e => e.preventDefault()}>Open attachment ↗</a></div>
            </Card>

            <div style={{ marginTop: 16 }}>
              <Card variant="tint">
                <h3 style={{ color: 'var(--primary)' }}>8 places available</h3>
                <p className="muted" style={{ margin: 0 }}>
                  12 of 20 volunteers accepted. Application deadline: 14 Oct, 23:59.
                </p>
              </Card>
            </div>

            <div style={{ marginTop: 18 }}>
              <TextField id="decision-note" label="Decision note (optional)"
                         placeholder="Add a short message for the applicant..." />
            </div>
            <div className="cluster">
              <Button variant="primary">Accept applicant</Button>
              <Button>Reject</Button>
            </div>
            <p className="muted" style={{ marginTop: 12, marginBottom: 0 }}>
              The volunteer receives an in-app application update.
            </p>
          </Card>
        )}

        {showDeliverable && (
          <Card>
            <h2>Virtual deliverable · 1 of 3</h2>
            <StatusBadge tone="warn">Awaiting verification</StatusBadge>
            <p className="muted" style={{ marginTop: 12 }}>
              {deliverable.opportunity} · submitted {deliverable.submitted}
            </p>

            <span className="cluster" style={{ gap: 14, marginBottom: 16 }}>
              <span className="avatar" style={{ width: 48, height: 48, fontSize: 15 }}>NK</span>
              <span>
                <strong style={{ display: 'block', fontSize: 19 }}>{deliverable.name}</strong>
                <span className="muted">Accepted volunteer · virtual task</span>
              </span>
            </span>

            <div className="two-col">
              <Card variant="tint">
                <div className="stat-label">Claimed hours</div>
                <div className="stat-value">{deliverable.hours} h</div>
              </Card>
              <Card variant="note">
                <div className="stat-label">Skill to credit</div>
                <strong>{deliverable.skill}</strong>
              </Card>
            </div>

            <h3 style={{ marginTop: 20 }}>Completion report</h3>
            <p>{deliverable.report}</p>

            <h3>Proof of work</h3>
            <Card variant="note">
              <a href="#proof" onClick={e => e.preventDefault()}>{deliverable.proofLink} ↗</a>
              <div className="muted" style={{ marginTop: 2 }}>
                {deliverable.proofFile} · 1.8 MB · <a href="#file" onClick={e => e.preventDefault()}>Open file ↗</a>
              </div>
            </Card>

            <div style={{ marginTop: 18 }}>
              <TextField id="review-note" label="Review note"
                         defaultValue="Clear translation and complete source files. Thank you!" />
            </div>

            <Card variant="tint">
              <h3 style={{ color: 'var(--primary)' }}>Approve to credit the contribution</h3>
              <p className="muted" style={{ margin: 0 }}>
                Approval adds {deliverable.hours} verified hours and {deliverable.skill} to{' '}
                {deliverable.name.split(' ')[0]}&rsquo;s public portfolio. Rejection does not credit
                hours or skills.
              </p>
            </Card>

            <div className="cluster" style={{ marginTop: 18 }}>
              <Button variant="primary">Approve contribution</Button>
              <Button>Reject</Button>
            </div>
            <p className="muted" style={{ marginTop: 12, marginBottom: 0 }}>
              The volunteer receives a task approval or rejection notification.
            </p>
          </Card>
        )}
      </div>
    </>
  )
}
