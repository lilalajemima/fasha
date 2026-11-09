import { useState, type FormEvent } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { Loaded } from '../../components/Loader'
import PageHeader from '../../components/PageHeader'
import { Button, Card, StatusBadge, Tag, TextField } from '../../components/ui'
import { useAuth } from '../../auth/AuthContext'
import { api } from '../../lib/api'
import { availabilityLine } from '../../lib/catalogue'
import { dateAndTime, hasPassed, meta, quantity, sentenceCase, whenLabel } from '../../lib/format'
import type { OpportunityView, ProfileView } from '../../lib/types'
import { useDraft } from '../../lib/useDraft'
import { messageFor, useGet } from '../../lib/useGet'
import '../../styles/workspace.css'

const MIN_STATEMENT = 30

function ApplyPanel({ item }: { item: OpportunityView }) {
  const { user } = useAuth()
  const me = useGet<ProfileView>('/auth/me')
  const [draft, setDraft, discardDraft] = useDraft(`apply-${item.id}`, { motivation: '' })
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
        motivationStatement: draft.motivation.trim(),
      })
      discardDraft()
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
      <h2>Apply</h2>

      <div className="row" style={{ alignItems: 'flex-start' }}>
        <div>
          <div className="minilabel">Capacity</div>
          <strong>up to {quantity(item.maxCapacity, 'volunteer')}</strong>
        </div>
        <div>
          <div className="minilabel">Apply by</div>
          <strong>{dateAndTime(item.applicationDeadline)}</strong>
        </div>
      </div>
      <hr />

      {me.data?.profile && (
        <>
          <h3 style={{ marginTop: 8, marginBottom: 2 }}>{me.data.user.name}</h3>
          <p className="muted">
            {me.data.profile.location ?? 'Location not set'} ·{' '}
            {availabilityLine(me.data.profile.availabilitySlots)}
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
            value={draft.motivation}
            maxLength={1000}
            required
            onChange={event => setDraft({ motivation: event.target.value })}
            hint={`At least ${MIN_STATEMENT} characters · ${draft.motivation.length} / 1,000`}
          />

          {error && <p className="error" role="alert">{error}</p>}

          <Button
            type="submit"
            variant="primary"
            block
            disabled={busy || closed || draft.motivation.trim().length < MIN_STATEMENT}
          >
            {closed ? 'Applications closed' : busy ? 'Sending…' : 'Submit application'}
          </Button>
        </form>
      )}
    </Card>
  )
}

type From = { to: string; label: string }

export default function OpportunityDetail() {
  const { id = '' } = useParams()
  const location = useLocation()
  const opportunity = useGet<OpportunityView>(`/opportunities/${id}`)
  const back = (location.state as { from?: From } | null)?.from ?? {
    to: '/discover',
    label: 'Discover',
  }

  return (
    <Loaded state={opportunity} what="this opportunity">
      {item => (
        <>
          <p style={{ marginBottom: 18 }}>
            <Link to={back.to}>← Back to {back.label}</Link>
          </p>

          <PageHeader title={item.title} />

          <p className="lede" style={{ marginBottom: 18 }}>
            {meta(
              item.creator.name,
              sentenceCase(item.mode),
              whenLabel(item.startsAt, item.endsAt),
              item.location,
            )}
          </p>

          <div className="stack form-column">
            <Card>
              <div className="cluster">
                {item.matchScore !== undefined && (
                  <StatusBadge tone="match">{item.matchScore}% match</StatusBadge>
                )}
              </div>

              <p style={{ marginTop: 18 }}>{item.description}</p>

              {item.requiredSkills.length > 0 && (
                <>
                  <h3 style={{ marginTop: 18 }}>Skills</h3>
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

            <ApplyPanel item={item} />
          </div>
        </>
      )}
    </Loaded>
  )
}