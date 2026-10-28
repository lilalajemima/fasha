import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../../components/Icon'
import { Loaded } from '../../components/Loader'
import PageHeader from '../../components/PageHeader'
import { Button, Card, EmptyState, Field, StatusBadge, Tabs } from '../../components/ui'
import { api } from '../../lib/api'
import { longDate, sentenceCase } from '../../lib/format'
import type { ApplicationStatus, ApplicationView, SubmissionStatus, SubmissionView } from '../../lib/types'
import { messageFor, useGet } from '../../lib/useGet'

const APPLICATION_TONE: Record<ApplicationStatus, 'ok' | 'warn' | 'bad' | 'neutral'> = {
  ACCEPTED: 'ok',
  PENDING: 'warn',
  REJECTED: 'bad',
  WITHDRAWN: 'neutral',
}

const SUBMISSION_TONE: Record<SubmissionStatus, 'ok' | 'warn' | 'bad'> = {
  APPROVED: 'ok',
  PENDING: 'warn',
  REJECTED: 'bad',
}

function ClaimHours({ accepted, onSent }: { accepted: ApplicationView[]; onSent: () => void }) {
  const [opportunityId, setOpportunityId] = useState(accepted[0]?.opportunity.id ?? '')
  const [hours, setHours] = useState('3')
  const [proofUrl, setProofUrl] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (accepted.length === 0) {
    return (
      <EmptyState>
        Once an organiser accepts you, you can claim the hours you worked here.
      </EmptyState>
    )
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setBusy(true)

    try {
      await api.post(`/opportunities/${opportunityId}/submissions`, {
        hoursClaimed: Number(hours),
        proofUrl: proofUrl.trim(),
      })
      setProofUrl('')
      onSent()
    } catch (problem) {
      setError(messageFor(problem))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="field">
        <label className="label" htmlFor="claim-opportunity">Opportunity</label>
        <select
          id="claim-opportunity"
          className="input"
          value={opportunityId}
          onChange={event => setOpportunityId(event.target.value)}
        >
          {accepted.map(application => (
            <option key={application.id} value={application.opportunity.id}>
              {application.opportunity.title}
            </option>
          ))}
        </select>
      </div>

      <div className="two-col">
        <Field
          id="hours"
          label="Hours worked"
          type="number"
          step="0.5"
          min="0.5"
          max="24"
          value={hours}
          required
          onChange={event => setHours(event.target.value)}
        />
        <Field
          id="proof"
          label="Link to your proof"
          type="url"
          placeholder="https://"
          value={proofUrl}
          required
          onChange={event => setProofUrl(event.target.value)}
        />
      </div>

      {error && <p className="error" role="alert">{error}</p>}

      <Card variant="tint">
        <h3 style={{ color: 'var(--primary)' }}>Hours are credited after approval</h3>
        <p className="muted" style={{ margin: 0 }}>
          The organiser reviews the proof. Pending or rejected claims add nothing to your portfolio.
        </p>
      </Card>

      <div style={{ marginTop: 18 }}>
        <Button type="submit" variant="primary" disabled={busy}>
          {busy ? 'Sending…' : 'Submit for review'}
        </Button>
      </div>
    </form>
  )
}

export default function MyActivity() {
  const applications = useGet<ApplicationView[]>('/applications/mine')
  const submissions = useGet<SubmissionView[]>('/submissions/mine')
  const [tab, setTab] = useState('applications')
  const [error, setError] = useState('')

  async function withdraw(id: string) {
    setError('')

    try {
      await api.patch(`/applications/${id}/withdraw`)
      applications.reload()
    } catch (problem) {
      setError(messageFor(problem))
    }
  }

  const accepted = (applications.data ?? []).filter(item => item.status === 'ACCEPTED')

  return (
    <>
      <PageHeader title="My activity" meta="Your applications, and the hours you have claimed." />

      <div style={{ marginTop: 4 }}>
        <Tabs
          active={tab}
          onChange={setTab}
          items={[
            { id: 'applications', label: `Applications · ${(applications.data ?? []).length}` },
            { id: 'hours', label: `Claimed hours · ${(submissions.data ?? []).length}` },
          ]}
        />
      </div>

      {error && <p className="error" role="alert">{error}</p>}

      <div className="page-grid">
        <div className="stack">
          {tab === 'applications' ? (
            <Card>
              <h2>Your applications</h2>
              <Loaded state={applications} what="your applications">
                {items => (
                  <div className="divided">
                    {items.map(application => (
                      <div key={application.id}>
                        <div className="row" style={{ alignItems: 'flex-start' }}>
                          <div>
                            <h3 style={{ marginBottom: 2 }}>{application.opportunity.title}</h3>
                            <p className="muted" style={{ margin: 0 }}>
                              Applied {longDate(application.createdAt)}
                            </p>
                          </div>
                          <StatusBadge tone={APPLICATION_TONE[application.status]}>
                            {sentenceCase(application.status)}
                          </StatusBadge>
                        </div>

                        <div className="row" style={{ marginTop: 10, justifyContent: 'flex-start', gap: 28 }}>
                          <Link to={`/opportunities/${application.opportunity.id}`}>
                            View opportunity ↗
                          </Link>
                          {(application.status === 'PENDING' || application.status === 'ACCEPTED') && (
                            <button className="linkbtn" onClick={() => withdraw(application.id)}>
                              Withdraw application
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {items.length === 0 && (
                      <EmptyState>
                        You have not applied to anything yet. <Link to="/discover">Find something</Link>.
                      </EmptyState>
                    )}
                  </div>
                )}
              </Loaded>
            </Card>
          ) : (
            <>
              <Card>
                <h2>Claim hours for work you have done</h2>
                <p className="muted">
                  For virtual work, or anything an organiser did not scan you in for.
                </p>
                <ClaimHours accepted={accepted} onSent={submissions.reload} />
              </Card>

              <Card>
                <h2>Claims you have sent</h2>
                <Loaded state={submissions} what="your claims">
                  {items => (
                    <div className="divided">
                      {items.map(submission => (
                        <div key={submission.id} className="row" style={{ alignItems: 'flex-start' }}>
                          <div>
                            <h3 style={{ marginBottom: 2 }}>{submission.opportunity.title}</h3>
                            <p className="muted" style={{ margin: 0 }}>
                              {submission.hoursClaimed} h · sent {longDate(submission.createdAt)}
                            </p>
                          </div>
                          <StatusBadge tone={SUBMISSION_TONE[submission.status]}>
                            {sentenceCase(submission.status)}
                          </StatusBadge>
                        </div>
                      ))}
                      {items.length === 0 && <EmptyState>No claims yet.</EmptyState>}
                    </div>
                  )}
                </Loaded>
              </Card>
            </>
          )}
        </div>

        <aside className="stack">
          <Card>
            <h2>Event check in</h2>
            <p className="muted">
              At the event, open this on your phone and enter the code the organiser is showing.
            </p>
            <Link to="/check-in">
              <Button block>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="scan" /> Open check in
                </span>
              </Button>
            </Link>
          </Card>

          <Card variant="tint">
            <h2 style={{ color: 'var(--primary)' }}>Accepted places</h2>
            <p className="muted" style={{ margin: 0 }}>
              {accepted.length === 0
                ? 'Nothing accepted yet. Organisers usually reply within a few days.'
                : `You have ${accepted.length} accepted place${accepted.length === 1 ? '' : 's'}.`}
            </p>
          </Card>
        </aside>
      </div>
    </>
  )
}
