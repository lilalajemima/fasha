import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/PageHeader'
import { Button, Card, EmptyState, StatusBadge } from '../../components/ui'
import { getMyInitiatives } from '../../mocks/api'
import type { Opportunity } from '../../mocks/types'

const label = { PUBLISHED: 'Published', PENDING_APPROVAL: 'Awaiting approval', REJECTED: 'Not approved' } as const
const tone = { PUBLISHED: 'ok', PENDING_APPROVAL: 'warn', REJECTED: 'bad' } as const

export default function MyInitiatives() {
  const [items, setItems] = useState<Opportunity[]>([])
  useEffect(() => { getMyInitiatives().then(setItems) }, [])

  return (
    <>
      <PageHeader
        eyebrow="Volunteer creator workspace"
        title="My initiatives"
        meta="Ideas you have proposed, and where each one stands."
        action={<Link to="/initiatives/new"><Button variant="primary">+ Propose an initiative</Button></Link>}
      />

      <Card>
        <div className="divided">
          {items.map(item => (
            <div key={item.id} className="row" style={{ alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ marginBottom: 2 }}>{item.title}</h3>
                <p className="muted" style={{ margin: 0 }}>
                  Citizen initiative · {item.date} · {item.filled} / {item.capacity} places filled
                </p>
                <p className="muted" style={{ margin: '4px 0 0' }}>Not public</p>
              </div>
              <StatusBadge tone={tone[item.status]}>{label[item.status]}</StatusBadge>
            </div>
          ))}
          {items.length === 0 && <EmptyState>You have not proposed an initiative yet.</EmptyState>}
        </div>
      </Card>
    </>
  )
}
