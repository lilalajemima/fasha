import { useEffect, useState } from 'react'
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
      <div className="row">
        <div>
          <p className="eyebrow">Applications &amp; contributions</p>
          <h1>Make room for good people.</h1>
          <p className="lede">Review applications and verify the work your volunteers have contributed.</p>
        </div>
        <Button>Edit opportunity</Button>
      </div>

      <Card variant="tint">
        <h3>Accepted co-organiser access</h3>
        <p className="muted" style={{ margin: 0 }}>
          You can edit opportunity details and review applications or deliverables.
          Deleting the opportunity and removing the original creator are not permitted.
        </p>
      </Card>

      <div style={{ marginTop: 24 }}>
        <Tabs active={tab} onChange={setTab} items={[
          { id: 'all', label: 'All reviews - 15' },
          { id: 'applications', label: 'Applications - 12' },
          { id: 'deliverables', label: 'Deliverables - 3' },
        ]} />
      </div>

      <div className="two-col">
        {showApplication && (
          <Card>
            <h2>Application - 1 of 12</h2>
            <StatusBadge tone="warn">Pending decision</StatusBadge>
            <p className="muted" style={{ marginTop: 10 }}>
              {application.opportunity} - submitted {application.submitted}
            </p>

            <div className="row" style={{ alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: 20 }}>{application.name}</h3>
                <p className="muted">{application.location} - Volunteer</p>
              </div>
              <StatusBadge tone="ok">{application.match}% match</StatusBadge>
            </div>

            <p>{application.bio}</p>
            <p className="muted">General availability - {application.availability}</p>
            <div className="cluster">{application.skills.map(skill => <Tag key={skill}>{skill}</Tag>)}</div>
            <p className="muted" style={{ marginTop: 10 }}>
              Interests - {application.interests.join(', ')}
            </p>

            <h3 style={{ marginTop: 16 }}>Motivation</h3>
            <p>&ldquo;{application.motivation}&rdquo;</p>

            <Card variant="tint">
              <strong>{application.attachment}</strong>
              <div className="muted">PDF - 2.4 MB - open attachment</div>
            </Card>

            <TextField id="decision-note" label="Decision note (optional)"
                       placeholder="Add a short message for the applicant..." />
            <div className="cluster">
              <Button variant="primary">Accept applicant</Button>
              <Button>Reject</Button>
            </div>
            <p className="muted" style={{ marginTop: 10 }}>
              The volunteer receives an in-app application update.
            </p>
          </Card>
        )}

        {showDeliverable && (
          <Card>
            <h2>Virtual deliverable - 1 of 3</h2>
            <StatusBadge tone="warn">Awaiting verification</StatusBadge>
            <p className="muted" style={{ marginTop: 10 }}>
              {deliverable.opportunity} - submitted {deliverable.submitted}
            </p>

            <h3 style={{ fontSize: 20 }}>{deliverable.name}</h3>
            <p className="muted">Accepted volunteer - virtual task</p>

            <div className="two-col">
              <Card variant="tint">
                <div className="muted">Claimed hours</div>
                <div className="stat-value">{deliverable.hours} h</div>
              </Card>
              <Card>
                <div className="muted">Skill to credit</div>
                <strong>{deliverable.skill}</strong>
              </Card>
            </div>

            <h3 style={{ marginTop: 16 }}>Completion report</h3>
            <p>{deliverable.report}</p>

            <h3>Proof of work</h3>
            <Card variant="tint">
              <div>{deliverable.proofLink}</div>
              <div className="muted">{deliverable.proofFile} - 1.8 MB</div>
            </Card>

            <TextField id="review-note" label="Review note" placeholder="Feedback for the volunteer..." />
            <Card variant="tint">
              <h3>Approve to credit the contribution</h3>
              <p className="muted" style={{ margin: 0 }}>
                Approval adds {deliverable.hours} verified hours and {deliverable.skill} to{' '}
                {deliverable.name.split(' ')[0]}&rsquo;s public portfolio. Rejection does not credit hours or skills.
              </p>
            </Card>
            <div className="cluster" style={{ marginTop: 16 }}>
              <Button variant="primary">Approve contribution</Button>
              <Button>Reject</Button>
            </div>
            <p className="muted" style={{ marginTop: 10 }}>
              The volunteer receives a task approval or rejection notification.
            </p>
          </Card>
        )}
      </div>
    </>
  )
}
