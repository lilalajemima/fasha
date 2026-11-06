import { useState } from 'react'
import { Loaded } from '../../components/Loader'
import { EmptyState } from '../../components/ui'
import { longDate, quantity, sentenceCase } from '../../lib/format'
import { PER_PAGE, pageCount, pageNumbers, pageSlice } from '../../lib/paging'
import { SECTORS } from '../../lib/sectors'
import type { ActivityRow } from '../../lib/types'
import { useGet } from '../../lib/useGet'
import { Period, kindOf, rangeFor } from './filters'
import '../../styles/workspace.css'
import './Admin.css'

export default function Activity() {
  const activity = useGet<ActivityRow[]>('/admin/activity')
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState('all')
  const [sector, setSector] = useState('')
  const [preset, setPreset] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)

  function change(apply: () => void) {
    apply()
    setPage(1)
  }

  function choosePreset(value: string) {
    const span = rangeFor(value)

    change(() => {
      setPreset(value)

      if (value !== 'custom') {
        setFrom(span.from)
        setTo(span.to)
      }
    })
  }

  const words = query.trim().toLowerCase()

  return (
    <>
      <section className="banner banner--record">
        <h1 className="banner__title">Activity</h1>
      </section>

      <div className="toolbar">
        <input
          className="input toolbar__search"
          placeholder="Search by opportunity, organiser or place"
          aria-label="Search every opportunity"
          value={query}
          onChange={event => change(() => setQuery(event.target.value))}
        />
        <span className="toolbar__field">
          <label className="toolbar__label" htmlFor="activity-kind">Kind</label>
          <select
            id="activity-kind"
            className="input toolbar__select"
            value={mode}
            onChange={event => change(() => setMode(event.target.value))}
          >
            <option value="all">Any kind</option>
            <option value="PHYSICAL">In person</option>
            <option value="VIRTUAL">Virtual</option>
          </select>
        </span>
        <span className="toolbar__field">
          <label className="toolbar__label" htmlFor="activity-sector">Sector</label>
          <select
            id="activity-sector"
            className="input toolbar__select"
            value={sector}
            onChange={event => change(() => setSector(event.target.value))}
          >
            <option value="">Any sector</option>
            {SECTORS.map(option => <option key={option} value={option}>{option}</option>)}
          </select>
        </span>
        <Period
          preset={preset}
          from={from}
          to={to}
          onPreset={choosePreset}
          onFrom={value => change(() => setFrom(value))}
          onTo={value => change(() => setTo(value))}
        />
      </div>

      <Loaded state={activity} what="activity">
        {rows => {
          const visible = rows
            .filter(row => mode === 'all' || row.mode === mode)
            .filter(row => sector === '' || (row.sector ?? '') === sector)
            .filter(row => {
              const day = row.happenedAt.slice(0, 10)

              if (from !== '' && day < from) return false
              if (to !== '' && day > to) return false

              return true
            })
            .filter(
              row =>
                words === '' ||
                `${row.title} ${row.organiser} ${row.sector ?? ''} ${row.location ?? ''}`
                  .toLowerCase()
                  .includes(words),
            )

          const pages = pageCount(visible.length, PER_PAGE)
          const current = Math.min(page, pages)
          const shown = pageSlice(visible, current, PER_PAGE)

          if (visible.length === 0) {
            return <EmptyState>Nothing matches that.</EmptyState>
          }

          return (
            <>
              <p className="toolbar__count" style={{ marginBottom: 10 }}>
                {quantity(visible.length, 'opportunity', 'opportunities')}
              </p>

              <table className="data">
                <thead>
                  <tr>
                    <th>Opportunity</th>
                    <th>Happened</th>
                    <th>Where</th>
                    <th>People</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map(row => (
                    <tr key={row.id} className="data__row--plain">
                      <td>
                        <span className="data__title">{row.title}</span>
                        <div className="data__meta">
                          {row.organiser} ·{' '}
                          {row.organiserRole === 'VOLUNTEER'
                            ? 'Citizen initiative'
                            : 'Organisation'}
                        </div>
                      </td>
                      <td>
                        {longDate(row.happenedAt)}
                        <div className="data__meta">{kindOf(row.mode)}</div>
                      </td>
                      <td>
                        {row.sector ?? '—'}
                        <div className="data__meta">{row.location ?? 'Online'}</div>
                      </td>
                      <td>
                        {row.mode === 'VIRTUAL'
                          ? `${row.delivered} delivered`
                          : `${row.checkedIn} turned up`}
                        <div className="data__meta">
                          {row.applications} applied · {row.accepted} accepted
                        </div>
                      </td>
                      <td>{sentenceCase(row.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {pages > 1 && (
                <div className="pager">
                  <span className="pager__info">
                    {(current - 1) * PER_PAGE + 1}–{(current - 1) * PER_PAGE + shown.length} of{' '}
                    {visible.length}
                  </span>
                  <button
                    type="button"
                    disabled={current === 1}
                    aria-label="Previous page"
                    onClick={() => setPage(current - 1)}
                  >
                    ‹
                  </button>
                  {pageNumbers(current, pages).map((step, index) =>
                    step === 'gap' ? (
                      <span key={`gap-${index}`} className="pager__gap">…</span>
                    ) : (
                      <button
                        key={step}
                        type="button"
                        aria-current={step === current ? 'page' : undefined}
                        onClick={() => setPage(step)}
                      >
                        {step}
                      </button>
                    ),
                  )}
                  <button
                    type="button"
                    disabled={current === pages}
                    aria-label="Next page"
                    onClick={() => setPage(current + 1)}
                  >
                    ›
                  </button>
                </div>
              )}
            </>
          )
        }}
      </Loaded>
    </>
  )
}
