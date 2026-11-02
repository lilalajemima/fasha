import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../../components/Icon'
import { Loaded } from '../../components/Loader'
import PageHeader from '../../components/PageHeader'
import { Button, EmptyState, StatusBadge, Tag } from '../../components/ui'
import { hasPassed, initials, longDate, sentenceCase, shortDate, whenLabel } from '../../lib/format'
import { SECTORS } from '../../lib/sectors'
import type { OpportunityView } from '../../lib/types'
import { useGet } from '../../lib/useGet'
import './Discover.css'

const CLOSING = [
  { id: 'any', label: 'Any deadline', days: 0 },
  { id: 'week', label: 'Closing this week', days: 7 },
  { id: 'month', label: 'Closing this month', days: 30 },
]

function daysLeft(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000)
}

function Listing({ item }: { item: OpportunityView }) {
  const [open, setOpen] = useState(false)
  const closed = hasPassed(item.applicationDeadline)
  const left = daysLeft(item.applicationDeadline)

  return (
    <article className="listing">
      <button
        type="button"
        className="listing__head"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <span className="listing__logo">{initials(item.creator.name)}</span>

        <span>
          <span className="listing__title">{item.title}</span>
          <span className="listing__org">
            {item.creator.name} · {item.sector ?? 'Sector not set'} · {sentenceCase(item.mode)}
          </span>
          <span className="listing__when">{whenLabel(item.startsAt, item.endsAt)}</span>
          <span className="cluster">
            {item.matchScore !== undefined && (
              <StatusBadge tone="match">{item.matchScore}% match</StatusBadge>
            )}
            {[...item.requiredSkills, ...item.categories].slice(0, 3).map(tag => (
              <Tag key={tag}>{tag}</Tag>
            ))}
            {!closed && left <= 7 && <StatusBadge tone="warn">Closing soon</StatusBadge>}
          </span>
        </span>

        <span className="listing__right">
          <span>{closed ? 'Closed' : `Apply by ${shortDate(item.applicationDeadline)}`}</span>
          <span className="listing__chevron"><Icon name="caret" size={16} /></span>
        </span>
      </button>

      {open && (
        <div className="listing__body">
          <div className="listing__facts">
            <div>
              <div className="minilabel">{item.startsAt ? 'When' : 'Due'}</div>
              <strong>{whenLabel(item.startsAt, item.endsAt)}</strong>
            </div>
            <div>
              <div className="minilabel">Apply by</div>
              <strong>{longDate(item.applicationDeadline)}</strong>
            </div>
            <div>
              <div className="minilabel">Places</div>
              <strong>up to {item.maxCapacity}</strong>
            </div>
            <div>
              <div className="minilabel">Where</div>
              <strong>{item.location ?? 'Online'}</strong>
            </div>
          </div>

          <div className="minilabel">Description</div>
          <p style={{ marginTop: 6 }}>{item.description}</p>

          {item.requiredSkills.length > 0 && (
            <>
              <div className="minilabel">Skills the organiser asked for</div>
              <div className="cluster" style={{ marginTop: 6 }}>
                {item.requiredSkills.map(skill => <Tag key={skill}>{skill}</Tag>)}
              </div>
            </>
          )}

          <div className="listing__foot">
            <Link to={`/opportunities/${item.id}`}>
              <Button variant="primary">View opportunity</Button>
            </Link>
          </div>
        </div>
      )}
    </article>
  )
}

export default function Discover() {
  const [format, setFormat] = useState('all')
  const [sector, setSector] = useState('')
  const [skill, setSkill] = useState('')
  const [closing, setClosing] = useState('any')
  const [sort, setSort] = useState('match')
  const [query, setQuery] = useState('')

  const feed = useGet<OpportunityView[]>(
    format === 'all' ? '/opportunities' : `/opportunities?mode=${format}`,
  )

  const words = query.trim().toLowerCase()
  const items = feed.data ?? []
  const skills = [...new Set(items.flatMap(item => item.requiredSkills))].sort()
  const window = CLOSING.find(option => option.id === closing)?.days ?? 0

  const visible = items
    .filter(item => sector === '' || item.sector === sector)
    .filter(item => skill === '' || item.requiredSkills.includes(skill))
    .filter(item => window === 0 || daysLeft(item.applicationDeadline) <= window)
    .filter(item =>
      `${item.title} ${item.creator.name} ${item.requiredSkills.join(' ')} ${item.categories.join(' ')}`
        .toLowerCase()
        .includes(words),
    )

  const ordered = [...visible].sort((a, b) => {
    if (sort === 'soonest') {
      return new Date(a.endsAt ?? a.applicationDeadline).getTime() -
        new Date(b.endsAt ?? b.applicationDeadline).getTime()
    }

    if (sort === 'deadline') {
      return new Date(a.applicationDeadline).getTime() -
        new Date(b.applicationDeadline).getTime()
    }

    if (sort === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }

    return (b.matchScore ?? 0) - (a.matchScore ?? 0)
  })

  return (
    <>
      <PageHeader
        title="Where Can I help Next?"
        meta="Everything open across your district, closest to your skills first."
      />

      <div className="panel">
        <div className="panel__search">
          <input
            className="input"
            placeholder="Search by title, organiser or skill"
            value={query}
            aria-label="Search opportunities"
            onChange={event => setQuery(event.target.value)}
          />
        </div>

        <div className="panel__filters">
          <select className="input" value={format} aria-label="Format"
                  onChange={event => setFormat(event.target.value)}>
            <option value="all">Any format</option>
            <option value="PHYSICAL">In person</option>
            <option value="VIRTUAL">Virtual</option>
          </select>

          <select className="input" value={sector} aria-label="Sector"
                  onChange={event => setSector(event.target.value)}>
            <option value="">Any sector</option>
            {SECTORS.map(option => <option key={option} value={option}>{option}</option>)}
          </select>

          <select className="input" value={skill} aria-label="Skill"
                  onChange={event => setSkill(event.target.value)}>
            <option value="">Any skill</option>
            {skills.map(option => <option key={option} value={option}>{option}</option>)}
          </select>

          <select className="input" value={closing} aria-label="Deadline"
                  onChange={event => setClosing(event.target.value)}>
            {CLOSING.map(option => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </select>
        </div>

        <p className="panel__note">
          Opportunities are posted by local organisations and by neighbours whose initiatives
          have been approved.
        </p>
      </div>

      <Loaded state={feed} what="opportunities">
        {() => (
          <>
            <div className="board__bar">
              <span className="board__count">
                <strong>{ordered.length}</strong>{' '}
                {ordered.length === 1 ? 'opportunity' : 'opportunities'}
              </span>

              <select className="input" style={{ width: 'auto' }} value={sort}
                      aria-label="Sort opportunities"
                      onChange={event => setSort(event.target.value)}>
                <option value="match">Best match</option>
                <option value="soonest">Happening soonest</option>
                <option value="deadline">Closing soonest</option>
                <option value="newest">Newest</option>
              </select>
            </div>

            {ordered.length === 0 ? (
              <EmptyState>
                {items.length === 0
                  ? 'No opportunities are open right now. Check back soon.'
                  : 'Nothing matches those filters.'}
              </EmptyState>
            ) : (
              ordered.map(item => <Listing key={item.id} item={item} />)
            )}
          </>
        )}
      </Loaded>
    </>
  )
}
