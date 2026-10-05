import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, Field, TextField } from '../../components/ui'
import { getProfile } from '../../mocks/api'
import type { Profile as ProfileType } from '../../mocks/types'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function TagEditor({ label, values, onRemove, onAdd, placeholder }: {
  label: string; values: string[]; placeholder: string
  onRemove: (value: string) => void; onAdd: (value: string) => void
}) {
  const [draft, setDraft] = useState('')
  return (
    <div className="field">
      <div className="label">{label}</div>
      <div className="cluster" style={{ marginBottom: 10 }}>
        {values.map(value => (
          <span key={value} className="tag">
            {value}{' '}
            <button onClick={() => onRemove(value)} aria-label={`Remove ${value}`}
                    style={{ border: 0, background: 'none', cursor: 'pointer', color: 'inherit' }}>x</button>
          </span>
        ))}
      </div>
      <input className="input" placeholder={placeholder} value={draft}
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
      <div className="row">
        <div>
          <p className="eyebrow">Your account</p>
          <h1>A profile that opens doors</h1>
          <p className="lede">Tell your community what you enjoy and where you can help.</p>
        </div>
        <Button variant="primary">Save changes</Button>
      </div>

      <div className="page-grid">
        <div className="stack">
          <Card>
            <h2>About you</h2>
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
                       onAdd={value => update({ skills: [...profile.skills, value] })}
                       onRemove={value => update({ skills: profile.skills.filter(s => s !== value) })} />
            <TagEditor label="Areas of interest" values={profile.interests} placeholder="Search interests..."
                       onAdd={value => update({ interests: [...profile.interests, value] })}
                       onRemove={value => update({ interests: profile.interests.filter(i => i !== value) })} />
          </Card>

          <Card>
            <h2>General availability</h2>
            <p className="muted">Choose a usual schedule. Each opportunity has its own dates.</p>
            <div className="cluster" style={{ marginBottom: 16 }}>
              {DAYS.map(day => (
                <button key={day} type="button" className="tag" onClick={() => toggleDay(day)}
                        aria-pressed={profile.days.includes(day)}
                        style={{
                          cursor: 'pointer', border: 0,
                          background: profile.days.includes(day) ? 'var(--tint-100)' : 'var(--chip)',
                          color: profile.days.includes(day) ? 'var(--navy-700)' : 'var(--muted)',
                        }}>
                  {day}
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
          <Card>
            <h2>Looking good</h2>
            <div className="stat-value">{profile.completeness}%</div>
            <p className="muted">Your profile is almost complete.</p>
            <div style={{ height: 6, background: 'var(--chip)', borderRadius: 3 }}>
              <div style={{ width: `${profile.completeness}%`, height: 6,
                            background: 'var(--navy-900)', borderRadius: 3 }} />
            </div>
            <p className="muted" style={{ marginTop: 10 }}>Add a photo to make your profile feel more personal.</p>
          </Card>
          <Card variant="tint">
            <h2>You control what is shared</h2>
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
