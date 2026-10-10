import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, StatTile, StatusBadge, Tabs } from '../../components/ui'
import { getOrgOpportunities } from '../../mocks/api'
import type { Opportunity } from '../../mocks/types'
import OpportunityTable from './OpportunityTable'

export default function Overview() {
  const [items, setItems] = useState<Opportunity[]>([])
  const [tab, setTab] = useState('opportunities')
  useEffect(() => { getOrgOpportunities().then(setItems) }, [])

  return (
    <>
      <div className="row">
        <div>
          <p className="eyebrow">Green Neighbourhood</p>
          <h1>Good things are taking shape.</h1>
          <p className="lede">Manage your initiatives and keep your volunteer teams moving.</p>
        </div>
        <Link to="/org/opportunities/new"><Button variant="primary">+ Create opportunity</Button></Link>
      </div>

      <Card>
        <div className="stat-row">
          <StatTile label="Published opportunities" value={items.filter(o => o.status === 'PUBLISHED').length} />
          <StatTile label="Applications to review" value={12} />
          <StatTile label="Deliverables to review" value={3} />
          <StatTile label="Hours verified this month" value="86 h" />
        </div>
      </Card>

      <div style={{ marginTop: 24 }}>
        <Tabs active={tab} onChange={setTab} items={[
          { id: 'opportunities', label: `Opportunities - ${items.length}` },
          { id: 'applications', label: 'Applications - 12' },
          { id: 'deliverables', label: 'Deliverables - 3' },
        ]} />
      </div>

      <div className="page-grid">
        <div className="stack">
          <Card>
            <h2>Your opportunities</h2>
            <OpportunityTable items={items} />
          </Card>
          <Card variant="note">
            <h3>Citizen initiatives are reviewed before publication</h3>
            <p className="muted" style={{ margin: 0 }}>
              Awaiting approval and not approved initiatives stay out of Discover.
              Only reviewer-approved, published opportunities enter the public feed.
            </p>
          </Card>
        </div>

        <aside className="stack">
          <Card>
            <h2>Collaborator updates</h2>
            <h3>Maya accepted your invitation</h3>
            <p className="muted">Restore Kimironko wetland path - 20 min ago</p>
            <hr />
            <h3>Invitation to co-organise</h3>
            <p className="muted">Kimironko seed swap - invited by Leo Gatare</p>
            <div className="cluster">
              <Button variant="primary">Accept</Button>
              <Button>Decline</Button>
            </div>
            <p className="muted" style={{ marginTop: 12 }}>
              Accepted co-organisers can edit details and review submissions.
            </p>
          </Card>
          <Card>
            <h2>Today&rsquo;s focus</h2>
            <StatusBadge tone="neutral">Physical event</StatusBadge>
            <h3 style={{ marginTop: 10 }}>Kimironko planting morning</h3>
            <p className="muted">10 Oct - 09:00-12:00<br />18 accepted volunteers</p>
            <Link to="/org/attendance"><Button block>Open attendance</Button></Link>
          </Card>
        </aside>
      </div>
    </>
  )
}
