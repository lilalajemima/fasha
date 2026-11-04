import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Loaded } from '../../components/Loader'
import PageHeader from '../../components/PageHeader'
import { Button, EmptyState, StatusBadge, Tabs } from '../../components/ui'
import { api } from '../../lib/api'
import { initials, longDate, meta, quantity, whenLabel } from '../../lib/format'
import type { ApplicationStatus, ApplicationView, OpportunityView } from '../../lib/types'
import { messageFor, useGet } from '../../lib/useGet'
import './Manage.css'

const STATES: { id: string; label: string }[] = [
  { id: 'PENDING', label: 'To review' },
  { id: 'ACCEPTED', label: 'Accepted' },
  { id: 'REJECTED', label: 'Rejected' },
  { id: 'all', label: 'All' },
]

function toneFor(status: ApplicationStatus) {
  if (status === 'ACCEPTED') return 'ok' as const
  if (status === 'PENDING') return 'warn' as const

  return 'bad' as const
}

function labelFor(status: ApplicationStatus): string {
  if (status === 'PENDING') return 'To review'
  if (status === 'ACCEPTED') return 'Accepted'
  if (status === 'REJECTED') return 'Rejected'

  return 'Withdrawn'
}

/**
 * Who applied to one opportunity, and the accept or reject on each. Kept apart
 * from the page around it so a volunteer can review the applicants to their own
 * initiative from inside that initiative, without a manage workspace.
 */
export function ApplicantsPanel({ opportunityId }: { opportunityId: string }) {
  const applicants = useGet<ApplicationView[]>(`/opportunities/${opportunityId}/applications`)

  const [state, setState] = useState('PENDING')
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')

  async function decide(applicationId: string, decision: 'ACCEPT' | 'REJECT') {
    setError('')
    setBusy(applicationId)

    try {
      await api.patch(`/applications/${applicationId}/status`, { decision })
      applicants.reload()
    } catch (problem) {
      setError(messageFor(problem))
    } finally {
      setBusy('')
    }
  }

  const pending = (applicants.data ?? []).filter(item => item.status === 'PENDING').length
  const words = query.trim().toLowerCase()

  return (
    <>
      <Tabs
        active={state}
        onChange={setState}
        items={STATES.map(entry =>
          entry.id === 'PENDING' && pending > 0
            ? { id: entry.id, label: `${entry.label} (${pending})` }
            : entry,
        )}
      />

      <div className="toolbar">
        <input
          className="input toolbar__search"
          placeholder="Search by name"
          aria-label="Search applicants"
          value={query}
          onChange={event => setQuery(event.target.value)}
        />
      </div>

      {error && <p className="error" role="alert">{error}</p>}

      <Loaded state={applicants} what="applicants">
        {items => {
          const visible = items
            .filter(item => state === 'all' || item.status === state)
            .filter(item => words === '' || item.volunteer.name.toLowerCase().includes(words))

          if (visible.length === 0) {
            return <EmptyState>Nobody here yet.</EmptyState>
          }

          return (
            <div className="applicants">
              {visible.map(application => (
                <article key={application.id} className="applicant">
                  <span className="avatar">{initials(application.volunteer.name)}</span>

                  <div className="applicant__body">
                    <div className="applicant__head">
                      <div>
                        <strong>{application.volunteer.name}</strong>
                        <div className="data__meta">
                          Applied {longDate(application.createdAt)}
                        </div>
                      </div>
                      <StatusBadge tone={toneFor(application.status)}>
                        {labelFor(application.status)}
                      </StatusBadge>
                    </div>

                    <p className="applicant__note">
                      &ldquo;{application.motivationStatement}&rdquo;
                    </p>

                    {application.resumeUrl && (
                      <p className="data__meta">
                        <a href={application.resumeUrl} target="_blank" rel="noreferrer">
                          Open their CV ↗
                        </a>
                      </p>
                    )}

                    {application.status === 'PENDING' && (
                      <div className="cluster">
                        <Button
                          variant="primary"
                          className="btn--small"
                          disabled={busy === application.id}
                          onClick={() => decide(application.id, 'ACCEPT')}
                        >
                          Accept
                        </Button>
                        <Button
                          className="btn--small btn--danger"
                          disabled={busy === application.id}
                          onClick={() => decide(application.id, 'REJECT')}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )
        }}
      </Loaded>
    </>
  )
}

/** The organisation's page for one of its opportunities. */
export default function Applicants() {
  const params = useParams()
  const id = params.id ?? ''
  const opportunity = useGet<OpportunityView>(`/opportunities/${id}`)

  return (
    <>
      <p className="backlink">
        <Link to="/manage/opportunities">← All opportunities</Link>
      </p>

      <PageHeader title={opportunity.data?.title ?? 'Applicants'} />

      {opportunity.data && (
        <p className="lede" style={{ marginBottom: 18 }}>
          {meta(
            whenLabel(opportunity.data.startsAt, opportunity.data.endsAt),
            `up to ${quantity(opportunity.data.maxCapacity, 'volunteer')}`,
          )}
        </p>
      )}

      <ApplicantsPanel opportunityId={id} />
    </>
  )
}
