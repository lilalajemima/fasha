import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, EmptyState, StatTile, StatusBadge, Tabs, Tag } from '../../components/ui'
import { getFeed, isOpen } from '../../mocks/api'
import type { Opportunity } from '../../mocks/types'

type Ranked = Opportunity & { match: number }

export default function Discover() {
  const [items, setItems] = useState<Ranked[]>([])
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState('for-you')

  useEffect(() => { getFeed().then(setItems) }, [])

  const visible = items.filter(o =>
    (tab !== 'saved') &&
    (o.title + o.organiser + o.tags.join(' ')).toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <>
      <p className="lede">Good morning, Amara. Here is where your skills can help next.</p>

      <div className="page-grid">
        <div className="stack">
          <Card>
            <div className="stat-row">
              <StatTile label="Verified hours" value="48 h" note="+4 hours this week" />
              <StatTile label="Completed initiatives" value={6} />
              <StatTile label="Credited skills" value={3} />
            </div>
          </Card>

          <div className="row">
            <input className="input" placeholder="Search opportunities" value={query}
                   onChange={e => setQuery(e.target.value)} aria-label="Search opportunities" />
            <Button>Filters</Button>
          </div>
          <div className="cluster">
            <Tag>Within 10 km</Tag><Tag>Physical &amp; virtual</Tag>
          </div>

          <div>
            <Tabs active={tab} onChange={setTab} items={[
              { id: 'for-you', label: 'For you' },
              { id: 'all', label: 'All opportunities' },
              { id: 'saved', label: 'Saved' },
            ]} />
            <h2>Recommended for you</h2>
            <p className="muted" style={{ marginBottom: 16 }}>
              Ranked by shared skills and interests - weighted tag compatibility
            </p>

            <div className="stack">
              {visible.map(o => (
                <Card key={o.id}>
                  <div className="row">
                    <Tag>{o.mode}</Tag>
                    <StatusBadge tone="ok">{o.match}% match</StatusBadge>
                  </div>
                  <h2 style={{ marginTop: 12, marginBottom: 2 }}>{o.title}</h2>
                  <p className="muted">{o.organiser}</p>
                  <p className="muted">{o.date} - {o.time} - {o.place}</p>
                  <p>{o.summary}</p>
                  <div className="cluster">{o.tags.map(t => <Tag key={t}>{t}</Tag>)}</div>
                  <hr />
                  <div className="row" style={{ marginBottom: 12 }}>
                    <span className="muted">
                      {isOpen(o) ? `${o.capacity - o.filled} places left` : 'Opportunity full'}
                    </span>
                    <span className="muted">Apply by {o.deadline}</span>
                  </div>
                  <Link to={`/opportunities/${o.id}`}>
                    <Button block>View opportunity</Button>
                  </Link>
                </Card>
              ))}
              {visible.length === 0 && <EmptyState>No opportunities match that search yet.</EmptyState>}
            </div>
          </div>
        </div>

        <aside className="stack">
          <Card variant="tint">
            <h2>Your impact, in one place</h2>
            <p className="muted">Only verified contributions appear on your public portfolio.</p>
            <Link to="/portfolio"><Button block>View portfolio</Button></Link>
          </Card>
          <Card variant="tint">
            <h2>Up next</h2>
            <StatusBadge tone="ok">Accepted</StatusBadge>
            <h3 style={{ marginTop: 10 }}>Kimironko planting morning</h3>
            <p className="muted">Sat, 10 Oct - 09:00-12:00<br />Kimironko wetland</p>
            <p className="muted">Bring sturdy shoes and a water bottle.</p>
            <Link to="/activity"><Button block>View event</Button></Link>
          </Card>
          <Card>
            <h2>Start something local</h2>
            <p className="muted">
              Have a community idea? Propose an initiative. It will appear here after reviewer approval.
            </p>
            <Link to="/initiatives/new"><Button block>Propose an initiative</Button></Link>
          </Card>
        </aside>
      </div>
    </>
  )
}
