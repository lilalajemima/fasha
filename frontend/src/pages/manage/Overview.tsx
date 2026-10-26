import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../../components/Icon'
import PageHeader from '../../components/PageHeader'
import { Button, Card, StatTile, StatusBadge, Tabs } from '../../components/ui'
import { useAuth } from '../../auth/AuthContext'
import { getManagedOpportunities } from '../../mocks/api'
import type { Opportunity } from '../../mocks/types'
import OpportunityTable from './OpportunityTable'

export default function Overview() {
  const { user } = useAuth()
  const isVolunteer = user?.role !== 'organisation'
  const [items, setItems] = useState<Opportunity[]>([])
  const [tab, setTab] = useState('opportunities')

  useEffect(() => {
    getManagedOpportunities(isVolunteer ? 'volunteer' : 'organisation').then(setItems)
  }, [isVolunteer])

  const published = items.filter(o => o.status === 'PUBLISHED').length
  const waiting = items.filter(o => o.status === 'PENDING_APPROVAL').length

  return (
    <>
      <PageHeader
        eyebrow={isVolunteer ? 'Volunteer organiser' : undefined}
        title="What to Manage Next?"
        meta={isVolunteer
          ? 'The initiatives you have proposed, and what is happening with them.'
          : 'Manage your opportunities and keep your volunteer teams moving.'}
        action={
          <Link to={isVolunteer ? '/initiatives/new' : '/manage/opportunities/new'}>
            <Button variant="primary">
              {isVolunteer ? '+ Propose an initiative' : '+ Create opportunity'}
            </Button>
          </Link>
        }
      />

      <Card>
        <div className="stat-row">
          {isVolunteer ? (
            <>
              <StatTile label="Initiatives proposed" value={items.length} />
              <StatTile label="Awaiting approval" value={waiting} />
              <StatTile label="Published" value={published} />
              <StatTile label="Volunteers hosted" value={24} />
            </>
          ) : (
            <>
              <StatTile label="Published opportunities" value={published} />
              <StatTile label="Applications to review" value={12} />
              <StatTile label="Deliverables to review" value={3} />
              <StatTile label="Hours verified this month" value="86 h" />
            </>
          )}
        </div>
      </Card>

      <div style={{ marginTop: 26 }}>
        <Tabs active={tab} onChange={setTab} items={[
          { id: 'opportunities', label: `${isVolunteer ? 'Initiatives' : 'Opportunities'} · ${items.length}` },
          { id: 'applications', label: `Applications · ${isVolunteer ? 4 : 12}` },
          { id: 'deliverables', label: `Deliverables · ${isVolunteer ? 0 : 3}` },
        ]} />
      </div>

      <div className="page-grid">
        <div className="stack">
          <Card>
            <h2>{isVolunteer ? 'Your initiatives' : 'Your opportunities'}</h2>
            <OpportunityTable items={items} />
          </Card>

          {isVolunteer ? (
            <Card variant="note">
              <h3>Citizen initiatives need reviewer approval</h3>
              <p className="muted" style={{ margin: 0 }}>
                An initiative you propose stays unpublished until a reviewer approves it. Once
                approved it appears in Discover and volunteers can apply.
              </p>
            </Card>
          ) : (
            <Card variant="note">
              <h3>Your opportunities publish straight away</h3>
              <p className="muted" style={{ margin: 0 }}>
                An organisation account posts directly to Discover with no review step. Only
                initiatives proposed by volunteers are reviewed before publication.
              </p>
            </Card>
          )}
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
        </aside>
      </div>
    </>
  )
}
