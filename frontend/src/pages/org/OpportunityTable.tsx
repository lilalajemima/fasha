import { Link } from 'react-router-dom'
import { StatusBadge } from '../../components/ui'
import type { Opportunity } from '../../mocks/types'

const label = { PUBLISHED: 'Published', PENDING_APPROVAL: 'Awaiting approval', REJECTED: 'Not approved' } as const
const tone = { PUBLISHED: 'ok', PENDING_APPROVAL: 'warn', REJECTED: 'bad' } as const

export default function OpportunityTable({ items }: { items: Opportunity[] }) {
  return (
    <table className="table">
      <thead>
        <tr><th>Opportunity</th><th>Capacity</th><th>Status</th></tr>
      </thead>
      <tbody>
        {items.map(item => (
          <tr key={item.id}>
            <td>
              <strong>{item.title}</strong>
              <div className="muted" style={{ marginTop: 2 }}>
                {item.citizenLed ? 'Citizen initiative' : item.mode} · {item.date.replace('Sat, ', '')}
              </div>
              <div style={{ marginTop: 4 }}>
                {item.status === 'PUBLISHED'
                  ? <Link to="/org/review">{item.mode === 'Virtual' ? '3 deliverables' : '5 applications'}</Link>
                  : <span className="muted">Not public</span>}
              </div>
            </td>
            <td>{item.filled} / {item.capacity}</td>
            <td>
              <StatusBadge tone={tone[item.status]}>{label[item.status]}</StatusBadge>
              <div style={{ marginTop: 6 }}>
                {item.status === 'REJECTED'
                  ? <Link to="/org/review">View feedback ↗</Link>
                  : <Link to="/org/review">Manage ↗</Link>}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
