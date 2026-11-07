import { useEffect, useState, type FormEvent } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import Icon from '../../components/Icon'
import PageHeader from '../../components/PageHeader'
import { TagPicker } from '../../components/Pickers'
import { Button, Card, Field, TextField } from '../../components/ui'
import { useAuth } from '../../auth/AuthContext'
import { api } from '../../lib/api'
import { useCatalogue } from '../../lib/catalogue'
import { SECTORS } from '../../lib/sectors'
import type { OpportunityMode, OpportunityView } from '../../lib/types'
import { messageFor } from '../../lib/useGet'

const MIN_TITLE = 6
const MIN_DESCRIPTION = 20

function forInput(iso: string | null): string {
  if (!iso) return ''

  const at = new Date(iso)
  const pad = (part: number) => String(part).padStart(2, '0')

  return `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}T${pad(at.getHours())}:${pad(at.getMinutes())}`
}

type Brief = { name: string; dataUrl: string }

const MAX_BRIEF_BYTES = 1024 * 1024

function readPdf(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('That file could not be read'))
    reader.readAsDataURL(file)
  })
}

export default function CreateOpportunity() {
  const catalogue = useCatalogue()
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
  const [sector, setSector] = useState('')
  const [capacity, setCapacity] = useState('')
  const [deadline, setDeadline] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [brief, setBrief] = useState<Brief | null | undefined>(undefined)
  const [briefName, setBriefName] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [reviewNote, setReviewNote] = useState<string | null>(null)
  const [wasRejected, setWasRejected] = useState(false)
  const [loading, setLoading] = useState(editing)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

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
        setBriefName(item.brief?.name ?? '')
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
      brief: brief === undefined ? undefined : brief,
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

            {catalogue.error && <p className="error" role="alert">{catalogue.error}</p>}

            <TagPicker
              legend="Skills you need"
              hint="Volunteers choose from this same list, which is what lets Fasha rank them for you."
              options={catalogue.data?.skills ?? []}
              value={skills}
              onChange={setSkills}
            />
            <TagPicker
              legend="Areas this falls under"
              hint="The causes this belongs to."
              options={catalogue.data?.interests ?? []}
              value={categories}
              onChange={setCategories}
            />
            <p className="muted">
              These two lists are what the match score is worked out from, so choose only
              what the work really needs: asking for everything matches nobody.
            </p>

            <hr />

            <h2>A brief, if you have one</h2>
            <p className="muted">
              A PDF with the detail that does not fit above: what the day looks like, what to
              bring, who to ask for. Optional, and up to 1MB. Volunteers can open it from the
              opportunity, and it stays on their portfolio afterwards.
            </p>

            {briefName && brief !== null ? (
              <div className="cluster">
                <span className="chip chip--static">{briefName}</span>
                <button
                  type="button"
                  className="data__action data__action--danger"
                  onClick={() => {
                    setBrief(null)
                    setBriefName('')
                  }}
                >
                  Remove
                </button>
              </div>
            ) : (
              <input
                className="input"
                type="file"
                accept="application/pdf"
                aria-label="Attach a brief"
                onChange={async event => {
                  const file = event.target.files?.[0]

                  if (!file) return

                  if (file.size > MAX_BRIEF_BYTES) {
                    setError('That PDF is larger than 1MB. Send a smaller one.')
                    event.target.value = ''
                    return
                  }

                  setError('')
                  setBrief({ name: file.name, dataUrl: await readPdf(file) })
                  setBriefName(file.name)
                }}
              />
            )}
          </Card>

          <Card>
            <h2>{mode === 'PHYSICAL' ? 'Where and how many' : 'How many and by when'}</h2>

            {mode === 'PHYSICAL' && (
              <Field
                id="place"
                label="Location"
                value={place}
                required
                placeholder="location, street, town, city"
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