import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Loaded } from '../../components/Loader'
import PageHeader from '../../components/PageHeader'
import { Button, Card, EmptyState, StatusBadge, Tag } from '../../components/ui'
import { api } from '../../lib/api'
import { hasPassed, longDate, quantity } from '../../lib/format'
import type { OpportunityStatus, OpportunityView } from '../../lib/types'
import { messageFor, useGet } from '../../lib/useGet'
import { ApplicantsPanel } from '../manage/Applicants'
import { AttendancePanel } from '../manage/Attendance'
import { DeliverablesPanel } from '../manage/Deliverables'
import '../../styles/workspace.css'

export type InitiativeTab = 'details' | 'applicants' | 'attendance' | 'deliverables'

const LABEL: Record<OpportunityStatus, string> = {
  PUBLISHED: 'Published',
  PENDING_APPROVAL: 'Awaiting approval',
  REJECTED: 'Not approved',
}

const TONE: Record<OpportunityStatus, 'ok' | 'warn' | 'bad'> = {
  PUBLISHED: 'ok',
  PENDING_APPROVAL: 'warn',
  REJECTED: 'bad',
}

function editable(item: OpportunityView): boolean {
  return item.status !== 'PUBLISHED' || !hasPassed(item.applicationDeadline)
}

function closable(item: OpportunityView): boolean {
  return item.status === 'PUBLISHED' && !hasPassed(item.applicationDeadline)
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="stat-label">{label}</div>
      <div>{value}</div>
    </div>
  )
}

function Details({ item }: { item: OpportunityView }) {
  const status = item.status as OpportunityStatus

  return (
    <div className="form-column">
      <Card>
        <div className="cluster">
          <StatusBadge tone={TONE[status]}>{LABEL[status]}</StatusBadge>
          <span className="muted">Proposed {longDate(item.createdAt)}</span>
        </div>

        {status === 'PENDING_APPROVAL' && (
          <p className="muted" style={{ margin: '12px 0 0' }}>
            A reviewer is looking at this. You can still change or delete it until they
            decide.
          </p>
        )}
        {status === 'REJECTED' && item.reviewNote && (
          <p style={{ margin: '12px 0 0' }}>
            <strong>Reviewer:</strong> {item.reviewNote} Editing it sends it back for review.
          </p>
        )}

        <hr />

        <h2>What it involves</h2>
        <p>{item.description}</p>

        <hr />

        <h2>The details</h2>
        <div className="stat-row">
          <Fact label="Format" value={item.mode === 'PHYSICAL' ? 'In person' : 'Virtual'} />
          {item.location && <Fact label="Location" value={item.location} />}
          {item.sector && <Fact label="Sector" value={item.sector} />}
          <Fact label="Places" value={quantity(item.maxCapacity, 'volunteer')} />
          {item.startsAt && <Fact label="Starts" value={longDate(item.startsAt)} />}
          {item.endsAt && (
            <Fact
              label={item.mode === 'PHYSICAL' ? 'Ends' : 'Work due by'}
              value={longDate(item.endsAt)}
            />
          )}
          <Fact label="Apply by" value={longDate(item.applicationDeadline)} />
        </div>

        {item.requiredSkills.length > 0 && (
          <>
            <hr />
            <div className="label">Skills needed</div>
            <div className="cluster">
              {item.requiredSkills.map(skill => <Tag key={skill}>{skill}</Tag>)}
            </div>
          </>
        )}

        {item.categories.length > 0 && (
          <>
            <div className="label" style={{ marginTop: 16 }}>Areas</div>
            <div className="cluster">
              {item.categories.map(area => <Tag key={area}>{area}</Tag>)}
            </div>
          </>
        )}
      </Card>
    </div>
  )
}

/**
 * One initiative, with the organiser's tools for it. A volunteer who proposes
 * something runs it too, so applicants and the proof of what happened live
 * inside the initiative rather than in a workspace listing everybody's work.
 */
export default function MyInitiative({ tab = 'details' }: { tab?: InitiativeTab }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const initiative = useGet<OpportunityView>(`/opportunities/${id}`)
  const [problem, setProblem] = useState('')
  const [busy, setBusy] = useState(false)

  async function run(work: () => Promise<unknown>, then: () => void) {
    setProblem('')
    setBusy(true)

    try {
      await work()
      then()
    } catch (failure) {
      setProblem(messageFor(failure))
      setBusy(false)
    }
  }

  return (
    <>
      <p className="backlink">
        <Link to="/initiatives">← My initiatives</Link>
      </p>

      <Loaded state={initiative} what="this initiative">
        {item => {
          const published = item.status === 'PUBLISHED'
          const inPerson = item.mode === 'PHYSICAL'
          const base = `/initiatives/${item.id}`

          return (
            <>
              <PageHeader
                title={item.title}
                action={
                  <div className="cluster">
                    {editable(item) && (
                      <Link to={`${base}/edit`}><Button>Edit</Button></Link>
                    )}
                    {closable(item) && (
                      <Button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          run(
                            () => api.patch(`/opportunities/${item.id}/close`, {}),
                            () => {
                              setBusy(false)
                              initiative.reload()
                            },
                          )
                        }
                      >
                        Close early
                      </Button>
                    )}
                    <Button
                      type="button"
                      className="btn--danger"
                      disabled={busy}
                      onClick={() => {
                        if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) {
                          return
                        }

                        run(
                          () => api.delete(`/opportunities/${item.id}`),
                          () => navigate('/initiatives'),
                        )
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                }
              />

              <nav className="rectabs" aria-label="This initiative">
                <Link to={base} className={tab === 'details' ? 'is-current' : undefined}>
                  Details
                </Link>
                <Link
                  to={`${base}/applicants`}
                  className={tab === 'applicants' ? 'is-current' : undefined}
                >
                  Applicants
                </Link>
                {/* Hours come from the register for work people turn up to and
                    from what they send in for work done remotely. Never both. */}
                {inPerson ? (
                  <Link
                    to={`${base}/attendance`}
                    className={tab === 'attendance' ? 'is-current' : undefined}
                  >
                    Attendance
                  </Link>
                ) : (
                  <Link
                    to={`${base}/deliverables`}
                    className={tab === 'deliverables' ? 'is-current' : undefined}
                  >
                    Deliverables
                  </Link>
                )}
              </nav>

              {problem && <p className="error" role="alert">{problem}</p>}

              {tab === 'details' && <Details item={item} />}

              {tab === 'applicants' && (
                published ? (
                  <ApplicantsPanel opportunityId={item.id} />
                ) : (
                  <EmptyState>
                    Nobody can apply until this is approved and published.
                  </EmptyState>
                )
              )}

              {tab === 'attendance' && (
                published && inPerson ? (
                  <AttendancePanel opportunity={item} />
                ) : (
                  <EmptyState>
                    The register opens once this is published. Virtual work is measured by
                    what volunteers send in, under Deliverables.
                  </EmptyState>
                )
              )}

              {tab === 'deliverables' && (
                !published ? (
                  <EmptyState>
                    Volunteers can send work in once this is approved and published.
                  </EmptyState>
                ) : inPerson ? (
                  <EmptyState>
                    This one happens in person, so its hours come from the register under
                    Attendance rather than from work sent in.
                  </EmptyState>
                ) : (
                  <DeliverablesPanel opportunityId={item.id} />
                )
              )}
            </>
          )
        }}
      </Loaded>
    </>
  )
}
