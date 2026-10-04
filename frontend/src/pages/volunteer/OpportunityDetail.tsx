import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button, Card, FileDrop, StatusBadge, Tag, TextField } from '../../components/ui'
import { getOpportunity, isOpen } from '../../mocks/api'
import { myProfile } from '../../mocks/data'
import type { Opportunity } from '../../mocks/types'

export default function OpportunityDetail() {
  const { id = '' } = useParams()
  const [item, setItem] = useState<(Opportunity & { match: number }) | undefined>()
  const [motivation, setMotivation] = useState('')
  const [sent, setSent] = useState(false)

  useEffect(() => { getOpportunity(id).then(setItem) }, [id])
  if (!item) return <p className="empty">Opportunity not found.</p>

  const open = isOpen(item)
  const deadlinePassed = item.status !== 'PUBLISHED'

  function apply(event: FormEvent) {
    event.preventDefault()
    setSent(true)
  }

  return (
    <>
      <Link to="/discover">&larr; Back to Discover</Link>
      <p className="eyebrow" style={{ marginTop: 20 }}>{item.organiser} - {item.mode}</p>
      <h1>{item.title}</h1>
      <p className="lede">{item.date} - {item.time} - {item.place}</p>

      <div className="page-grid">
        <div className="stack">
          <Card>
            <div className="cluster">
              <StatusBadge tone="ok">{item.status === 'PUBLISHED' ? 'Published' : 'Awaiting approval'}</StatusBadge>
              <StatusBadge tone="ok">{item.match}% match</StatusBadge>
            </div>
            <h2 style={{ marginTop: 16 }}>{item.summary}</h2>
            <p>{item.description}</p>

            <h3>How you will help</h3>
            <ul>{item.tasks.map(task => <li key={task}>{task}</li>)}</ul>

            <div className="cluster">{item.tags.map(t => <Tag key={t}>{t}</Tag>)}</div>

            <div className="card card--tint" style={{ marginTop: 16 }}>
              <h3>Why this fits you</h3>
              <p className="muted" style={{ margin: 0 }}>
                Your skills and interests overlap with this opportunity&rsquo;s tags.
                Match scores use weighted skills and interest compatibility.
              </p>
            </div>

            {item.beforeYouArrive && (
              <>
                <hr />
                <h3>Before you arrive</h3>
                <p className="muted">{item.beforeYouArrive}</p>
              </>
            )}
          </Card>
        </div>

        <aside>
          <Card>
            <h2>Apply to join</h2>
            <div className="row">
              <div><div className="muted">Capacity</div><strong>{item.filled} / {item.capacity} filled</strong></div>
              <div><div className="muted">Apply by</div><strong>{item.deadline}</strong></div>
            </div>
            <hr />

            <div className="muted">Your shared profile</div>
            <h3 style={{ marginTop: 6 }}>{myProfile.name}</h3>
            <p className="muted">{myProfile.location} - {myProfile.preferredTime}</p>
            <div className="cluster">{myProfile.skills.map(s => <Tag key={s}>{s}</Tag>)}</div>
            <p style={{ marginTop: 10 }}><Link to="/profile">Edit profile</Link></p>

            {sent ? (
              <div className="card card--tint">
                <h3>Application sent</h3>
                <p className="muted" style={{ margin: 0 }}>
                  You can withdraw it from My activity before the event.
                </p>
              </div>
            ) : (
              <form onSubmit={apply}>
                <TextField id="motivation" label="Why would you like to help?" value={motivation}
                           maxLength={1000} onChange={e => setMotivation(e.target.value)}
                           hint={`Motivation - ${motivation.length} / 1,000 characters`} />
                <FileDrop label="Attach resume or portfolio" hint="PDF or DOCX - up to 10 MB" />
                <p className="muted" style={{ marginTop: 12 }}>
                  Your profile, motivation and attachment will be shared with the organiser.
                </p>
                <Button type="submit" variant="primary" block disabled={!open || deadlinePassed}>
                  {open ? 'Submit application' : 'Opportunity full'}
                </Button>
                <p className="muted" style={{ marginTop: 10 }}>
                  For volunteer accounts only. You can withdraw from My activity before the event.
                </p>
              </form>
            )}
          </Card>
        </aside>
      </div>
    </>
  )
}
