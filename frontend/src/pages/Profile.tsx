import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loaded } from '../components/Loader'
import { Button, Card, Field, RemovableTag, StatusBadge, TextField } from '../components/ui'
import { useAuth } from '../auth/AuthContext'
import { api } from '../lib/api'
import { toSquareDataUrl } from '../lib/image'
import { SECTORS } from '../lib/sectors'
import type { ProfileView } from '../lib/types'
import { messageFor, useGet } from '../lib/useGet'
import '../styles/workspace.css'
import './Profile.css'

/** "Lilala Runiga" -> "LR". Kept local so the page owns its own small details. */
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

function Picture({ name, avatar, onPick, onRemove, noun }: {
  name: string
  avatar: string | null
  onPick: (file: File) => void
  onRemove: () => void
  noun: string
}) {
  function choose(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (file) onPick(file)

    // Let the same file be chosen again after a failure.
    event.target.value = ''
  }

  return (
    <div className="picture">
      <span className="picture__frame">
        {avatar ? <img src={avatar} alt="" /> : initials(name)}
      </span>

      <div>
        <div className="cluster">
          <label className="btn btn--small" htmlFor="picture">
            {avatar ? `Change ${noun}` : `Add a ${noun}`}
          </label>
          {avatar && (
            <Button type="button" className="btn--small" onClick={onRemove}>Remove</Button>
          )}
        </div>
        <input
          id="picture"
          className="picture__input"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={choose}
        />
        <p className="hint" style={{ marginTop: 8 }}>
          Square works best. It is cropped and resized to 256px in your browser before it is
          saved, so it stays small on a slow connection.
        </p>
      </div>
    </div>
  )
}

function ChangePassword() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setDone(false)

    if (next !== confirm) {
      setError('The two new passwords do not match')
      return
    }

    setBusy(true)

    try {
      await api.post('/account/password', { currentPassword: current, newPassword: next })
      setCurrent('')
      setNext('')
      setConfirm('')
      setDone(true)
    } catch (problem) {
      setError(messageFor(problem))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <h2>Password</h2>
      <form onSubmit={submit}>
        <Field
          id="current-password"
          label="Current password"
          type="password"
          value={current}
          required
          autoComplete="current-password"
          onChange={event => setCurrent(event.target.value)}
        />
        <div className="two-col">
          <Field
            id="new-password"
            label="New password"
            type="password"
            value={next}
            required
            minLength={8}
            hint="At least 8 characters"
            autoComplete="new-password"
            onChange={event => setNext(event.target.value)}
          />
          <Field
            id="confirm-password"
            label="New password again"
            type="password"
            value={confirm}
            required
            autoComplete="new-password"
            onChange={event => setConfirm(event.target.value)}
          />
        </div>

        {error && <p className="error" role="alert">{error}</p>}
        {done && <StatusBadge tone="ok">Password changed</StatusBadge>}

        <div className="cluster" style={{ marginTop: 14 }}>
          <Button type="submit" variant="primary" disabled={busy}>
            {busy ? 'Saving…' : 'Change password'}
          </Button>
        </div>
      </form>

      <p className="muted" style={{ margin: '14px 0 0' }}>
        Forgotten it? Fasha doesn't send email, so ask the community admin to issue a temporary
        one. You'll be asked to replace it as soon as you sign in.
      </p>
    </Card>
  )
}

