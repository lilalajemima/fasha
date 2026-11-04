import { useState } from 'react'
import {
  WEEKDAYS,
  addMonths,
  marksFrom,
  monthGrid,
  monthLabel,
  startOfMonth,
} from '../../lib/calendar'
import { longDate } from '../../lib/format'
import { isUmuganda } from '../../lib/umuganda'
import type { OpportunityView } from '../../lib/types'

const MARKS_SHOWN = 3

/** Read only. Nothing is created here, the month simply shows what exists. */
export default function CalendarMonth({ items }: { items: OpportunityView[] }) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const days = monthGrid(month, marksFrom(items))

  return (
    <section className="calendar">
      <header className="calendar__bar">
        <h2 className="calendar__title">{monthLabel(month)}</h2>
        <span className="calendar__nav">
          <button
            type="button"
            className="stepper"
            aria-label="Previous month"
            onClick={() => setMonth(addMonths(month, -1))}
          >
            ‹
          </button>
          <button
            type="button"
            className="stepper"
            onClick={() => setMonth(startOfMonth(new Date()))}
          >
            Today
          </button>
          <button
            type="button"
            className="stepper"
            aria-label="Next month"
            onClick={() => setMonth(addMonths(month, 1))}
          >
            ›
          </button>
        </span>
      </header>

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
            <span
              className={`calendar__number${day.isToday ? ' calendar__number--today' : ''}`}
            >
              {day.dayOfMonth}
            </span>

            <div className="calendar__marks">
              {isUmuganda(day.date) && day.inMonth && (
                <span className="calendar__umuganda">Umuganda</span>
              )}
              {day.marks.slice(0, MARKS_SHOWN).map(mark => (
                <span
                  key={mark.id}
                  className={`mark mark--${mark.kind === 'HAPPENING' ? 'happening' : 'deadline'}`}
                  title={`${mark.title} — ${
                    mark.kind === 'HAPPENING' ? 'happening' : 'applications close'
                  } on ${longDate(mark.at.toISOString())}`}
                >
                  <span className="mark__dot" />
                  <span className="mark__text">{mark.title}</span>
                </span>
              ))}

              {day.marks.length > MARKS_SHOWN && (
                <span className="calendar__more">+{day.marks.length - MARKS_SHOWN} more</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <footer className="calendar__legend">
        <span className="mark mark--happening"><span className="mark__dot" /> Happening</span>
        <span className="mark mark--deadline"><span className="mark__dot" /> Applications close</span>
      </footer>
    </section>
  )
}
