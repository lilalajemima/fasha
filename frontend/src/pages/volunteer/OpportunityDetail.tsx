import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Loaded } from '../../components/Loader'
import PageHeader from '../../components/PageHeader'
import { Button, Card, StatusBadge, Tag, TextField } from '../../components/ui'
import { useAuth } from '../../auth/AuthContext'
import { api } from '../../lib/api'
import { dateAndTime, hasPassed, sentenceCase, whenLabel } from '../../lib/format'
import type { OpportunityView, ProfileView } from '../../lib/types'
import { messageFor, useGet } from '../../lib/useGet'

const MIN_STATEMENT = 30

function ApplyPanel({ item }: { item: OpportunityView }) {
  const { user } = useAuth()
  const me = useGet<ProfileView>('/auth/me')
  const [motivation, setMotivation] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)

  const closed = hasPassed(item.applicationDeadline) || item.status !== 'PUBLISHED'
  const mine = user?.id === item.creator.id
  const organisation = user?.role === 'organisation'

  async function apply(event: FormEvent) {
    event.preventDefault()
    setError('')
    setBusy(true)

    try {
      await api.post(`/opportunities/${item.id}/applications`, {
        motivationStatement: motivation.trim(),
      })
      setSent(true)
    } catch (problem) {
      setError(messageFor(problem))
    } finally {
      setBusy(false)
    }
  }

  if (sent) {
    return (
      <Card>
        <h2>Application sent</h2>
        <p className="muted" style={{ marginBottom: 14 }}>
          The organiser will review it. You can withdraw from My activity until they decide.
        </p>
        <Link to="/activity"><Button block>Go to My activity</Button></Link>
      </Card>
    )
  }

  return (
    <Card>
      <h2>Apply to join</h2>

      <div className="row" style={{ alignItems: 'flex-start' }}>
        <div>
          <div className="minilabel">Capacity</div>
          <strong>up to {item.maxCapacity}</strong>
        </div>
        <div>
          <div className="minilabel">Apply by</div>
          <strong>{dateAndTime(item.applicationDeadline)}</strong>
        </div>
      </div>
      <hr />

      {me.data?.profile && (
        <>
          <div className="minilabel">Your shared profile</div>
          <h3 style={{ marginTop: 8, marginBottom: 2 }}>{me.data.user.name}</h3>
          <p className="muted">
            {me.data.profile.location ?? 'Location not set'} ·{' '}
            {me.data.profile.availability ?? 'Availability not set'}
          </p>
          <div className="cluster">
            {me.data.profile.skills.map(skill => (
              <span key={skill} className="tag tag--brand">{skill}</span>
            ))}
          </div>
          <p style={{ margin: '12px 0 18px' }}><Link to="/profile">Edit profile ↗</Link></p>
        </>
      )}

      {organisation ? (
        <p className="muted" style={{ margin: 0 }}>
          Organisation accounts organise opportunities rather than taking part in them.
        </p>
      ) : mine ? (
        <p className="muted" style={{ margin: 0 }}>
          This is your own initiative, so you cannot apply to it.
        </p>
      ) : (
        <form onSubmit={apply}>
          <TextField
            id="motivation"
            label="Why would you like to help?"
            value={motivation}
            maxLength={1000}
            required
            onChange={event => setMotivation(event.target.value)}
            hint={`At least ${MIN_STATEMENT} characters · ${motivation.length} / 1,000`}
          />

          {error && <p className="error" role="alert">{error}</p>}

          <p className="muted" style={{ marginTop: 14 }}>
            Your profile and motivation will be shared with the organiser.
          </p>

          <Button
            type="submit"
            variant="primary"
            block
            disabled={busy || closed || motivation.trim().length < MIN_STATEMENT}
          >
            {closed ? 'Applications closed' : busy ? 'Sending…' : 'Submit application'}
          </Button>
        </form>
      )}
    </Card>
  )
}

export default function OpportunityDetail() {
  const { id = '' } = useParams()
  const opportunity = useGet<OpportunityView>(`/opportunities/${id}`)

  return (
    <Loaded state={opportunity} what="this opportunity">
      {item => (
        <>
          <p style={{ marginBottom: 18 }}><Link to="/discover">← Back to Discover</Link></p>

          <PageHeader
            eyebrow={`${item.creator.name} · ${sentenceCase(item.mode)}`}
            title={item.title}
            meta={`${whenLabel(item.startsAt, item.endsAt)} · ${item.location ?? 'Online'}`}
          />

          <div className="page-grid">
            <div className="stack">
              <Card>
                <div className="cluster">
                  <StatusBadge tone={item.status === 'PUBLISHED' ? 'ok' : 'warn'}>
                    {sentenceCase(item.status)}
                  </StatusBadge>
                  {item.matchScore !== undefined && (
                    <StatusBadge tone="match">{item.matchScore}% match</StatusBadge>
                  )}
                </div>

                <p style={{ marginTop: 18 }}>{item.description}</p>

                {item.requiredSkills.length > 0 && (
                  <>
                    <h3 style={{ marginTop: 18 }}>Skills the organiser asked for</h3>
                    <div className="cluster">
                      {item.requiredSkills.map(skill => <Tag key={skill}>{skill}</Tag>)}
                    </div>
                  </>
                )}

                {item.categories.length > 0 && (
                  <>
                    <h3 style={{ marginTop: 18 }}>Areas</h3>
                    <div className="cluster">
                      {item.categories.map(category => <Tag key={category}>{category}</Tag>)}
                    </div>
                  </>
                )}
              </Card>
            </div>

            <aside className="stack">
              <ApplyPanel item={item} />
            </aside>
          </div>
        </>
      )}
    </Loaded>
  )
}
