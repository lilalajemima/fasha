import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  WEEKDAYS,
  addDays,
  addMonths,
  dayWithName,
  fromInputValue,
  inputValue,
  isSameDay,
  marksFrom,
  marksOn,
  monthGrid,
  monthLabel,
  startOfMonth,
  startOfWeek,
  weekDays,
  weekLabel,
  type CalendarDay,
  type CalendarMark,
} from '../../lib/calendar'
import { isUmuganda } from '../../lib/umuganda'
import type { OpportunityView } from '../../lib/types'
import './Calendar.css'

const MARKS_SHOWN = 3

type View = 'day' | 'week' | 'month'

const VIEWS: { id: View; label: string }[] = [
  { id: 'day', label: 'Today' },
  { id: 'week', label: 'This week' },
  { id: 'month', label: 'Month' },
]

const time = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' })

function describe(mark: CalendarMark): string {
  return [
    mark.kind === 'HAPPENING' ? 'Happening' : 'Applications close',
    mark.mode === 'VIRTUAL' ? 'virtual' : 'in person',
    mark.citizen ? 'citizen initiative' : 'organisation',
  ].join(' · ')
}

function classesFor(mark: CalendarMark): string {
  return [
    'mark',
    mark.kind === 'HAPPENING' ? 'mark--happening' : 'mark--deadline',
    mark.mode === 'VIRTUAL' ? 'mark--virtual' : 'mark--person',
    mark.citizen ? 'mark--citizen' : 'mark--organisation',
  ].join(' ')
}

function Mark({ mark }: { mark: CalendarMark }) {
  return (
    <Link to={mark.to} className={classesFor(mark)} title={describe(mark)}>
      <span className="mark__dot" />
      <span className="mark__text">{mark.title}</span>
    </Link>
  )
}

function Legend({ marks }: { marks: CalendarMark[] }) {
  const has = (test: (mark: CalendarMark) => boolean) => marks.some(test)

  const entries: { className: string; label: string }[] = []

  if (has(mark => mark.kind === 'HAPPENING')) {
    entries.push({ className: 'mark mark--happening mark--person', label: 'Happening' })
  }
  if (has(mark => mark.kind === 'DEADLINE')) {
    entries.push({ className: 'mark mark--deadline mark--person', label: 'Applications close' })
  }
  if (has(mark => mark.mode === 'VIRTUAL') && has(mark => mark.mode !== 'VIRTUAL')) {
    entries.push({ className: 'mark mark--happening mark--virtual', label: 'Virtual' })
  }
  if (has(mark => mark.citizen) && has(mark => !mark.citizen)) {
    entries.push({
      className: 'mark mark--happening mark--person mark--citizen',
      label: 'Citizen initiative',
    })
  }

  return (
    <footer className="calendar__legend">
      {entries.map(entry => (
        <span key={entry.label} className={entry.className}>
          <span className="mark__dot" /> {entry.label}
        </span>
      ))}
    </footer>
  )
}

function Agenda({ marks }: { marks: CalendarMark[] }) {
  return (
    <ul className="agenda">
      {marks.map(mark => (
        <li key={mark.id} className="agenda__row">
          <span className="agenda__time">{time.format(mark.at)}</span>
          <Mark mark={mark} />
          <span className="agenda__kind">
            {mark.kind === 'HAPPENING' ? 'happening' : 'applications close'}
          </span>
        </li>
      ))}
    </ul>
  )
}

function Day({ day }: { day: CalendarDay }) {
  return (
    <div className="daysheet">
      <h3 className="daysheet__title">
        {dayWithName(day.date)}
        {day.isToday && <span className="daysheet__today">Today</span>}
      </h3>

      {isUmuganda(day.date) && <p className="calendar__umuganda">Umuganda morning</p>}

      {day.marks.length === 0 ? (
        <p className="muted">Nothing on this day.</p>
      ) : (
        <Agenda marks={day.marks} />
      )}
    </div>
  )
}

