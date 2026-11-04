import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../../components/Icon'
import { Loaded } from '../../components/Loader'
import { Button, EmptyState, StatusBadge, Tag } from '../../components/ui'
import { dayBlock, hasPassed, longDate, meta, quantity, sentenceCase, shortDate, whenLabel } from '../../lib/format'
import { SECTORS } from '../../lib/sectors'
import type { OpportunityView } from '../../lib/types'
import { useGet } from '../../lib/useGet'
import '../../styles/workspace.css'
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
  const when = whenLabel(item.startsAt, item.endsAt)
  const on = item.startsAt ?? item.endsAt
  const tile = on ? dayBlock(on) : null

  return (
    <article className="listing">
      <button
        type="button"
        className="listing__head"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {tile ? (
          <span className="listing__date">
            <span className="listing__date-day">{tile.weekday}</span>
            <span className="listing__date-num">{tile.date}</span>
          </span>
        ) : (
          <span />
        )}

        <span>
          <span className="listing__title">{item.title}</span>
          <span className="listing__org">
            {meta(item.creator.name, item.sector, sentenceCase(item.mode))}
          </span>
          {when && <span className="listing__when">{when}</span>}
          <span className="cluster">
            {item.matchScore !== undefined && (
              <StatusBadge tone="match">{item.matchScore}% match</StatusBadge>
            )}
            {[...item.requiredSkills, ...item.categories].slice(0, 3).map(tag => (
              <Tag key={tag}>{tag}</Tag>
            ))}
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
            {when && (
              <div>
                <div className="minilabel">{item.startsAt ? 'When' : 'Due'}</div>
                <strong>{when}</strong>
              </div>
            )}
            <div>
              <div className="minilabel">Apply by</div>
              <strong>{longDate(item.applicationDeadline)}</strong>
            </div>
            <div>
              <div className="minilabel">Places</div>
              <strong>up to {quantity(item.maxCapacity, 'volunteer')}</strong>
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
              <div className="minilabel">Skills</div>
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
      <section className="banner banner--discover">
        <h1 className="banner__title">Where can I help next?</h1>
      </section>

      <input
        className="input searchbar"
        placeholder="Search by title, organiser or skill"
        value={query}
        aria-label="Search opportunities"
        onChange={event => setQuery(event.target.value)}
      />

      <div className="filterbar">
        <select value={format} aria-label="Format" onChange={event => setFormat(event.target.value)}>
          <option value="all">Any format</option>
          <option value="PHYSICAL">In person</option>
          <option value="VIRTUAL">Virtual</option>
        </select>

        <select value={sector} aria-label="Sector" onChange={event => setSector(event.target.value)}>
          <option value="">Any sector</option>
          {SECTORS.map(option => <option key={option} value={option}>{option}</option>)}
        </select>

        <select value={skill} aria-label="Skill" onChange={event => setSkill(event.target.value)}>
          <option value="">Any skill</option>
          {skills.map(option => <option key={option} value={option}>{option}</option>)}
        </select>

        <select value={closing} aria-label="Deadline" onChange={event => setClosing(event.target.value)}>
          {CLOSING.map(option => (
            <option key={option.id} value={option.id}>{option.label}</option>
          ))}
        </select>
      </div>

      <Loaded state={feed} what="opportunities">
        {() => (
          <>
            <div className="board__bar">
              <span className="muted">
                {quantity(ordered.length, 'opportunity', 'opportunities')}
              </span>

              <select className="sortbar" value={sort}
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
