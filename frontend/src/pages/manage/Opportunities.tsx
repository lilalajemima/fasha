import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/PageHeader'
import { Button, Card, EmptyState, Tabs } from '../../components/ui'
import { useAuth } from '../../auth/AuthContext'
import { getManagedOpportunities, isOpen } from '../../mocks/api'
import type { Opportunity } from '../../mocks/types'
import OpportunityTable from './OpportunityTable'

type Filter = { id: string; label: string; keep: (o: Opportunity) => boolean }

/** A volunteer's initiatives move through review, so they filter by approval state. */
const VOLUNTEER_FILTERS: Filter[] = [
  { id: 'all', label: 'All', keep: () => true },
  { id: 'pending', label: 'Awaiting approval', keep: o => o.status === 'PENDING_APPROVAL' },
  { id: 'published', label: 'Published', keep: o => o.status === 'PUBLISHED' },
  { id: 'rejected', label: 'Not approved', keep: o => o.status === 'REJECTED' },
]

/** An organisation posts straight to the feed, so what matters is capacity. */
const ORG_FILTERS: Filter[] = [
  { id: 'all', label: 'All', keep: () => true },
  { id: 'open', label: 'Open for applications', keep: o => isOpen(o) },
  { id: 'full', label: 'Full', keep: o => o.filled >= o.capacity },
  { id: 'virtual', label: 'Virtual', keep: o => o.mode === 'Virtual' },
]

export default function Opportunities() {
  const { user } = useAuth()
  const isVolunteer = user?.role !== 'organisation'
  const filters = isVolunteer ? VOLUNTEER_FILTERS : ORG_FILTERS
  const [items, setItems] = useState<Opportunity[]>([])
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    setFilter('all')
    getManagedOpportunities(isVolunteer ? 'volunteer' : 'organisation').then(setItems)
  }, [isVolunteer])

  const keep = filters.find(f => f.id === filter)?.keep ?? (() => true)
  const visible = items.filter(keep)

  return (
    <>
      <PageHeader
        eyebrow={isVolunteer ? 'Volunteer organiser' : 'Opportunity management'}
        title={isVolunteer ? 'My proposed initiatives' : 'Opportunities'}
        meta={isVolunteer
          ? 'Everything you have proposed, and where each one sits in review.'
          : 'Everything your organisation has posted, with its capacity and status.'}
        action={
          <Link to={isVolunteer ? '/initiatives/new' : '/manage/opportunities/new'}>
            <Button variant="primary">
              {isVolunteer ? '+ Propose an initiative' : '+ Create opportunity'}
            </Button>
          </Link>
        }
      />

      <Tabs active={filter} onChange={setFilter}
            items={filters.map(f => ({ id: f.id, label: f.label }))} />

      <Card>
        {visible.length > 0
          ? <OpportunityTable items={visible} />
          : <EmptyState>Nothing here yet.</EmptyState>}
      </Card>
    </>
  )
}