function Week({ days }: { days: CalendarDay[] }) {
  return (
    <div className="week">
      {days.map(day => (
        <div
          key={day.key}
          className={day.isToday ? 'week__row week__row--today' : 'week__row'}
        >
          <div className="week__day">
            <span className="week__name">{WEEKDAYS[(day.date.getDay() + 6) % 7]}</span>
            <span className="week__number">{day.dayOfMonth}</span>
          </div>

          <div className="week__body">
            {isUmuganda(day.date) && <span className="calendar__umuganda">Umuganda morning</span>}
            {day.marks.length === 0 ? (
              <span className="week__quiet">—</span>
            ) : (
              <Agenda marks={day.marks} />
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function Month({ days }: { days: CalendarDay[] }) {
  return (
    <>
      <div className="calendar__weekdays">
        {WEEKDAYS.map(day => (
          <span key={day} className="calendar__weekday">{day}</span>
        ))}
      </div>

      <div className="calendar__grid">
        {days.map(day => (
          <div
            key={day.key}
            className={`calendar__day${day.inMonth ? '' : ' calendar__day--outside'}`}
          >
            <span className={`calendar__number${day.isToday ? ' calendar__number--today' : ''}`}>
              {day.dayOfMonth}
            </span>

            <div className="calendar__marks">
              {isUmuganda(day.date) && day.inMonth && (
                <span className="calendar__umuganda">Umuganda</span>
              )}
              {day.marks.slice(0, MARKS_SHOWN).map(mark => (
                <Mark key={mark.id} mark={mark} />
              ))}
              {day.marks.length > MARKS_SHOWN && (
                <span className="calendar__more">+{day.marks.length - MARKS_SHOWN} more</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

/**
 * What is coming, at whatever range you need. The week opens by default: a
 * month of mostly empty cells took half the page to say what the next seven
 * days say in a few lines. Read only, nothing is created here.
 */
export default function Calendar({ items, linkFor }: {
  items: OpportunityView[]
  linkFor?: (item: OpportunityView, now: Date) => string
}) {
  const [view, setView] = useState<View>('week')
  const [anchor, setAnchor] = useState(() => new Date())

  const marks = marksFrom(items, new Date(), linkFor)
  const today = new Date()

  function step(direction: number) {
    if (view === 'month') setAnchor(addMonths(startOfMonth(anchor), direction))
    else setAnchor(addDays(anchor, direction * (view === 'week' ? 7 : 1)))
  }

  const title =
    view === 'month'
      ? monthLabel(anchor)
      : view === 'week'
        ? weekLabel(startOfWeek(anchor))
        : dayWithName(anchor)

  const onToday =
    view === 'month'
      ? anchor.getMonth() === today.getMonth() && anchor.getFullYear() === today.getFullYear()
      : view === 'week'
        ? isSameDay(startOfWeek(anchor), startOfWeek(today))
        : isSameDay(anchor, today)

  return (
    <section className="calendar">
      <header className="calendar__bar calendar__bar--tools">
        <div className="segmented" role="group" aria-label="Calendar range">
          {VIEWS.map(option => (
            <button
              key={option.id}
              type="button"
              className={view === option.id ? 'segmented__item segmented__item--on' : 'segmented__item'}
              aria-pressed={view === option.id}
              onClick={() => setView(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <span className="calendar__nav">
          <button type="button" className="stepper" aria-label="Back" onClick={() => step(-1)}>‹</button>
          <button
            type="button"
            className="stepper"
            disabled={onToday}
            onClick={() => setAnchor(new Date())}
          >
            Today
          </button>
          <button type="button" className="stepper" aria-label="Forward" onClick={() => step(1)}>›</button>

          <input
            className="input calendar__picker"
            type="date"
            aria-label="Jump to a date"
            value={inputValue(anchor)}
            onChange={event => {
              const picked = fromInputValue(event.target.value)

              if (picked) setAnchor(picked)
            }}
          />
        </span>
      </header>

      <p className="calendar__range">{title}</p>

      {view === 'month' && <Month days={monthGrid(startOfMonth(anchor), marks)} />}
      {view === 'week' && <Week days={weekDays(anchor, marks)} />}
      {view === 'day' && (
        <Day
          day={{
            key: inputValue(anchor),
            date: anchor,
            dayOfMonth: anchor.getDate(),
            inMonth: true,
            isToday: isSameDay(anchor, today),
            marks: marksOn(marks, anchor),
          }}
        />
      )}

      <Legend marks={marks} />
    </section>
  )
}