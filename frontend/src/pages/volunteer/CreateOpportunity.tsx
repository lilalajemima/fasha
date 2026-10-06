import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Field, StatusBadge, Tag, TextField } from '../../components/ui'
import type { Mode } from '../../mocks/types'

export default function CreateOpportunity() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('Physical')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState<string[]>(['Teamwork', 'Environment'])
  const [draft, setDraft] = useState('')

  function submit(event: FormEvent) {
    event.preventDefault()
    navigate('/initiatives')
  }

  return (
    <form onSubmit={submit}>
      <p className="eyebrow">Volunteer creator workspace</p>
      <h1>Create an opportunity</h1>
      <p className="lede">Bring your community idea to life. You can return to edit the details.</p>

      <div className="page-grid">
        <div className="stack">
          <Card>
            <h2>The essentials</h2>
            <Field id="title" label="Opportunity title" value={title} required
                   onChange={e => setTitle(e.target.value)} />

            <div className="field">
              <div className="label">How will volunteers take part?</div>
              <div className="two-col">
                {(['Physical', 'Virtual'] as Mode[]).map(option => (
                  <button key={option} type="button" className="role-card" aria-pressed={mode === option}
                          onClick={() => setMode(option)}>
                    <strong>{option}</strong>
                    <span className="muted">
                      {option === 'Physical' ? 'Meet at a place and time' : 'Contribute remotely'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <TextField id="description" label="Description" value={description}
                       onChange={e => setDescription(e.target.value)} required />

            <div className="field">
              <div className="label">Skills &amp; interest tags</div>
              <div className="cluster" style={{ marginBottom: 10 }}>
                {tags.map(tag => (
                  <span key={tag} className="tag">
                    {tag}{' '}
                    <button type="button" aria-label={`Remove ${tag}`}
                            onClick={() => setTags(tags.filter(t => t !== tag))}
                            style={{ border: 0, background: 'none', cursor: 'pointer', color: 'inherit' }}>x</button>
                  </span>
                ))}
              </div>
              <input className="input" placeholder="Add skills and interests..." value={draft}
                     onChange={e => setDraft(e.target.value)}
                     onKeyDown={e => {
                       if (e.key === 'Enter' && draft.trim()) {
                         e.preventDefault(); setTags([...tags, draft.trim()]); setDraft('')
                       }
                     }} />
            </div>
          </Card>

          <Card>
            <h2>{mode === 'Physical' ? 'Schedule & capacity' : 'Task & capacity'}</h2>

            {mode === 'Physical' ? (
              <>
                <Field id="place" label="Location" required />
                <div className="two-col">
                  <Field id="date" label="Event date" type="date" required />
                  <Field id="time" label="Time" placeholder="10:00-13:00" required />
                </div>
              </>
            ) : (
              <>
                <div className="two-col">
                  <Field id="due" label="Task due date" type="date" required />
                  <Field id="expected" label="Expected hours" type="number" min="1" required />
                </div>
                <TextField id="instructions" label="Deliverable instructions"
                           hint="Volunteers submit a report, claimed hours and a proof link or file." required />
              </>
            )}

            <div className="two-col">
              <Field id="capacity" label="Maximum capacity" type="number" min="1" required />
              <Field id="deadline" label="Application deadline" type="date" required />
            </div>
            <p className="muted">Applying closes when the deadline passes or all places are filled.</p>
          </Card>

          <Card>
            <h2>Invite co-organisers</h2>
            <p className="muted">Find registered Fasha users and invite them to this opportunity.</p>
            <Field id="search" label="Search registered users" placeholder="Start typing a name" />
            <p className="muted">
              Accepted co-organisers may edit details and review applications and deliverables.
              They cannot delete this opportunity or remove the original creator.
            </p>
          </Card>

          <div className="cluster">
            <Button type="submit" variant="primary">Submit for approval</Button>
            <Button type="button">Save draft</Button>
          </div>
        </div>

        <aside className="stack">
          <Card>
            <h2>Before it goes public</h2>
            <Tag>Citizen initiative</Tag>
            <p className="muted" style={{ marginTop: 12 }}>
              Volunteer-created initiatives are reviewed by a community reviewer.
            </p>
            <div className="stack">
              <div>
                <StatusBadge tone="warn">1 - Awaiting approval</StatusBadge>
                <p className="muted" style={{ marginTop: 6 }}>Submitted for review - not in Discover</p>
              </div>
              <div>
                <StatusBadge tone="ok">2 - Published</StatusBadge>
                <p className="muted" style={{ marginTop: 6 }}>Approved by reviewer - visible in Discover</p>
              </div>
              <div>
                <StatusBadge tone="bad">Not approved</StatusBadge>
                <p className="muted" style={{ marginTop: 6 }}>Reviewer feedback provided - remains unpublished</p>
              </div>
            </div>
          </Card>
          <Card variant="tint">
            <h2>An idea is a good place to start</h2>
            <p className="muted" style={{ margin: 0 }}>
              Both volunteers and organisations can create and manage opportunities.
              Only volunteers can take part as participants.
            </p>
          </Card>
        </aside>
      </div>
    </form>
  )
}
