import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loaded } from '../../components/Loader'
import PageHeader from '../../components/PageHeader'
import { Button, Card, Field, RemovableTag, StatusBadge } from '../../components/ui'
import { useAuth } from '../../auth/AuthContext'
import { api } from '../../lib/api'
import { initials } from '../../lib/format'
import type { ProfileView } from '../../lib/types'
import { messageFor, useGet } from '../../lib/useGet'

function TagEditor({ label, values, placeholder, onAdd, onRemove }: {
  label: string
  values: string[]
  placeholder: string
  onAdd: (value: string) => void
  onRemove: (value: string) => void
}) {
  const [draft, setDraft] = useState('')

  return (
    <div className="field">
      <div className="label">{label}</div>
      <div className="cluster" style={{ marginBottom: 12 }}>
        {values.map(value => (
          <RemovableTag key={value} onRemove={() => onRemove(value)}>{value}</RemovableTag>
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
            onAdd(draft.trim())
            setDraft('')
          }
        }}
      />
    </div>
  )
}

function Editor({ loaded, onSaved }: { loaded: ProfileView; onSaved: () => void }) {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState(loaded.user.name)
  const [skills, setSkills] = useState(loaded.profile?.skills ?? [])
  const [interests, setInterests] = useState(loaded.profile?.interests ?? [])
  const [availability, setAvailability] = useState(loaded.profile?.availability ?? '')
  const [location, setLocation] = useState(loaded.profile?.location ?? '')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)

  const isVolunteer = loaded.profile !== null

  async function save(event: FormEvent) {
    event.preventDefault()
    setError('')
    setSaved(false)
    setBusy(true)

    try {
      await api.patch('/profile', {
        name,
        ...(isVolunteer
          ? {
              skills,
              interests,
              availability: availability.trim() === '' ? null : availability.trim(),
              location: location.trim() === '' ? null : location.trim(),
            }
          : {}),
      })
      setSaved(true)
      onSaved()
    } catch (problem) {
      setError(messageFor(problem))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={save}>
      <PageHeader
        title="Your Profile"
        action={
          <Button type="submit" variant="primary" disabled={busy}>
            {busy ? 'Saving…' : 'Save changes'}
          </Button>
        }
      />

      <div className="page-grid">
        <div className="stack">
          {error && <p className="error" role="alert">{error}</p>}
          {saved && <StatusBadge tone="ok">Saved</StatusBadge>}

          <Card>
            <h2>About you</h2>
            <div className="cluster" style={{ marginBottom: 18 }}>
              <span className="avatar" style={{ width: 48, height: 48, fontSize: 15 }}>
                {initials(name)}
              </span>
              <div className="muted">{loaded.user.email}</div>
            </div>

            <div className="two-col">
              <Field
                id="name"
                label="Full name"
                value={name}
                required
                onChange={event => setName(event.target.value)}
              />
              {isVolunteer && (
                <Field
                  id="location"
                  label="Location"
                  value={location}
                  placeholder="Kimironko, Kigali"
                  onChange={event => setLocation(event.target.value)}
                />
              )}
            </div>
          </Card>

          {isVolunteer && (
            <>
              <Card>
                <h2>Skills &amp; interests</h2>
                <p className="muted">
                  These decide what Discover puts in front of you. Press Enter to add one.
                </p>
                <TagEditor
                  label="Skills"
                  values={skills}
                  placeholder="Add a skill..."
                  onAdd={value => setSkills([...skills, value])}
                  onRemove={value => setSkills(skills.filter(skill => skill !== value))}
                />
                <TagEditor
                  label="Areas of interest"
                  values={interests}
                  placeholder="Add an interest..."
                  onAdd={value => setInterests([...interests, value])}
                  onRemove={value => setInterests(interests.filter(interest => interest !== value))}
                />
              </Card>

              <Card>
                <h2>General availability</h2>
                <p className="muted">A usual pattern. Each opportunity still has its own dates.</p>
                <Field
                  id="availability"
                  label="When you are usually free"
                  value={availability}
                  placeholder="Weekend mornings"
                  onChange={event => setAvailability(event.target.value)}
                />
              </Card>
            </>
          )}
        </div>

        <aside className="stack">
          <Card variant="tint">
            <h2 style={{ color: 'var(--primary)' }}>You control what is shared</h2>
            <p className="muted" style={{ margin: 0 }}>
              Applying shares your profile and motivation with that organiser. Your public
              portfolio shows only your name and verified contributions.
            </p>
          </Card>

          {isVolunteer && (
            <Link to="/portfolio"><Button block>Preview public portfolio</Button></Link>
          )}

          <Card>
            <h2>Account</h2>
            <p className="muted">Signed in as {loaded.user.email}.</p>
            <Button
              type="button"
              block
              onClick={() => {
                signOut()
                navigate('/signin')
              }}
            >
              Sign out
            </Button>
          </Card>
        </aside>
      </div>
    </form>
  )
}

export default function Profile() {
  const me = useGet<ProfileView>('/auth/me')

  return (
    <Loaded state={me} what="your profile">
      {loaded => <Editor key={loaded.user.id} loaded={loaded} onSaved={me.reload} />}
    </Loaded>
  )
}
