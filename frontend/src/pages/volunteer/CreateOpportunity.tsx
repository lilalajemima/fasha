import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Icon from '../../components/Icon'
import PageHeader from '../../components/PageHeader'
import { Button, Card, Field, RemovableTag, StatusBadge, Tag, TextField } from '../../components/ui'
import { useAuth } from '../../auth/AuthContext'
import type { Mode } from '../../mocks/types'

export default function CreateOpportunity() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  // Reached from the management section, or from "Propose an initiative".
  const fromManagement = location.pathname.startsWith('/manage')
  // A volunteer's own initiative is a citizen initiative, so it is reviewed first.
  const needsApproval = user?.role !== 'organisation'
  const [mode, setMode] = useState<Mode>('Physical')
  const [title, setTitle] = useState('Kimironko seed swap')
  const [description, setDescription] = useState(
    'Help neighbours exchange seeds and learn about growing food locally. Volunteers will welcome ' +
    'visitors, label seed packets and set up tables at the community garden.')
  const [tags, setTags] = useState(['Teamwork', 'Environment', 'Gardening'])
  const [draft, setDraft] = useState('')

  function submit(event: FormEvent) {
    event.preventDefault()
    navigate(fromManagement ? '/manage/opportunities' : '/initiatives')
  }

  return (
    <form onSubmit={submit}>
      <PageHeader
        eyebrow={fromManagement ? 'Opportunity management' : 'Volunteer creator workspace'}
        title="Create an opportunity"
        meta="Bring your community idea to life. You can return to edit the details."
      />

      <div className="page-grid">
        <div className="stack">
          <Card>
            <h2>The essentials</h2>
            <Field id="title" label="Opportunity title" value={title} required
                   onChange={e => setTitle(e.target.value)} />

            <div className="field">
              <div className="label">How will volunteers take part?</div>
              <div className="mode-grid">
                {(['Physical', 'Virtual'] as Mode[]).map(option => (
                  <button key={option} type="button" className="mode-card"
                          aria-pressed={mode === option} onClick={() => setMode(option)}>
                    <Icon name={option === 'Physical' ? 'discover' : 'overview'} />
                    <strong>{option}{mode === option ? ' ✓' : ''}</strong>
                    <span className="muted">
                      {option === 'Physical' ? 'Meet at a place and time' : 'Contribute remotely'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <TextField id="description" label="Description" value={description} required
                       onChange={e => setDescription(e.target.value)} />

            <div className="cluster" style={{ marginBottom: 12 }}>
              {tags.map(tag => (
                <RemovableTag key={tag} onRemove={() => setTags(tags.filter(t => t !== tag))}>
                  {tag}
                </RemovableTag>
              ))}
            </div>
            <div className="field">
              <div className="label">Skills &amp; interest tags</div>
              <input className="input" placeholder="Add skills and interests..." value={draft}
                     aria-label="Add skills and interests"
                     onChange={e => setDraft(e.target.value)}
                     onKeyDown={e => {
                       if (e.key === 'Enter' && draft.trim()) {
                         e.preventDefault(); setTags([...tags, draft.trim()]); setDraft('')
                       }
                     }} />
            </div>
          </Card>

          {mode === 'Physical' ? (
            <Card>
              <h2>Schedule &amp; capacity</h2>
              <Field id="place" label="Location" defaultValue="Kimironko community garden" required />
              <div className="two-col">
                <Field id="date" label="Event date" defaultValue="31 Oct 2026" required />
                <Field id="time" label="Time" defaultValue="10:00-13:00" required />
              </div>
              <div className="two-col">
                <Field id="capacity" label="Maximum capacity" defaultValue="15 volunteers" required />
                <Field id="deadline" label="Application deadline" defaultValue="28 Oct 2026 · 23:59" required />
              </div>
              <p className="muted">Applying closes when the deadline passes or all 15 places are filled.</p>
              <Card variant="tint">
                <h3 style={{ color: 'var(--primary)' }}>Creating a virtual opportunity?</h3>
                <p className="muted" style={{ margin: 0 }}>
                  Choose Virtual above to replace the location and event time with a task due date,
                  deliverable instructions and expected hours. Volunteers submit a report, claimed
                  hours and proof.
                </p>
              </Card>
            </Card>
          ) : (
            <Card>
              <h2>Virtual setup</h2>
              <Field id="due" label="Task due date" defaultValue="25 Oct 2026" required />
              <Field id="expected" label="Expected hours" defaultValue="4 hours" required />
              <TextField id="instructions" label="Deliverable instructions" required
                         defaultValue="Create an accessible PDF guide. Submit a completion report, claimed hours and a proof link or file." />
              <div className="two-col">
                <Field id="capacity-v" label="Maximum capacity" defaultValue="6 volunteers" required />
                <Field id="deadline-v" label="Application deadline" defaultValue="20 Oct 2026 · 23:59" required />
              </div>
            </Card>
          )}

          <Card>
            <h2>Invite co-organisers</h2>
            <p className="muted">Find registered Fasha users and invite them to this opportunity.</p>
            <Field id="search" label="Search registered users" defaultValue="Maya Uwase" />
            <div className="divided">
              <div className="row">
                <span className="cluster" style={{ gap: 12 }}>
                  <span className="avatar">MU</span>
                  <span>
                    <strong style={{ display: 'block' }}>Maya Uwase</strong>
                    <span className="muted">Registered volunteer · Kimironko</span>
                  </span>
                </span>
                <Button>Send invitation</Button>
              </div>
              <div className="row">
                <span className="cluster" style={{ gap: 12 }}>
                  <span className="avatar">AM</span>
                  <span>Amara Mensah</span>
                </span>
                <StatusBadge tone="bad">Original creator</StatusBadge>
              </div>
            </div>
            <p className="muted" style={{ marginTop: 14, marginBottom: 0 }}>
              Accepted co-organisers may edit details and review applications and deliverables. They
              cannot delete this opportunity or remove the original creator.
            </p>
          </Card>

          <div className="cluster">
            <Button type="submit" variant="primary">
              {needsApproval ? 'Submit for approval' : 'Publish opportunity'}
            </Button>
            <Button type="button">Save draft</Button>
          </div>
        </div>

        <aside className="stack">
          {needsApproval && (
          <Card>
            <h2>Before it goes public</h2>
            <Tag>Citizen initiative</Tag>
            <p className="muted" style={{ marginTop: 14 }}>
              Volunteer-created initiatives are reviewed by a community reviewer.
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
                  Approved by reviewer · visible in Discover
                </p>
              </div>
              <div>
                <StatusBadge tone="bad">Not approved</StatusBadge>
                <p className="muted" style={{ marginTop: 8, marginBottom: 0 }}>
                  Reviewer feedback provided · remains unpublished
                </p>
              </div>
            </div>
          </Card>
          )}
          <Card variant="tint">
            <h2 style={{ color: 'var(--primary)' }}>An idea is a good place to start</h2>
            <p className="muted" style={{ margin: 0 }}>
              Both volunteers and organisations can create and manage opportunities. Only volunteers
              can take part as participants.
            </p>
          </Card>
        </aside>
      </div>
    </form>
  )
}
