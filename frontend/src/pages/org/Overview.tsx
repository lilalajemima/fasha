import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../../components/Icon'
import PageHeader from '../../components/PageHeader'
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
      <PageHeader
        title="What to Manage Next?"
        action={
          <Link to="/org/opportunities/new">
            <Button variant="primary">+ Create opportunity</Button>
          </Link>
        }
      />

      <Card>
        <div className="stat-row">
          <StatTile label="Published opportunities" value={items.filter(o => o.status === 'PUBLISHED').length} />
          <StatTile label="Applications to review" value={12} />
          <StatTile label="Deliverables to review" value={3} />
          <StatTile label="Hours verified this month" value="86 h" />
        </div>
      </Card>

      <div style={{ marginTop: 26 }}>
        <Tabs active={tab} onChange={setTab} items={[
          { id: 'opportunities', label: `Opportunities · ${items.length}` },
          { id: 'applications', label: 'Applications · 12' },
          { id: 'deliverables', label: 'Deliverables · 3' },
        ]} />
      </div>

      <div className="page-grid">
        <div className="stack">
          <Card>
            <h2>Your opportunities</h2>
            <OpportunityTable items={items} />
          </Card>
          <Card variant="note">
            <h3>Citizen initiatives need reviewer approval</h3>
            <p className="muted" style={{ margin: 0 }}>
              Awaiting approval and not approved initiatives remain unpublished. Published
              opportunities are visible in Discover.
            </p>
          </Card>
        </div>

        <aside className="stack">
          <Card>
            <h2>Collaborator updates</h2>
            <h3>Maya accepted your invitation</h3>
            <p className="muted">Restore Kimironko wetland path · 20 min ago</p>
            <hr />
            <h3>Invitation to co-organise</h3>
            <p className="muted">Kimironko seed swap · invited by Leo Gatare</p>
            <div className="cluster">
              <Button variant="primary">Accept</Button>
              <Button>Decline</Button>
            </div>
            <p className="muted" style={{ marginTop: 14, marginBottom: 0 }}>
              Accepted co-organisers can edit details and review submissions.
            </p>
          </Card>
          <Card>
            <h2>Today&rsquo;s focus</h2>
            <StatusBadge tone="neutral">Physical event</StatusBadge>
            <h3 style={{ marginTop: 12 }}>Kimironko planting morning</h3>
            <p className="muted">10 Oct · 09:00-12:00<br />18 accepted volunteers</p>
            <Link to="/org/attendance">
              <Button block><span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Icon name="attendance" /> Open attendance
              </span></Button>
            </Link>
          </Card>
        </aside>
      </div>
    </>
  )
}
