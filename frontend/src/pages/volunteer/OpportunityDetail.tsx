import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import PageHeader from '../../components/PageHeader'
import { Button, Card, FileDrop, StatusBadge, Tag, TextField } from '../../components/ui'
import { getOpportunity, isOpen } from '../../mocks/api'
import { myProfile } from '../../mocks/data'
import type { Opportunity } from '../../mocks/types'

export default function OpportunityDetail() {
  const { id = '' } = useParams()
  const [item, setItem] = useState<(Opportunity & { match: number }) | undefined>()
  const [motivation, setMotivation] = useState(
    'I would love to help care for the wetland I walk through every day. ' +
    'I am comfortable working in teams and can stay for the full morning.')
  const [sent, setSent] = useState(false)

  useEffect(() => { getOpportunity(id).then(setItem) }, [id])
  if (!item) return <p className="empty">Opportunity not found.</p>

  const open = isOpen(item)

  function apply(event: FormEvent) {
    event.preventDefault()
    setSent(true)
  }

  return (
    <>
      <p style={{ marginBottom: 18 }}><Link to="/discover">← Back to Discover</Link></p>
      <PageHeader
        eyebrow={`${item.organiser} · ${item.mode}`}
        title={item.title}
        meta={`${item.date} · ${item.time} · ${item.place}`}
      />

      <div className="page-grid">
        <div className="stack">
          <Card>
            <div className="cluster">
              <StatusBadge tone="ok">Published</StatusBadge>
              <StatusBadge tone="match">{item.match}% match</StatusBadge>
            </div>
            <h2 style={{ marginTop: 18, fontSize: 19 }}>{item.summary}</h2>
            <p>{item.description}</p>

            <h3 style={{ marginTop: 18 }}>How you&rsquo;ll help</h3>
            <ul>{item.tasks.map(task => <li key={task}>{task}</li>)}</ul>

            <div className="cluster" style={{ margin: '14px 0' }}>
              {item.tags.map(t => <Tag key={t}>{t}</Tag>)}
            </div>

            {item.beforeYouArrive && (
              <>
                <hr />
                <h3>Before you arrive</h3>
                <p className="muted" style={{ margin: 0 }}>{item.beforeYouArrive}</p>
              </>
            )}
          </Card>

          <Card>
            <h2>Other opportunity availability</h2>
            <p className="muted">Examples of when applications are unavailable.</p>
            <div className="row" style={{ borderTop: '1px solid var(--neutral-border)', paddingTop: 16 }}>
              <div>
                <h3 style={{ marginBottom: 2 }}>Community repair cafe</h3>
                <p className="muted" style={{ margin: 0 }}>20 of 20 places filled · capacity reached</p>
              </div>
              <Button disabled>Opportunity full</Button>
            </div>
            <div className="row" style={{ borderTop: '1px solid var(--neutral-border)', paddingTop: 16, marginTop: 16 }}>
              <div>
                <h3 style={{ marginBottom: 2 }}>Neighbourhood street mural</h3>
                <p className="muted" style={{ margin: 0 }}>Deadline passed on 7 Oct · applications closed</p>
              </div>
              <Button disabled>Applications closed</Button>
            </div>
          </Card>
        </div>

        <aside className="stack">
          <Card>
            <h2>Apply to join</h2>
            <div className="row" style={{ alignItems: 'flex-start' }}>
              <div>
                <div className="minilabel">Capacity</div>
                <strong>{item.filled} / {item.capacity} filled</strong>
              </div>
              <div>
                <div className="minilabel">Apply by</div>
                <strong>{item.deadline}</strong>
              </div>
            </div>
            <hr />

            <div className="minilabel">Your shared profile</div>
            <h3 style={{ marginTop: 8, marginBottom: 2 }}>{myProfile.name}</h3>
            <p className="muted">Kimironko · weekend mornings</p>
            <div className="cluster">
              {myProfile.skills.map(s => <span key={s} className="tag tag--brand">{s}</span>)}
            </div>
            <p style={{ margin: '12px 0 18px' }}><Link to="/profile">Edit profile ↗</Link></p>

            {sent ? (
              <Card variant="tint">
                <h3>Application sent</h3>
                <p className="muted" style={{ margin: 0 }}>
                  You can withdraw it from My activity before the event.
                </p>
              </Card>
            ) : (
              <form onSubmit={apply}>
                <TextField id="motivation" label="Why would you like to help?" value={motivation}
                           maxLength={1000} onChange={e => setMotivation(e.target.value)}
                           hint={`Motivation · ${motivation.length} / 1,000 characters`} />
                <FileDrop label="Attach resume or portfolio" hint="PDF or DOCX · up to 10 MB" />
                <p className="muted" style={{ marginTop: 14 }}>
                  Your profile, motivation and attachment will be shared with the organiser.
                </p>
                <Button type="submit" variant="primary" block disabled={!open}>
                  {open ? 'Submit application' : 'Opportunity full'}
                </Button>
                <p className="muted" style={{ marginTop: 12, marginBottom: 0 }}>
                  For volunteer accounts only. You can withdraw from My activity before the event.
                </p>
              </form>
            )}
          </Card>

          {open && (
            <Card variant="tint">
              <h3 style={{ color: 'var(--primary)' }}>{item.capacity - item.filled} places available</h3>
              <p className="muted" style={{ margin: 0 }}>
                Applying is available until the capacity is reached or the deadline passes.
              </p>
            </Card>
          )}
        </aside>
      </div>
    </>
  )
}
