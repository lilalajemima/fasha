import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loaded } from '../../components/Loader'
import { Button, Card, Field, RemovableTag, StatusBadge } from '../../components/ui'
import { useAuth } from '../../auth/AuthContext'
import { api } from '../../lib/api'
import { SECTORS } from '../../lib/sectors'
import type { ProfileView } from '../../lib/types'
import { messageFor, useGet } from '../../lib/useGet'
import '../../styles/workspace.css'
import './Profile.css'

/** "Lydia Runiga" -> "LR". Kept local so the page owns its own small details. */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]!.toUpperCase())
    .join('')
}

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
  const [sector, setSector] = useState(loaded.profile?.sector ?? '')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)

  const isVolunteer = loaded.profile !== null

  /** Put every field back to what the server last gave us. */
  function cancel() {
    setName(loaded.user.name)
    setSkills(loaded.profile?.skills ?? [])
    setInterests(loaded.profile?.interests ?? [])
    setAvailability(loaded.profile?.availability ?? '')
    setLocation(loaded.profile?.location ?? '')
    setSector(loaded.profile?.sector ?? '')
    setError('')
    setSaved(false)
  }

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
              sector: sector === '' ? null : sector,
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
      <section className="banner banner--profile">
        <h1 className="banner__title">Your profile</h1>
      </section>

      <div className="profile-grid">
        <div className="stack">
          {error && <p className="error" role="alert">{error}</p>}
          {saved && <StatusBadge tone="ok">Saved</StatusBadge>}

          {/* One sheet. The headings separate the sections; cards would only
              chop a single form into four boxes. */}
          <Card>
            <h2>About you</h2>
            <div className="cluster" style={{ marginBottom: 18 }}>
              <span className="avatar" style={{ width: 48, height: 48, fontSize: 15 }}>
                {initials(name)}
              </span>
              <div className="muted">{loaded.user.email}</div>
            </div>

            <div className="profile-pair">
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

            {isVolunteer && (
              <>
                <div className="profile-rule" />

                <h2>Skills and interests</h2>
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
                  onRemove={value => setInterests(interests.filter(item => item !== value))}
                />

                <div className="profile-rule" />

                <h2>Where you are</h2>
                <div className="field">
                  <label className="label" htmlFor="sector">Sector</label>
                  <select
                    id="sector"
                    className="input"
                    value={sector}
                    onChange={event => setSector(event.target.value)}
                  >
                    <option value="">Not set</option>
                    {SECTORS.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div className="profile-rule" />

                <h2>General availability</h2>
                <Field
                  id="availability"
                  label="When you are usually free"
                  value={availability}
                  placeholder="Weekend mornings"
                  onChange={event => setAvailability(event.target.value)}
                />
              </>
            )}
          </Card>

          <div className="cluster">
            <Button type="submit" variant="primary" disabled={busy}>
              {busy ? 'Saving…' : 'Save changes'}
            </Button>
            <Button type="button" disabled={busy} onClick={cancel}>Cancel changes</Button>
          </div>
        </div>

        <aside className="stack">
          {isVolunteer && (
            <Card>
              <h2>Your public portfolio</h2>
              <p className="muted">
                The page anybody with the link can see. Verified contributions only.
              </p>
              <Link to="/portfolio">
                <Button type="button" variant="primary" block>Preview public portfolio</Button>
              </Link>
            </Card>
          )}

          <Card>
            <h2>Account</h2>
            <p className="muted">Signed in as {loaded.user.email}</p>
            <Button
              type="button"
              variant="primary"
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
