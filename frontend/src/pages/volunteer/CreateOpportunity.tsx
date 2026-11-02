import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Icon from '../../components/Icon'
import PageHeader from '../../components/PageHeader'
import { Button, Card, Field, RemovableTag, StatusBadge, Tag, TextField } from '../../components/ui'
import { useAuth } from '../../auth/AuthContext'
import { api } from '../../lib/api'
import { SECTORS } from '../../lib/sectors'
import type { OpportunityMode } from '../../lib/types'
import { messageFor } from '../../lib/useGet'

const MIN_TITLE = 6
const MIN_DESCRIPTION = 20

function TagInput({ label, placeholder, values, onChange }: {
  label: string
  placeholder: string
  values: string[]
  onChange: (values: string[]) => void
}) {
  const [draft, setDraft] = useState('')

  return (
    <div className="field">
      <div className="label">{label}</div>
      <div className="cluster" style={{ marginBottom: 12 }}>
        {values.map(value => (
          <RemovableTag key={value} onRemove={() => onChange(values.filter(tag => tag !== value))}>
            {value}
          </RemovableTag>
        ))}
      </div>
      <input
        className="input"
        placeholder={placeholder}
        value={draft}
        aria-label={placeholder}
        onChange={event => setDraft(event.target.value)}
        onKeyDown={event => {
          if (event.key === 'Enter' && draft.trim()) {
            event.preventDefault()
            onChange([...values, draft.trim()])
            setDraft('')
          }
        }}
      />
    </div>
  )
}

