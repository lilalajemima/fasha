import { Link } from 'react-router-dom'
import { Problem } from '../../components/Loader'
import { Button, Card, EmptyState } from '../../components/ui'
import Calendar from '../manage/Calendar'
import { longDate, meta, quantity } from '../../lib/format'
import type { ActivityRow, OpportunityView, UserView } from '../../lib/types'
import { useGet } from '../../lib/useGet'
import { kindOf } from './filters'
import '../../styles/workspace.css'
import './Admin.css'

const PREVIEW = 5

// Where a calendar entry takes the community admin. The organiser's tools are
// not theirs: what they can do with something waiting is decide it, and with
// anything else, read it.
function linkFor(item: OpportunityView): string {
  return item.status === 'PENDING_APPROVAL'
    ? '/admin/approvals'
    : `/opportunities/${item.id}`
}

function countRole(people: UserView[], role: string): number {
  return people.filter(person => person.role === role && person.status === 'ACTIVE').length
}

export default function Overview() {
  const queue = useGet<OpportunityView[]>('/opportunities/pending')
  const everything = useGet<OpportunityView[]>('/opportunities/all')
  const people = useGet<UserView[]>('/admin/users')
  const activity = useGet<ActivityRow[]>('/admin/activity')

  const waiting = queue.data ?? []
  const accounts = people.data ?? []
  const recorded = activity.data ?? []

  const dash = (state: { loading: boolean; data: unknown }, value: number) =>
    state.loading && !state.data ? '—' : value

  return (
    <>
      <section className="banner banner--oversight">
        <h1 className="banner__title">Your community at a glance</h1>
      </section>

      {queue.error && <Problem message={queue.error} onRetry={queue.reload} />}
      {people.error && <Problem message={people.error} onRetry={people.reload} />}

      <div className="counters counters--four">
        <Link className="counter" to="/admin/approvals">
          <span className="counter__value">{dash(queue, waiting.length)}</span>
          <span className="counter__label">
            {waiting.length === 1 ? 'Opportunity to review' : 'Opportunities to review'}
          </span>
        </Link>
        <Link className="counter" to="/admin/users">
          <span className="counter__value">{dash(people, countRole(accounts, 'VOLUNTEER'))}</span>
          <span className="counter__label">Volunteers</span>
        </Link>
        <Link className="counter" to="/admin/users">
          <span className="counter__value">{dash(people, countRole(accounts, 'ORGANISATION'))}</span>
          <span className="counter__label">Organisations</span>
        </Link>
        <Link className="counter" to="/admin/activity">
          <span className="counter__value">{dash(activity, recorded.length)}</span>
          <span className="counter__label">
            {recorded.length === 1 ? 'Opportunity recorded' : 'Opportunities recorded'}
          </span>
        </Link>
      </div>

      <Card>
        <h2>Waiting for a decision</h2>

        {waiting.length === 0 ? (
          <EmptyState>
            {queue.loading && !queue.data
              ? 'Reading the queue…'
              : 'Nothing is waiting for a decision.'}
          </EmptyState>
        ) : (
          <>
            <div className="stack" style={{ marginBottom: 16 }}>
              {waiting.slice(0, PREVIEW).map(item => (
                <div key={item.id}>
                  <span className="data__title">{item.title}</span>
                  <div className="data__meta">
                    {meta(
                      item.creator.name,
                      kindOf(item.mode),
                      item.sector,
                      `apply by ${longDate(item.applicationDeadline)}`,
                    )}
                  </div>
                </div>
              ))}
            </div>

            <p className="muted">
              {waiting.length > PREVIEW
                ? `And ${waiting.length - PREVIEW} more behind these.`
                : `That is the whole queue: ${quantity(waiting.length, 'opportunity', 'opportunities')}.`}
            </p>

            <Link to="/admin/approvals">
              <Button variant="primary">Review the queue</Button>
            </Link>
          </>
        )}
      </Card>

      <h2 style={{ margin: '28px 0 12px' }}>What is happening</h2>
      {everything.error ? (
        <Problem message={everything.error} onRetry={everything.reload} />
      ) : (
        <Calendar items={everything.data ?? []} linkFor={linkFor} />
      )}
    </>
  )
}
