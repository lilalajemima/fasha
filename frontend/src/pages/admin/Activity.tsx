import { useState } from 'react'
import { Loaded } from '../../components/Loader'
import { Button, EmptyState } from '../../components/ui'
import { longDate, meta, quantity, sentenceCase } from '../../lib/format'
import { PER_PAGE, pageCount, pageNumbers, pageSlice } from '../../lib/paging'
import { SECTORS } from '../../lib/sectors'
import { api } from '../../lib/api'
import type { ActivityRow, OpportunityView } from '../../lib/types'
import { messageFor, useGet } from '../../lib/useGet'
import { recordsOf } from './csv'
import { Period, kindOf, rangeFor } from './filters'
import { PrintReport, ReportRows } from './Report'
import { Summary, type Tile } from './Summary'
import {
  comparePhrase,
  interestPhrase,
  periodPhrase,
  previousSpan,
  spanLabel,
  stamp,
  tallyActivity,
  topInterests,
  within,
  type Span,
} from './stats'
import '../../styles/workspace.css'
import './Admin.css'

type Stamp = { day: string; label: string }
type Attendee = { name: string; date: string; checkedIn: string; checkedOut: string; hours: string; method: string }
type EventReport = { row: ActivityRow; attendees: Attendee[]; stamp: Stamp }

function tookPart(row: ActivityRow) {
  return row.mode === 'VIRTUAL' ? row.delivered : row.checkedIn
}

function turnout(row: { accepted: number }, took: number) {
  return row.accepted === 0 ? '—' : `${Math.round((took / row.accepted) * 100)}%`
}

