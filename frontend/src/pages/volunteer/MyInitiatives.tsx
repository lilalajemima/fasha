import { Link } from 'react-router-dom'
import { Loaded } from '../../components/Loader'
import PageHeader from '../../components/PageHeader'
import { Button, Card, EmptyState, StatusBadge } from '../../components/ui'
import { longDate } from '../../lib/format'
import type { OpportunityStatus, OpportunityView } from '../../lib/types'
import { useGet } from '../../lib/useGet'

const LABEL: Record<OpportunityStatus, string> = {
  PUBLISHED: 'Published',
  PENDING_APPROVAL: 'Awaiting approval',
  REJECTED: 'Not approved',
}

const TONE: Record<OpportunityStatus, 'ok' | 'warn' | 'bad'> = {
  PUBLISHED: 'ok',
  PENDING_APPROVAL: 'warn',
  REJECTED: 'bad',
}

export default function MyInitiatives() {
  const mine = useGet<OpportunityView[]>('/opportunities/mine')

  return (
    <>
      <PageHeader
        eyebrow="Volunteer creator workspace"
        title="My initiatives"
        meta="Ideas you have proposed, and where each one stands."
        action={
          <Link to="/initiatives/new">
            <Button variant="primary">+ Propose an initiative</Button>
          </Link>
        }
      />

      <Loaded state={mine} what="your initiatives">
        {items => (
          <Card>
            <div className="divided">
              {items.map(item => (
                <div key={item.id} className="row" style={{ alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ marginBottom: 2 }}>{item.title}</h3>
                    <p className="muted" style={{ margin: 0 }}>
                      {item.sector ?? 'Sector not set'} · up to {item.maxCapacity} volunteers ·
                      apply by {longDate(item.applicationDeadline)}
                    </p>
                    {item.status === 'REJECTED' && item.reviewNote && (
                      <p style={{ margin: '8px 0 0' }}>
                        <strong>Reviewer:</strong> {item.reviewNote}
                      </p>
                    )}
                  </div>
                  <StatusBadge tone={TONE[item.status]}>{LABEL[item.status]}</StatusBadge>
                </div>
              ))}
              {items.length === 0 && (
                <EmptyState>You have not proposed an initiative yet.</EmptyState>
              )}
            </div>
          </Card>
        )}
      </Loaded>

      <div style={{ marginTop: 22 }}>
        <Card variant="note">
          <h3>Citizen initiatives need reviewer approval</h3>
          <p className="muted" style={{ margin: 0 }}>
            Awaiting approval and not approved initiatives remain unpublished. Published
            opportunities are visible in Discover.
          </p>
        </Card>
      </div>
    </>
  )
}
