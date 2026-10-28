import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Loaded } from '../../components/Loader'
import PageHeader from '../../components/PageHeader'
import { Button, Card, EmptyState, StatTile, StatusBadge, Tabs, Tag } from '../../components/ui'
import { hasPassed, sentenceCase, shortDate } from '../../lib/format'
import type { OpportunityView, PortfolioView } from '../../lib/types'
import { useGet } from '../../lib/useGet'

const TABS = [
  { id: 'all', label: 'For you' },
  { id: 'PHYSICAL', label: 'Physical' },
  { id: 'VIRTUAL', label: 'Virtual' },
]

function Summary() {
  const portfolio = useGet<PortfolioView>('/portfolio/mine')

  if (!portfolio.data) return null

  return (
    <Card>
      <div className="stat-row">
        <StatTile label="Verified hours" value={`${portfolio.data.totals.hours} h`} />
        <StatTile label="Completed initiatives" value={portfolio.data.totals.opportunities} />
        <StatTile label="Credited skills" value={portfolio.data.totals.skills.length} />
      </div>
    </Card>
  )
}

function OpportunityCard({ item }: { item: OpportunityView }) {
  const closed = hasPassed(item.applicationDeadline)

  return (
    <Card>
      <div className="row">
        <StatusBadge tone={item.mode === 'VIRTUAL' ? 'info' : 'neutral'}>
          {sentenceCase(item.mode)}
        </StatusBadge>
        {item.matchScore !== undefined && (
          <StatusBadge tone="match">{item.matchScore}% match</StatusBadge>
        )}
      </div>

      <h2 style={{ marginTop: 14, marginBottom: 2, fontSize: 19 }}>{item.title}</h2>
      <p className="muted" style={{ marginBottom: 10 }}>{item.creator.name}</p>
      <p className="muted" style={{ marginBottom: 10 }}>
        {item.location ?? 'Online'} · up to {item.maxCapacity} volunteers
      </p>
      <p>{item.description}</p>

      <div className="cluster" style={{ marginBottom: 14 }}>
        {[...item.requiredSkills, ...item.categories].slice(0, 3).map(tag => (
          <Tag key={tag}>{tag}</Tag>
        ))}
      </div>

      <hr />
      <div className="row" style={{ marginBottom: 14 }}>
        <span className="muted">{closed ? 'Applications closed' : 'Open for applications'}</span>
        <span className="muted">Apply by {shortDate(item.applicationDeadline)}</span>
      </div>

      <Link to={`/opportunities/${item.id}`}><Button block>View opportunity</Button></Link>
    </Card>
  )
}

export default function Discover() {
  const [tab, setTab] = useState('all')
  const [query, setQuery] = useState('')
  const feed = useGet<OpportunityView[]>(
    tab === 'all' ? '/opportunities' : `/opportunities?mode=${tab}`,
  )

  const words = query.trim().toLowerCase()

  return (
    <>
      <PageHeader title="Where Can I help Next?" />

      <div className="stack">
        <Summary />

        <div className="row" style={{ gap: 12 }}>
          <input
            className="input"
            placeholder="Search opportunities"
            value={query}
            aria-label="Search opportunities"
            onChange={event => setQuery(event.target.value)}
          />
          <Button onClick={feed.reload}>Refresh</Button>
        </div>

        <div>
          <Tabs active={tab} onChange={setTab} items={TABS} />

          <div className="row" style={{ marginBottom: 6 }}>
            <h2 style={{ margin: 0 }}>Recommended for you</h2>
            <span className="muted">Best match ↓</span>
          </div>
          <p className="muted" style={{ marginBottom: 18 }}>
            Ranked by shared skills and interests, weighted tag compatibility
          </p>

          <Loaded state={feed} what="opportunities">
            {items => {
              const visible = items.filter(item =>
                `${item.title} ${item.creator.name} ${item.requiredSkills.join(' ')} ${item.categories.join(' ')}`
                  .toLowerCase()
                  .includes(words),
              )

              if (visible.length === 0) {
                return (
                  <EmptyState>
                    {items.length === 0
                      ? 'No opportunities are open right now. Check back soon.'
                      : 'Nothing matches that search.'}
                  </EmptyState>
                )
              }

              return (
                <div className="stack">
                  {visible.map(item => <OpportunityCard key={item.id} item={item} />)}
                </div>
              )
            }}
          </Loaded>
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