export default function Activity() {
  const activity = useGet<ActivityRow[]>('/admin/activity')
  // Only for the interests: the activity rows do not carry them, and every
  // opportunity from the last twelve months does.
  const history = useGet<OpportunityView[]>('/opportunities/all')
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState('all')
  const [sector, setSector] = useState('')
  const [preset, setPreset] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const [report, setReport] = useState('events')
  const [downloading, setDownloading] = useState(false)
  const [printing, setPrinting] = useState<Stamp | null>(null)
  const [preparing, setPreparing] = useState('')
  const [single, setSingle] = useState<EventReport | null>(null)
  const [error, setError] = useState('')

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

  async function download() {
    setError('')
    setDownloading(true)

    try {
      const search = new URLSearchParams({ grain: report })

      if (mode !== 'all') search.set('mode', mode)
      if (sector !== '') search.set('sector', sector)
      if (from !== '') search.set('from', from)
      if (to !== '') search.set('to', to)

      const blob = await api.download(`/admin/report.csv?${search.toString()}`)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = url
      link.download = `fasha-${report}-${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } catch (problem) {
      setError(messageFor(problem))
    } finally {
      setDownloading(false)
    }
  }

  // One event's report: its numbers from the row, and who checked in from the
  // attendance file narrowed to this opportunity. The title check is a second
  // lock: a server from before that narrowing existed would send every event.
  async function reportOn(row: ActivityRow) {
    setError('')
    setPreparing(row.id)

    try {
      let attendees: Attendee[] = []

      if (row.mode === 'PHYSICAL') {
        const blob = await api.download(`/admin/report.csv?grain=checkins&opportunity=${encodeURIComponent(row.id)}`)

        attendees = recordsOf(await blob.text())
          .filter(record => record['Opportunity'] === row.title)
          .map(record => ({
            name: record['Volunteer'] ?? '',
            date: record['Date'] ?? '',
            checkedIn: record['Checked in'] ?? '',
            checkedOut: record['Checked out'] ?? '',
            hours: record['Hours'] ?? '',
            method: record['Method'] ?? '',
          }))
      }

      setSingle({ row, attendees, stamp: stamp() })
    } catch (problem) {
      setError(messageFor(problem))
    } finally {
      setPreparing('')
    }
  }

  const words = query.trim().toLowerCase()
  const interestsById = new Map((history.data ?? []).map(item => [item.id, item.categories]))

  // Every filter but the period, so the same rows can be counted for the
  // period before this one and the two set side by side.
  function inScope(row: ActivityRow, span: Span) {
    return (
      (mode === 'all' || row.mode === mode) &&
      (sector === '' || (row.sector ?? '') === sector) &&
      within(row.happenedAt.slice(0, 10), span) &&
      (words === '' ||
        `${row.title} ${row.organiser} ${row.sector ?? ''} ${row.location ?? ''}`
          .toLowerCase()
          .includes(words))
    )
  }

  const rows = activity.data ?? []
  const span = { from, to }
  const visible = rows.filter(row => inScope(row, span))
  const earlierSpan = previousSpan(span, preset)
  const earlier = earlierSpan ? rows.filter(row => inScope(row, earlierSpan)) : null
  const against = earlierSpan ? spanLabel(earlierSpan) : null

  const now = tallyActivity(visible)
  const then = earlier ? tallyActivity(earlier) : null
  const interests = history.data ? topInterests(visible.map(row => interestsById.get(row.id) ?? [])) : null

  const count = (a: number, b: number | undefined, upIsGood: boolean) =>
    b === undefined || against === null ? null : { amount: a - b, against, kind: 'count' as const, upIsGood }

  const tiles: Tile[] = [
    { label: 'Opportunities', value: String(now.opportunities), change: count(now.opportunities, then?.opportunities, true) },
    { label: 'Applied', value: String(now.applied), change: count(now.applied, then?.applied, true) },
    {
      label: 'Took part',
      value: String(now.tookPart),
      note: 'turned up, or had work accepted',
      change: count(now.tookPart, then?.tookPart, true),
    },
    {
      label: 'Turnout',
      value: now.turnout === null ? '—' : `${now.turnout}%`,
      note: 'of the people accepted',
      change:
        now.turnout !== null && then !== null && then.turnout !== null && against !== null
          ? { amount: now.turnout - then.turnout, against, kind: 'points', upIsGood: true }
          : null,
    },
  ]

  const lede =
    now.opportunities === 0
      ? `${periodPhrase(span)}, nothing happened that matches these filters.`
      : `${periodPhrase(span)}, ${quantity(now.tookPart, 'person', 'people')} took part in ` +
        `${quantity(now.opportunities, 'opportunity', 'opportunities')}` +
        `${comparePhrase(now.tookPart, then?.tookPart ?? null, against)}.` +
        interestPhrase(interests?.top ?? [])

  const summary = (
    <Summary
      heading="What happened in this period"
      lede={lede}
      tiles={tiles}
      interests={interests}
      interestNote={`Out of ${quantity(visible.length, 'opportunity', 'opportunities')}. One opportunity can have several.`}
    />
  )

  const periodLine = from === '' || to === '' ? 'All time' : `${spanLabel(span)} ${to.slice(0, 4)}`
  const filterLine =
    meta(mode === 'all' ? null : kindOf(mode), sector || null, words === '' ? null : `matching “${query.trim()}”`) ||
    'No other filters'

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

      {/* The same filters, as files: a report to read, or the rows to work
          with in a spreadsheet. The table is one row per opportunity; one row
          per person only makes sense as a download. */}
      <div className="toolbar" data-tour="activity-downloads">
        <Button
          variant="primary"
          className="btn--small"
          disabled={!activity.data || printing !== null}
          onClick={() => setPrinting(stamp())}
        >
          Download report (PDF)
        </Button>
        <span className="toolbar__field" style={{ marginLeft: 'auto' }}>
          <label className="toolbar__label" htmlFor="report">Spreadsheet</label>
          <select
            id="report"
            className="input toolbar__select"
            value={report}
            onChange={event => setReport(event.target.value)}
          >
            <option value="events">Opportunities</option>
            <option value="checkins">Attendance</option>
          </select>
        </span>
        <Button className="btn--small" disabled={downloading} onClick={download}>
          {downloading ? 'Preparing…' : 'Download CSV'}
        </Button>
      </div>

      {error && <p className="error" role="alert">{error}</p>}

      <Loaded state={activity} what="activity">
        {() => {
          const pages = pageCount(visible.length, PER_PAGE)
          const current = Math.min(page, pages)
          const shown = pageSlice(visible, current, PER_PAGE)

          return (
            <>
              {summary}

              <p className="muted" style={{ marginBottom: 14 }}>
                {report === 'events'
                  ? 'The spreadsheet has one row per opportunity: its dates, sector, and how many applied, were accepted and turned up.'
                  : 'The spreadsheet has one row per person per event: who, which event, when they checked in and out, and the hours credited.'}
              </p>

              {visible.length === 0 ? (
                <EmptyState>Nothing matches that.</EmptyState>
              ) : (
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
                        <th aria-hidden="true" />
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
                          <td data-label="Happened">
                            {longDate(row.happenedAt)}
                            <div className="data__meta">{kindOf(row.mode)}</div>
                          </td>
                          <td data-label="Where">
                            {row.sector ?? '—'}
                            <div className="data__meta">{row.location ?? 'Online'}</div>
                          </td>
                          <td data-label="People">
                            {row.mode === 'VIRTUAL'
                              ? `${row.delivered} delivered`
                              : `${row.checkedIn} turned up`}
                            <div className="data__meta">
                              {row.applications} applied · {row.accepted} accepted
                            </div>
                          </td>
                          <td data-label="Status">{sentenceCase(row.status)}</td>
                          <td className="data__actions" data-tour="event-report">
                            <button
                              type="button"
                              className="data__view"
                              disabled={preparing !== ''}
                              onClick={() => reportOn(row)}
                            >
                              {preparing === row.id ? 'Preparing…' : 'Report'}
                            </button>
                          </td>
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
              )}
            </>
          )
        }}
      </Loaded>

      {printing && (
        <PrintReport
          title="Activity report"
          file={`fasha-activity-${printing.day}`}
          lines={[periodLine, filterLine, `Prepared on ${printing.label}`]}
          onDone={() => setPrinting(null)}
        >
          {summary}

          <ReportRows heading={quantity(visible.length, 'opportunity', 'opportunities')}>
            {visible.length === 0 ? (
              <p className="report__empty">Nothing matches these filters.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Opportunity</th>
                    <th>Organiser</th>
                    <th>Happened</th>
                    <th>Kind</th>
                    <th>Sector</th>
                    <th>Applied</th>
                    <th>Accepted</th>
                    <th>Took part</th>
                    <th>Turnout</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map(row => (
                    <tr key={row.id}>
                      <td>{row.title}</td>
                      <td>{row.organiser}</td>
                      <td>{longDate(row.happenedAt)}</td>
                      <td>{kindOf(row.mode)}</td>
                      <td>{row.sector ?? ''}</td>
                      <td>{row.applications}</td>
                      <td>{row.accepted}</td>
                      <td>{tookPart(row)}</td>
                      <td>{turnout(row, tookPart(row))}</td>
                      <td>{sentenceCase(row.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </ReportRows>
        </PrintReport>
      )}

      {single && (
        <PrintReport
          title={single.row.title}
          file={`fasha-${single.row.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${single.stamp.day}`}
          lines={[
            meta(single.row.organiser, kindOf(single.row.mode), longDate(single.row.happenedAt)),
            meta(single.row.sector, single.row.location ?? 'Online', sentenceCase(single.row.status)),
            ...((interestsById.get(single.row.id) ?? []).length > 0
              ? [`Interests: ${(interestsById.get(single.row.id) ?? []).join(', ')}`]
              : []),
            `Prepared on ${single.stamp.label}`,
          ]}
          onDone={() => setSingle(null)}
        >
          <Summary
            heading="What happened"
            lede={
              `${quantity(single.row.applications, 'person', 'people')} applied and ${single.row.accepted} ` +
              `${single.row.accepted === 1 ? 'was' : 'were'} accepted. ` +
              (single.row.mode === 'VIRTUAL'
                ? `${quantity(single.row.delivered, 'piece of work was', 'pieces of work were')} accepted as delivered.`
                : `${quantity(single.row.checkedIn, 'person', 'people')} checked in on the day.`)
            }
            tiles={[
              { label: 'Applied', value: String(single.row.applications) },
              { label: 'Accepted', value: String(single.row.accepted) },
              {
                label: single.row.mode === 'VIRTUAL' ? 'Delivered' : 'Turned up',
                value: String(tookPart(single.row)),
              },
              {
                label: 'Turnout',
                value: turnout(single.row, tookPart(single.row)),
                note: 'of the people accepted',
              },
            ]}
          />

          <ReportRows
            heading={single.row.mode === 'VIRTUAL' ? 'Attendance' : `Who checked in (${single.attendees.length})`}
          >
            {single.row.mode === 'VIRTUAL' ? (
              <p className="report__empty">
                Virtual work is not checked in. The organiser reviews each piece of work that is sent in,
                and the {quantity(single.row.delivered, 'one', 'ones')} accepted are counted above.
              </p>
            ) : single.attendees.length === 0 ? (
              <p className="report__empty">Nobody checked in to this event.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Volunteer</th>
                    <th>Date</th>
                    <th>Checked in</th>
                    <th>Checked out</th>
                    <th>Hours</th>
                    <th>How</th>
                  </tr>
                </thead>
                <tbody>
                  {single.attendees.map(person => (
                    <tr key={`${person.name}-${person.date}-${person.checkedIn}`}>
                      <td>{person.name}</td>
                      <td>{person.date}</td>
                      <td>{person.checkedIn}</td>
                      <td>{person.checkedOut || 'Not yet'}</td>
                      <td>{person.hours}</td>
                      <td>{person.method}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </ReportRows>
        </PrintReport>
      )}
    </>
  )
}
