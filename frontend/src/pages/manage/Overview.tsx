import { Link } from 'react-router-dom'
import Icon from '../../components/Icon'
import { Loaded } from '../../components/Loader'
import PageHeader from '../../components/PageHeader'
import { Button, Card, EmptyState, StatTile } from '../../components/ui'
import { useAuth } from '../../auth/AuthContext'
import type { OpportunityView } from '../../lib/types'
import { useGet } from '../../lib/useGet'
import OpportunityTable from './OpportunityTable'

export default function Overview() {
  const { user } = useAuth()
  const isVolunteer = user?.role !== 'organisation'
  const mine = useGet<OpportunityView[]>('/opportunities/mine')

  const items = mine.data ?? []
  const published = items.filter(item => item.status === 'PUBLISHED').length
  const waiting = items.filter(item => item.status === 'PENDING_APPROVAL').length

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
            </>
          ) : (
            <>
              <StatTile label="Opportunities posted" value={items.length} />
              <StatTile label="Published" value={published} />
            </>
          )}
        </div>
      </Card>

      <div className="page-grid" style={{ marginTop: 26 }}>
        <div className="stack">
          <Card>
            <h2>{isVolunteer ? 'Your initiatives' : 'Your opportunities'}</h2>
            <Loaded state={mine} what="your opportunities">
              {list =>
                list.length === 0 ? (
                  <EmptyState>Nothing here yet. Create one to get started.</EmptyState>
                ) : (
                  <OpportunityTable items={list} />
                )
              }
            </Loaded>
          </Card>

          <Card variant="note">
            <h3>
              {isVolunteer
                ? 'Citizen initiatives need reviewer approval'
                : 'Your opportunities publish straight away'}
            </h3>
            <p className="muted" style={{ margin: 0 }}>
              {isVolunteer
                ? 'An initiative you propose stays unpublished until a reviewer approves it. Once approved it appears in Discover and volunteers can apply.'
                : 'An organisation account posts directly to Discover with no review step. Only initiatives proposed by volunteers are reviewed before publication.'}
            </p>
          </Card>
        </div>

        <aside className="stack">
          <Card>
            <h2>Attendance</h2>
            <p className="muted">
              Show the rotating code at your event so volunteers can check themselves in.
            </p>
            <Link to="/manage/attendance">
              <Button block>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="attendance" /> Open attendance
                </span>
              </Button>
            </Link>
          </Card>
        </aside>
      </div>
    </>
  )
}