export default function CreateOpportunity() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const fromManagement = location.pathname.startsWith('/manage')
  const needsApproval = user?.role !== 'organisation'

  const [mode, setMode] = useState<OpportunityMode>('PHYSICAL')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [place, setPlace] = useState('')
  const [sector, setSector] = useState('Kimironko')
  const [capacity, setCapacity] = useState('15')
  const [deadline, setDeadline] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setBusy(true)

    try {
      await api.post('/opportunities', {
        title: title.trim(),
        description: description.trim(),
        mode,
        location: mode === 'PHYSICAL' ? place.trim() : null,
        sector,
        maxCapacity: Number(capacity),
        applicationDeadline: new Date(deadline).toISOString(),
        startsAt: mode === 'PHYSICAL' ? new Date(startsAt).toISOString() : null,
        endsAt: new Date(endsAt).toISOString(),
        requiredSkills: skills,
        categories,
      })
      navigate(fromManagement ? '/manage/opportunities' : '/initiatives')
    } catch (problem) {
      setError(messageFor(problem))
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit}>
      <PageHeader
        eyebrow={fromManagement ? 'Opportunity management' : 'Volunteer creator workspace'}
        title="Create an opportunity"
        meta="Bring your community idea to life."
      />

      <div className="page-grid">
        <div className="stack">
          <Card>
            <h2>The essentials</h2>
            <Field
              id="title"
              label="Opportunity title"
              value={title}
              required
              minLength={MIN_TITLE}
              placeholder="Restore the Kimironko wetland path"
              onChange={event => setTitle(event.target.value)}
            />

            <div className="field">
              <div className="label">How will volunteers take part?</div>
              <div className="mode-grid">
                {(['PHYSICAL', 'VIRTUAL'] as OpportunityMode[]).map(option => (
                  <button
                    key={option}
                    type="button"
                    className="mode-card"
                    aria-pressed={mode === option}
                    onClick={() => setMode(option)}
                  >
                    <Icon name={option === 'PHYSICAL' ? 'discover' : 'overview'} />
                    <strong>
                      {option === 'PHYSICAL' ? 'Physical' : 'Virtual'}{mode === option ? ' ✓' : ''}
                    </strong>
                    <span className="muted">
                      {option === 'PHYSICAL' ? 'Meet at a place and time' : 'Contribute remotely'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <TextField
              id="description"
              label="Description"
              value={description}
              required
              minLength={MIN_DESCRIPTION}
              placeholder="What will volunteers actually do, and what should they bring?"
              onChange={event => setDescription(event.target.value)}
              hint={`At least ${MIN_DESCRIPTION} characters`}
            />

            <TagInput
              label="Skills you need"
              placeholder="Add a skill and press Enter..."
              values={skills}
              onChange={setSkills}
            />
            <TagInput
              label="Areas this falls under"
              placeholder="Add an area and press Enter..."
              values={categories}
              onChange={setCategories}
            />
            <p className="muted">
              These two lists are what the match score is worked out from, so be specific.
            </p>
          </Card>

          <Card>
            <h2>{mode === 'PHYSICAL' ? 'Where and how many' : 'How many and by when'}</h2>

            {mode === 'PHYSICAL' && (
              <Field
                id="place"
                label="Location"
                value={place}
                required
                placeholder="Kimironko community garden"
                onChange={event => setPlace(event.target.value)}
              />
            )}

            <div className="field">
              <label className="label" htmlFor="sector">Sector</label>
              <select
                id="sector"
                className="input"
                value={sector}
                onChange={event => setSector(event.target.value)}
              >
                {SECTORS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <div className="hint">
                Used for reporting to the sector committee, and for filtering the feed.
              </div>
            </div>

            {mode === 'PHYSICAL' ? (
              <div className="two-col">
                <Field
                  id="startsAt"
                  label="Starts"
                  type="datetime-local"
                  value={startsAt}
                  required
                  onChange={event => setStartsAt(event.target.value)}
                />
                <Field
                  id="endsAt"
                  label="Ends"
                  type="datetime-local"
                  value={endsAt}
                  required
                  onChange={event => setEndsAt(event.target.value)}
                />
              </div>
            ) : (
              <Field
                id="endsAt"
                label="Work due by"
                type="datetime-local"
                value={endsAt}
                required
                hint="Volunteers submit their hours and proof by this date."
                onChange={event => setEndsAt(event.target.value)}
              />
            )}

            <div className="two-col">
              <Field
                id="capacity"
                label="Maximum volunteers"
                type="number"
                min="1"
                value={capacity}
                required
                onChange={event => setCapacity(event.target.value)}
              />
              <Field
                id="deadline"
                label="Application deadline"
                type="datetime-local"
                value={deadline}
                required
                onChange={event => setDeadline(event.target.value)}
              />
            </div>

            <p className="muted" style={{ marginBottom: 0 }}>
              Applying closes when the deadline passes or every place is taken, and the
              deadline has to be on or before the day it happens.
            </p>
          </Card>

          {error && <p className="error" role="alert">{error}</p>}

          <div className="cluster">
            <Button type="submit" variant="primary" disabled={busy}>
              {busy ? 'Sending…' : needsApproval ? 'Submit for approval' : 'Publish opportunity'}
            </Button>
          </div>
        </div>

        <aside className="stack">
          {needsApproval && (
            <Card>
              <h2>Before it goes public</h2>
              <Tag>Citizen initiative</Tag>
              <p className="muted" style={{ marginTop: 14 }}>
                Initiatives proposed by volunteers are reviewed before they appear in Discover.
              </p>
              <div className="stack">
                <div>
                  <StatusBadge tone="warn">1 · Awaiting approval</StatusBadge>
                  <p className="muted" style={{ marginTop: 8, marginBottom: 0 }}>
                    Submitted for review · not in Discover
                  </p>
                </div>
                <div>
                  <StatusBadge tone="ok">2 · Published</StatusBadge>
                  <p className="muted" style={{ marginTop: 8, marginBottom: 0 }}>
                    Approved · visible in Discover
                  </p>
                </div>
              </div>
            </Card>
          )}

          <Card variant="tint">
            <h2 style={{ color: 'var(--primary)' }}>An idea is a good place to start</h2>
            <p className="muted" style={{ margin: 0 }}>
              Both volunteers and organisations can create and manage opportunities. Only
              volunteers can take part as participants.
            </p>
          </Card>
        </aside>
      </div>
    </form>
  )
}
