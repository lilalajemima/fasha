import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, EmptyState, StatusBadge } from '../../components/ui'
import { getMyInitiatives } from '../../mocks/api'
import type { Opportunity } from '../../mocks/types'

export default function MyInitiatives() {
  const [items, setItems] = useState<Opportunity[]>([])
  useEffect(() => { getMyInitiatives().then(setItems) }, [])

  return (
    <>
      <div className="row">
        <div>
          <p className="eyebrow">Volunteer creator workspace</p>
          <h1>My initiatives</h1>
          <p className="lede">Ideas you have proposed and where each one stands.</p>
        </div>
        <Link to="/initiatives/new"><Button variant="primary">Propose an initiative</Button></Link>
      </div>

      <Card>
        {items.map(item => (
          <div key={item.id} className="row" style={{ borderTop: '1px solid var(--border)', padding: '14px 0' }}>
            <div>
              <h3 style={{ marginBottom: 2 }}>{item.title}</h3>
              <p className="muted" style={{ margin: 0 }}>
                Citizen initiative - {item.date} - {item.filled} / {item.capacity} places filled
              </p>
            </div>
            <StatusBadge tone={item.status === 'PUBLISHED' ? 'ok' : item.status === 'REJECTED' ? 'bad' : 'warn'}>
              {item.status === 'PUBLISHED' ? 'Published'
                : item.status === 'REJECTED' ? 'Not approved' : 'Awaiting approval'}
            </StatusBadge>
          </div>
        ))}
        {items.length === 0 && <EmptyState>You have not proposed an initiative yet.</EmptyState>}
      </Card>

      <div style={{ marginTop: 24 }}>
        <Card variant="note">
          <h3>Citizen initiatives are reviewed before publication</h3>
          <p className="muted" style={{ margin: 0 }}>
            Awaiting approval and not approved initiatives stay out of Discover. Only reviewer-approved,
            published opportunities enter the public feed.
          </p>
        </Card>
      </div>
    </>
  )
}
