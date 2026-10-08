import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, Tabs } from '../../components/ui'
import { getOrgOpportunities } from '../../mocks/api'
import type { Opportunity, OpportunityStatus } from '../../mocks/types'
import OpportunityTable from './OpportunityTable'

const FILTERS: { id: string; label: string; match?: OpportunityStatus }[] = [
  { id: 'all', label: 'All' },
  { id: 'published', label: 'Published', match: 'PUBLISHED' },
  { id: 'pending', label: 'Awaiting approval', match: 'PENDING_APPROVAL' },
  { id: 'rejected', label: 'Not approved', match: 'REJECTED' },
]

export default function Opportunities() {
  const [items, setItems] = useState<Opportunity[]>([])
  const [filter, setFilter] = useState('all')
  useEffect(() => { getOrgOpportunities().then(setItems) }, [])

  const match = FILTERS.find(f => f.id === filter)?.match
  const visible = match ? items.filter(item => item.status === match) : items

  return (
    <>
      <div className="row">
        <div>
          <p className="eyebrow">Organisation workspace</p>
          <h1>Opportunities</h1>
          <p className="lede">Everything your team has created, with its capacity and status.</p>
        </div>
        <Link to="/org/opportunities/new"><Button variant="primary">+ Create opportunity</Button></Link>
      </div>

      <Tabs active={filter} onChange={setFilter} items={FILTERS.map(f => ({ id: f.id, label: f.label }))} />
      <Card><OpportunityTable items={visible} /></Card>
    </>
  )
}
