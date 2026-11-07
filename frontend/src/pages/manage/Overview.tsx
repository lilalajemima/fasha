import { Link } from 'react-router-dom'
import { Problem } from '../../components/Loader'
import { Button } from '../../components/ui'
import { hasPassed } from '../../lib/format'
import type { OpportunityView, WorkloadRow } from '../../lib/types'
import { useGet } from '../../lib/useGet'
import Calendar from './Calendar'
import './Manage.css'

function isActive(item: OpportunityView): boolean {
  return item.status === 'PUBLISHED' && !hasPassed(item.endsAt ?? item.applicationDeadline)
}

export default function Overview() {
  const mine = useGet<OpportunityView[]>('/opportunities/mine')
  const workload = useGet<WorkloadRow[]>('/opportunities/mine/workload')

  const items = mine.data ?? []
  const active = items.filter(isActive).length
  const waiting = (workload.data ?? []).reduce((total, row) => total + row.pendingApplications, 0)
  const counting = mine.loading && !mine.data

  return (
    <>
      <section className="banner banner--overview">
        <div className="banner__bar">
          <h1 className="banner__title">Overview</h1>
          <Link to="/manage/opportunities/new">
            <Button variant="primary">+ Create opportunity</Button>
          </Link>
        </div>
      </section>

      {mine.error && <Problem message={mine.error} onRetry={mine.reload} />}

      <div className="counters">
        <Link className="counter" to="/manage/opportunities">
          <span className="counter__value">{counting ? '—' : active}</span>
          <span className="counter__label">
            Active {active === 1 ? 'opportunity' : 'opportunities'}
          </span>
        </Link>
        <Link className="counter" to="/manage/opportunities">
          <span className="counter__value">{workload.loading && !workload.data ? '—' : waiting}</span>
          <span className="counter__label">
            {waiting === 1 ? 'Application to review' : 'Applications to review'}
          </span>
        </Link>
      </div>

      <Calendar items={items} />
    </>
  )
}
