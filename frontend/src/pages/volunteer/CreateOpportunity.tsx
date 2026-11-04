import { useEffect, useState, type FormEvent } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import Icon from '../../components/Icon'
import PageHeader from '../../components/PageHeader'
import { Button, Card, Field, RemovableTag, TextField } from '../../components/ui'
import { useAuth } from '../../auth/AuthContext'
import { api } from '../../lib/api'
import { SECTORS } from '../../lib/sectors'
import type { OpportunityMode, OpportunityView } from '../../lib/types'
import { messageFor } from '../../lib/useGet'

const MIN_TITLE = 6
const MIN_DESCRIPTION = 20

/** ISO back into what a datetime-local input wants, in the reader's own
 *  timezone, so a loaded record shows the time it was entered as. */
function forInput(iso: string | null): string {
  if (!iso) return ''

  const at = new Date(iso)
  const pad = (part: number) => String(part).padStart(2, '0')

  return `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}T${pad(at.getHours())}:${pad(at.getMinutes())}`
}

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
  const { id } = useParams()
  const { user } = useAuth()

  const editing = Boolean(id)
  const fromManagement = location.pathname.startsWith('/manage')
  const needsApproval = user?.role !== 'organisation'
  const noun = needsApproval ? 'initiative' : 'opportunity'
  const listing = fromManagement ? '/manage/opportunities' : '/initiatives'

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
  const [reviewNote, setReviewNote] = useState<string | null>(null)
  const [wasRejected, setWasRejected] = useState(false)
  const [loading, setLoading] = useState(editing)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // Editing loads the record once and fills the same fields the create flow uses.
  useEffect(() => {
    if (!id) return

    let live = true

    api.get<OpportunityView>(`/opportunities/${id}`)
      .then(item => {
        if (!live) return

        setMode(item.mode as OpportunityMode)
        setTitle(item.title)
        setDescription(item.description)
        setPlace(item.location ?? '')
        setSector(item.sector ?? 'Kimironko')
        setCapacity(String(item.maxCapacity))
        setDeadline(forInput(item.applicationDeadline))
        setStartsAt(forInput(item.startsAt))
        setEndsAt(forInput(item.endsAt))
        setSkills(item.requiredSkills)
        setCategories(item.categories)
        setReviewNote(item.reviewNote)
        setWasRejected(item.status === 'REJECTED')
        setLoading(false)
      })
      .catch(problem => {
        if (!live) return

        setError(messageFor(problem))
        setLoading(false)
      })

    return () => {
      live = false
    }
  }, [id])

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setBusy(true)

    const body = {
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
    }

    try {
      if (id) {
        await api.patch(`/opportunities/${id}`, body)
      } else {
        await api.post('/opportunities', body)
      }

      navigate(listing)
    } catch (problem) {
      setError(messageFor(problem))
      setBusy(false)
    }
  }

  function saveLabel(): string {
    if (busy) return 'Sending…'
    if (wasRejected) return 'Save and resubmit'
    if (editing) return 'Save changes'

    return needsApproval ? 'Submit for approval' : 'Publish opportunity'
  }

  if (loading) {
    return (
      <>
        <PageHeader title={`Edit ${noun}`} />
        <p className="muted">Loading…</p>
      </>
    )
  }

  return (
    <form onSubmit={submit}>
      <PageHeader
        title={
          editing
            ? `Edit ${noun}`
            : needsApproval
              ? 'Propose an initiative'
              : 'Create an opportunity'
        }
      />

      <div className="stack form-column">
          {wasRejected && reviewNote && (
            <Card>
              <h2>What the reviewer asked for</h2>
              <p className="muted" style={{ marginBottom: 0 }}>
                {reviewNote} Saving sends it back for review.
              </p>
            </Card>
          )}

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
              {saveLabel()}
            </Button>
            {editing && (
              <Button type="button" disabled={busy} onClick={() => navigate(listing)}>
                Cancel
              </Button>
            )}
          </div>
        </div>

    </form>
  )
}