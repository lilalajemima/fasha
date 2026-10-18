import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/PageHeader'
import { Button, Card, Field, RemovableTag, TextField } from '../../components/ui'
import { getProfile } from '../../mocks/api'
import type { Profile as ProfileType } from '../../mocks/types'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function TagEditor({ label, values, placeholder, onAdd, onRemove }: {
  label: string; values: string[]; placeholder: string
  onAdd: (value: string) => void; onRemove: (value: string) => void
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
      <input className="input" placeholder={placeholder} value={draft} aria-label={placeholder}
             onChange={e => setDraft(e.target.value)}
             onKeyDown={e => {
               if (e.key === 'Enter' && draft.trim()) {
                 e.preventDefault(); onAdd(draft.trim()); setDraft('')
               }
             }} />
    </div>
  )
}

export default function Profile() {
  const [profile, setProfile] = useState<ProfileType | null>(null)
  useEffect(() => { getProfile().then(p => setProfile({ ...p })) }, [])
  if (!profile) return null

  const update = (patch: Partial<ProfileType>) => setProfile({ ...profile, ...patch })
  const toggleDay = (day: string) => update({
    days: profile.days.includes(day) ? profile.days.filter(d => d !== day) : [...profile.days, day],
  })

  return (
    <>
      <PageHeader title="Your Profile"
                  action={<Button variant="primary">Save changes</Button>} />

      <div className="page-grid">
        <div className="stack">
          <Card>
            <h2>About you</h2>
            <div className="cluster" style={{ marginBottom: 18 }}>
              <span className="avatar" style={{ width: 48, height: 48, fontSize: 15 }}>AM</span>
              <div>
                <Button>Change photo</Button>
                <div className="muted" style={{ marginTop: 6 }}>JPG or PNG · up to 5 MB</div>
              </div>
            </div>
            <div className="two-col">
              <Field id="name" label="Full name" value={profile.name}
                     onChange={e => update({ name: e.target.value })} />
              <Field id="location" label="Location" value={profile.location}
                     onChange={e => update({ location: e.target.value })} />
            </div>
            <TextField id="bio" label="Short bio" value={profile.bio}
                       onChange={e => update({ bio: e.target.value })} />
          </Card>

          <Card>
            <h2>Skills &amp; interests</h2>
            <p className="muted">These tags help us recommend relevant opportunities.</p>
            <TagEditor label="Skills" values={profile.skills} placeholder="Search skills..."
                       onAdd={v => update({ skills: [...profile.skills, v] })}
                       onRemove={v => update({ skills: profile.skills.filter(s => s !== v) })} />
            <TagEditor label="Areas of interest" values={profile.interests} placeholder="Search interests..."
                       onAdd={v => update({ interests: [...profile.interests, v] })}
                       onRemove={v => update({ interests: profile.interests.filter(i => i !== v) })} />
          </Card>

          <Card>
            <h2>General availability</h2>
            <p className="muted">Choose a usual schedule. Each opportunity has its own dates.</p>
            <div className="cluster" style={{ marginBottom: 18 }}>
              {DAYS.map(day => (
                <button key={day} type="button" className="daychip"
                        aria-pressed={profile.days.includes(day)} onClick={() => toggleDay(day)}>
                  {day}{profile.days.includes(day) ? ' ✓' : ''}
                </button>
              ))}
            </div>
            <div className="two-col">
              <Field id="time" label="Preferred time" value={profile.preferredTime}
                     onChange={e => update({ preferredTime: e.target.value })} />
              <Field id="participation" label="Participation" value={profile.participation}
                     onChange={e => update({ participation: e.target.value })} />
            </div>
          </Card>
        </div>

        <aside className="stack">
          <Card variant="tint">
            <h2 style={{ color: 'var(--primary)' }}>You control what&rsquo;s shared</h2>
            <p className="muted" style={{ margin: 0 }}>
              Applications share your profile, motivation and attached resume with the organiser.
              Your public portfolio only shows your name, bio and verified contributions.
            </p>
          </Card>
          <Link to="/portfolio"><Button block>Preview public portfolio</Button></Link>
        </aside>
      </div>
    </>
  )
}
