import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/PageHeader'
import { Button, Card, EmptyState, StatTile, StatusBadge, Tabs, Tag } from '../../components/ui'
import { getFeed, isOpen } from '../../mocks/api'
import type { Opportunity } from '../../mocks/types'

type Ranked = Opportunity & { match: number }

export default function Discover() {
  const [items, setItems] = useState<Ranked[]>([])
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState('for-you')

  useEffect(() => { getFeed().then(setItems) }, [])

  const visible = tab === 'saved' ? [] : items.filter(o =>
    (o.title + o.organiser + o.tags.join(' ')).toLowerCase().includes(query.toLowerCase()))

  return (
    <>
      <PageHeader title="Where Can I help Next?" />

      <div className="stack">
        <Card>
          <div className="stat-row">
            <StatTile label="Verified hours" value="48 h" note="+4 hours this week" />
            <StatTile label="Completed initiatives" value={6} />
            <StatTile label="Credited skills" value={3} />
          </div>
        </Card>

        <div className="row" style={{ gap: 12 }}>
          <input className="input" placeholder="Search opportunities" value={query}
                 onChange={e => setQuery(e.target.value)} aria-label="Search opportunities" />
          <Button>Filters · 2</Button>
        </div>

        <div className="cluster">
          <span className="chip-filter">Within 10 km <button className="chip-x" aria-label="Remove filter">×</button></span>
          <span className="chip-filter">Physical &amp; virtual <button className="chip-x" aria-label="Remove filter">×</button></span>
          <a href="#clear" onClick={e => e.preventDefault()}>Clear all</a>
        </div>

        <div>
          <Tabs active={tab} onChange={setTab} items={[
            { id: 'for-you', label: 'For you' },
            { id: 'all', label: 'All opportunities' },
            { id: 'saved', label: 'Saved' },
          ]} />

          <div className="row" style={{ marginBottom: 6 }}>
            <h2 style={{ margin: 0 }}>Recommended for you</h2>
            <span className="muted">Best match ↓</span>
          </div>
          <p className="muted" style={{ marginBottom: 18 }}>
            Ranked by shared skills and interests, weighted tag compatibility
          </p>

          <div className="stack">
            {visible.map(o => (
              <Card key={o.id}>
                <div className="row">
                  <StatusBadge tone={o.mode === 'Virtual' ? 'info' : 'neutral'}>{o.mode}</StatusBadge>
                  <StatusBadge tone="match">{o.match}% match</StatusBadge>
                </div>
                <h2 style={{ marginTop: 14, marginBottom: 2, fontSize: 19 }}>{o.title}</h2>
                <p className="muted" style={{ marginBottom: 10 }}>{o.organiser}</p>
                <p className="muted" style={{ marginBottom: 10 }}>{o.date} · {o.time} · {o.place}</p>
                <p>{o.summary}</p>
                <div className="cluster" style={{ marginBottom: 14 }}>
                  {o.tags.slice(0, 2).map(t => <Tag key={t}>{t}</Tag>)}
                </div>
                <hr />
                <div className="row" style={{ marginBottom: 14 }}>
                  <span className="muted">
                    {isOpen(o) ? `${o.capacity - o.filled} places left` : 'Opportunity full'}
                  </span>
                  <span className="muted">Apply by {o.deadline.split(',')[0]}</span>
                </div>
                <Link to={`/opportunities/${o.id}`}><Button block>View opportunity</Button></Link>
              </Card>
            ))}
            {visible.length === 0 && <EmptyState>Nothing saved yet.</EmptyState>}
          </div>
        </div>

        <div className="two-col">
          <Card variant="tint">
            <h2>Up next</h2>
            <StatusBadge tone="ok">Accepted</StatusBadge>
            <h3 style={{ marginTop: 12 }}>Kimironko planting morning</h3>
            <p className="muted">Sat, 10 Oct · 09:00-12:00<br />Kimironko wetland</p>
            <p className="muted">Bring sturdy shoes and a water bottle.</p>
            <Link to="/activity"><Button block>View event</Button></Link>
          </Card>
          <Card>
            <h2>Your updates</h2>
            <h3>Reading guide approved</h3>
            <p className="muted">4 verified hours added to your portfolio · 1h ago</p>
            <hr />
            <h3>You&rsquo;re on the team</h3>
            <p className="muted" style={{ margin: 0 }}>
              Your Kimironko planting application was accepted · yesterday
            </p>
          </Card>
        </div>

        <Card>
          <h2>Your impact, in one place</h2>
          <p className="muted">Only verified contributions appear on your public portfolio.</p>
          <div className="cluster">
            <Link to="/portfolio"><Button>View portfolio</Button></Link>
            <Link to="/initiatives/new"><Button>Propose an initiative</Button></Link>
          </div>
          <p className="muted" style={{ marginTop: 12, marginBottom: 0 }}>
            Your own initiatives appear in Discover after reviewer approval.
          </p>
        </Card>
      </div>
    </>
  )
}
