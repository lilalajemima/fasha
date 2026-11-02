import { useState } from 'react'
import { Loaded, Problem } from '../../components/Loader'
import PageHeader from '../../components/PageHeader'
import { Button, Card, EmptyState, StatusBadge, Tabs } from '../../components/ui'
import { api } from '../../lib/api'
import { initials, longDate, sentenceCase } from '../../lib/format'
import type { ApplicationView, OpportunityView, SubmissionView } from '../../lib/types'
import { messageFor, useGet } from '../../lib/useGet'

function Applicants({ opportunityId }: { opportunityId: string }) {
  const applicants = useGet<ApplicationView[]>(`/opportunities/${opportunityId}/applications`)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')

  async function decide(id: string, decision: 'ACCEPT' | 'REJECT') {
    setError('')
    setBusy(id)

    try {
      await api.patch(`/applications/${id}/status`, { decision })
      applicants.reload()
    } catch (problem) {
      setError(messageFor(problem))
    } finally {
      setBusy('')
    }
  }

  return (
    <Card>
      <h2>Applicants</h2>
      {error && <p className="error" role="alert">{error}</p>}

      <Loaded state={applicants} what="applicants">
        {items =>
          items.length === 0 ? (
            <EmptyState>Nobody has applied to this one yet.</EmptyState>
          ) : (
            <div className="divided">
              {items.map(application => (
                <div key={application.id}>
                  <div className="row" style={{ alignItems: 'flex-start' }}>
                    <span className="cluster" style={{ gap: 14 }}>
                      <span className="avatar" style={{ width: 48, height: 48, fontSize: 15 }}>
                        {initials(application.volunteer.name)}
                      </span>
                      <span>
                        <strong style={{ display: 'block', fontSize: 19 }}>
                          {application.volunteer.name}
                        </strong>
                        <span className="muted">
                          Applied {longDate(application.createdAt)}
                        </span>
                      </span>
                    </span>
                    <StatusBadge
                      tone={
                        application.status === 'ACCEPTED'
                          ? 'ok'
                          : application.status === 'PENDING'
                            ? 'warn'
                            : 'bad'
                      }
                    >
                      {sentenceCase(application.status)}
                    </StatusBadge>
                  </div>

                  <p style={{ marginTop: 12 }}>&ldquo;{application.motivationStatement}&rdquo;</p>

                  {application.status === 'PENDING' && (
                    <div className="cluster">
                      <Button
                        variant="primary"
                        disabled={busy === application.id}
                        onClick={() => decide(application.id, 'ACCEPT')}
                      >
                        Accept applicant
                      </Button>
                      <Button
                        disabled={busy === application.id}
                        onClick={() => decide(application.id, 'REJECT')}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        }
      </Loaded>
    </Card>
  )
}

function ClaimedHours({ opportunityId }: { opportunityId: string }) {
  const claims = useGet<SubmissionView[]>(`/opportunities/${opportunityId}/submissions`)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')

  async function decide(id: string, decision: 'APPROVE' | 'REJECT') {
    setError('')
    setBusy(id)

    try {
      await api.patch(`/submissions/${id}/status`, { decision })
      claims.reload()
    } catch (problem) {
      setError(messageFor(problem))
    } finally {
      setBusy('')
    }
  }

  return (
    <Card>
      <h2>Claimed hours</h2>
      <p className="muted">Approving credits the hours to that volunteer&rsquo;s portfolio.</p>
      {error && <p className="error" role="alert">{error}</p>}

      <Loaded state={claims} what="claimed hours">
        {items =>
          items.length === 0 ? (
            <EmptyState>No hours have been claimed for this one.</EmptyState>
          ) : (
            <div className="divided">
              {items.map(claim => (
                <div key={claim.id}>
                  <div className="row" style={{ alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ marginBottom: 2 }}>{claim.volunteer.name}</h3>
                      <p className="muted" style={{ margin: 0 }}>
                        {claim.hoursClaimed} h · sent {longDate(claim.createdAt)}
                      </p>
                      <p style={{ margin: '6px 0 0' }}>
                        <a href={claim.proofUrl} target="_blank" rel="noreferrer">
                          Open the proof ↗
                        </a>
                      </p>
                    </div>
                    <StatusBadge
                      tone={
                        claim.status === 'APPROVED' ? 'ok' : claim.status === 'PENDING' ? 'warn' : 'bad'
                      }
                    >
                      {sentenceCase(claim.status)}
                    </StatusBadge>
                  </div>

                  {claim.status === 'PENDING' && (
                    <div className="cluster" style={{ marginTop: 12 }}>
                      <Button
                        variant="primary"
                        disabled={busy === claim.id}
                        onClick={() => decide(claim.id, 'APPROVE')}
                      >
                        Approve {claim.hoursClaimed} hours
                      </Button>
                      <Button disabled={busy === claim.id} onClick={() => decide(claim.id, 'REJECT')}>
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        }
      </Loaded>
    </Card>
  )
}

export default function ReviewWorkspace() {
  const mine = useGet<OpportunityView[]>('/opportunities/mine')
  const [chosen, setChosen] = useState('')
  const [tab, setTab] = useState('applicants')

  const published = (mine.data ?? []).filter(item => item.status === 'PUBLISHED')
  const current = chosen || published[0]?.id || ''

  return (
    <>
      <PageHeader
        title="Applications & Contributions"
        meta="Decide who joins, and verify the hours people claim."
      />

      <div className="stack">
        {mine.error && <Problem message={mine.error} onRetry={mine.reload} />}

        {published.length === 0 ? (
          <EmptyState>
            Once one of your opportunities is published, applicants show up here.
          </EmptyState>
        ) : (
          <>
            <Card>
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="label" htmlFor="which">Opportunity</label>
                <select
                  id="which"
                  className="input"
                  value={current}
                  onChange={event => setChosen(event.target.value)}
                >
                  {published.map(item => (
                    <option key={item.id} value={item.id}>{item.title}</option>
                  ))}
                </select>
              </div>
            </Card>

            <Tabs
              active={tab}
              onChange={setTab}
              items={[
                { id: 'applicants', label: 'Applicants' },
                { id: 'hours', label: 'Claimed hours' },
              ]}
            />

            {tab === 'applicants'
              ? <Applicants key={current} opportunityId={current} />
              : <ClaimedHours key={current} opportunityId={current} />}
          </>
        )}
      </div>
    </>
  )
}