/** Both of these are irreversible for the person doing them, so both ask for the password. */
function Leaving() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [typed, setTyped] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')

  async function run(what: string, work: () => Promise<unknown>) {
    setError('')
    setBusy(what)

    try {
      await work()
      signOut()
      navigate('/signin')
    } catch (problem) {
      setError(messageFor(problem))
      setBusy('')
    }
  }

  return (
    <Card>
      <h2>Leaving Fasha</h2>
      <p className="muted">
        Deactivating hides your account and signs you out. Nothing is lost, and the community
        admin can restore it when you come back. Deleting removes your name, your email and your
        way back in. Hours an organiser verified stay on the registers they belong to, because
        they are part of other people's records too, but they are no longer attached to you and
        your portfolio link stops working.
      </p>

      <Field
        id="leave-password"
        label="Your password"
        type="password"
        value={password}
        autoComplete="current-password"
        onChange={event => setPassword(event.target.value)}
      />

      {error && <p className="error" role="alert">{error}</p>}

      <div className="cluster" style={{ marginBottom: 20 }}>
        <Button
          type="button"
          disabled={password === '' || busy !== ''}
          onClick={() => run('deactivate', () => api.patch('/account/deactivate', { password }))}
        >
          {busy === 'deactivate' ? 'Deactivating…' : 'Deactivate my account'}
        </Button>
      </div>

      <hr />

      <Field
        id="confirm-delete"
        label="To delete, type DELETE"
        value={typed}
        placeholder="DELETE"
        onChange={event => setTyped(event.target.value)}
      />

      <Button
        type="button"
        className="btn--danger"
        disabled={password === '' || typed !== 'DELETE' || busy !== ''}
        onClick={() => {
          if (!window.confirm('Delete your account? This cannot be undone.')) return

          run('delete', () => api.post('/account/delete', { password }))
        }}
      >
        {busy === 'delete' ? 'Deleting…' : 'Delete my account'}
      </Button>
    </Card>
  )
}

function Editor({ loaded, onSaved }: { loaded: ProfileView; onSaved: () => void }) {
  const { signOut, refresh } = useAuth()
  const navigate = useNavigate()
  const isVolunteer = loaded.profile !== null

  const [name, setName] = useState(loaded.user.name)
  const [bio, setBio] = useState(loaded.user.bio ?? '')
  const [avatar, setAvatar] = useState(loaded.user.avatar)
  const [skills, setSkills] = useState(loaded.profile?.skills ?? [])
  const [interests, setInterests] = useState(loaded.profile?.interests ?? [])
  const [availability, setAvailability] = useState(loaded.profile?.availability ?? '')
  const [location, setLocation] = useState(loaded.profile?.location ?? '')
  const [sector, setSector] = useState(loaded.profile?.sector ?? '')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)

  /** Put every field back to what the server last gave us. */
  function cancel() {
    setName(loaded.user.name)
    setBio(loaded.user.bio ?? '')
    setAvatar(loaded.user.avatar)
    setSkills(loaded.profile?.skills ?? [])
    setInterests(loaded.profile?.interests ?? [])
    setAvailability(loaded.profile?.availability ?? '')
    setLocation(loaded.profile?.location ?? '')
    setSector(loaded.profile?.sector ?? '')
    setError('')
    setSaved(false)
  }

  async function pickPicture(file: File) {
    setError('')

    try {
      setAvatar(await toSquareDataUrl(file))
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'That picture could not be used')
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    setError('')
    setSaved(false)
    setBusy(true)

    try {
      await api.patch('/profile', {
        name,
        bio: bio.trim() === '' ? null : bio.trim(),
        avatar,
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
      // The top bar carries the same picture and name.
      refresh()
    } catch (problem) {
      setError(messageFor(problem))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <section className="banner banner--profile">
        <h1 className="banner__title">Your profile</h1>
      </section>

      <div className="profile-grid">
        <div className="stack">
          {error && <p className="error" role="alert">{error}</p>}
          {saved && <StatusBadge tone="ok">Saved</StatusBadge>}

          <form className="stack" onSubmit={save}>
            {/* One sheet. The headings separate the sections; cards would only
                chop a single form into four boxes. */}
            <Card>
              <h2>{isVolunteer ? 'About you' : 'About your organisation'}</h2>

              <Picture
                name={name}
                avatar={avatar}
                noun={isVolunteer ? 'picture' : 'logo'}
                onPick={pickPicture}
                onRemove={() => setAvatar(null)}
              />

              <div className="profile-pair">
                <Field
                  id="name"
                  label={isVolunteer ? 'Full name' : 'Organisation name'}
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

              <TextField
                id="bio"
                label={isVolunteer ? 'A short introduction' : 'What your organisation does'}
                value={bio}
                maxLength={600}
                placeholder={
                  isVolunteer
                    ? 'What you like working on, and what you bring to it.'
                    : 'The work you organise and who it is for.'
                }
                hint={`${bio.length} of 600 characters`}
                onChange={event => setBio(event.target.value)}
              />

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
          </form>

          <ChangePassword />
          <Leaving />
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
    </>
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
