import { Link } from 'react-router-dom'
import { StatusBadge } from '../../components/ui'
import { longDate, sentenceCase } from '../../lib/format'
import type { OpportunityStatus, OpportunityView } from '../../lib/types'

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

export default function OpportunityTable({ items }: { items: OpportunityView[] }) {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Opportunity</th>
          <th>Capacity</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {items.map(item => (
          <tr key={item.id}>
            <td>
              <strong>{item.title}</strong>
              <div className="muted" style={{ marginTop: 2 }}>
                {sentenceCase(item.mode)} · apply by {longDate(item.applicationDeadline)}
              </div>
              <div style={{ marginTop: 4 }}>
                {item.status === 'PUBLISHED' ? (
                  <Link to="/manage/review">Review applicants ↗</Link>
                ) : (
                  <span className="muted">Not public</span>
                )}
              </div>
            </td>
            <td>up to {item.maxCapacity}</td>
            <td>
              <StatusBadge tone={TONE[item.status]}>{LABEL[item.status]}</StatusBadge>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
