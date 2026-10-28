import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Loaded } from '../../components/Loader'
import PageHeader from '../../components/PageHeader'
import { Button, Card, EmptyState, Tabs } from '../../components/ui'
import { useAuth } from '../../auth/AuthContext'
import { hasPassed } from '../../lib/format'
import type { OpportunityView } from '../../lib/types'
import { useGet } from '../../lib/useGet'
import OpportunityTable from './OpportunityTable'

type Filter = { id: string; label: string; keep: (item: OpportunityView) => boolean }

const VOLUNTEER_FILTERS: Filter[] = [
  { id: 'all', label: 'All', keep: () => true },
  { id: 'pending', label: 'Awaiting approval', keep: item => item.status === 'PENDING_APPROVAL' },
  { id: 'published', label: 'Published', keep: item => item.status === 'PUBLISHED' },
  { id: 'rejected', label: 'Not approved', keep: item => item.status === 'REJECTED' },
]

const ORGANISATION_FILTERS: Filter[] = [
  { id: 'all', label: 'All', keep: () => true },
  {
    id: 'open',
    label: 'Open for applications',
    keep: item => item.status === 'PUBLISHED' && !hasPassed(item.applicationDeadline),
  },
  { id: 'closed', label: 'Closed', keep: item => hasPassed(item.applicationDeadline) },
  { id: 'virtual', label: 'Virtual', keep: item => item.mode === 'VIRTUAL' },
]

export default function Opportunities() {
  const { user } = useAuth()
  const isVolunteer = user?.role !== 'organisation'
  const filters = isVolunteer ? VOLUNTEER_FILTERS : ORGANISATION_FILTERS
  const mine = useGet<OpportunityView[]>('/opportunities/mine')
  const [filter, setFilter] = useState('all')

  const keep = filters.find(entry => entry.id === filter)?.keep ?? (() => true)

  return (
    <>
      <PageHeader
        eyebrow={isVolunteer ? 'Volunteer organiser' : 'Opportunity management'}
        title={isVolunteer ? 'My proposed initiatives' : 'Opportunities'}
        meta={isVolunteer
          ? 'Everything you have proposed, and where each one sits in review.'
          : 'Everything your organisation has posted.'}
        action={
          <Link to={isVolunteer ? '/initiatives/new' : '/manage/opportunities/new'}>
            <Button variant="primary">
              {isVolunteer ? '+ Propose an initiative' : '+ Create opportunity'}
            </Button>
          </Link>
        }
      />

      <Tabs active={filter} onChange={setFilter} items={filters} />

      <Card>
        <Loaded state={mine} what="your opportunities">
          {items => {
            const visible = items.filter(keep)

            return visible.length === 0 ? (
              <EmptyState>Nothing in this view.</EmptyState>
            ) : (
              <OpportunityTable items={visible} />
            )
          }}
        </Loaded>
      </Card>
    </>
  )
}
