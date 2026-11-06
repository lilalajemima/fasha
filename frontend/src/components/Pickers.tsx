import {
  DAY_LABELS,
  DAY_NAMES,
  PARTS,
  PART_LABELS,
  WEEK,
  availabilityByDay,
  slotOf,
} from '../lib/catalogue'
import './pickers.css'

/**
 * Tags are chosen from a list rather than typed, because matching compares
 * them word for word. Each tag is a toggle button, not a checkbox, so the
 * whole chip is the target on a phone.
 */
export function TagPicker({ legend, hint, options, value, max = 10, onChange }: {
  legend: string
  hint?: string
  options: string[]
  value: string[]
  max?: number
  onChange: (next: string[]) => void
}) {
  const full = value.length >= max

  function toggle(tag: string) {
    onChange(value.includes(tag) ? value.filter(entry => entry !== tag) : [...value, tag])
  }

  return (
    <fieldset className="picker">
      <legend className="picker__legend">{legend}</legend>
      {hint && <p className="picker__hint">{hint}</p>}

      <div className="chipset">
        {options.map(option => {
          const chosen = value.includes(option)

          return (
            <button
              key={option}
              type="button"
              className={chosen ? 'chip chip--on' : 'chip'}
              aria-pressed={chosen}
              disabled={full && !chosen}
              onClick={() => toggle(option)}
            >
              {option}
            </button>
          )
        })}
      </div>

      <p className="picker__count">
        {value.length} of {max} chosen{full ? ' — the most Fasha matches on' : ''}
      </p>
    </fieldset>
  )
}

/** The week as a grid: tap the times you are usually free. */
export function AvailabilityPicker({ value, onChange }: {
  value: string[]
  onChange: (next: string[]) => void
}) {
  function toggle(slot: string) {
    onChange(value.includes(slot) ? value.filter(entry => entry !== slot) : [...value, slot])
  }

  function toggleDay(day: string) {
    const slots = PARTS.map(part => slotOf(day, part))
    const whole = slots.every(slot => value.includes(slot))

    onChange(
      whole
        ? value.filter(slot => !slots.includes(slot))
        : [...new Set([...value, ...slots])],
    )
  }

  return (
    <fieldset className="picker">
      <legend className="picker__legend">When you are usually free</legend>
      <p className="picker__hint">
        Organisers see this on your portfolio. Tap a day to take the whole day.
      </p>

      <div className="slots">
        <div className="slots__grid">
          <span />
          {WEEK.map(day => (
            <button
              key={day}
              type="button"
              className="slots__day"
              onClick={() => toggleDay(day)}
              aria-label={`Every part of ${DAY_NAMES[day]}`}
            >
              {DAY_LABELS[day]}
            </button>
          ))}

          {PARTS.map(part => (
            <Row key={part} part={part} value={value} onToggle={toggle} />
          ))}
        </div>
      </div>

      <p className="picker__count">{summary(value)}</p>
    </fieldset>
  )
}

function Row({ part, value, onToggle }: {
  part: string
  value: string[]
  onToggle: (slot: string) => void
}) {
  return (
    <>
      <span className="slots__part">{PART_LABELS[part]}</span>
      {WEEK.map(day => {
        const slot = slotOf(day, part)
        const on = value.includes(slot)

        return (
          <button
            key={slot}
            type="button"
            className={on ? 'slots__cell slots__cell--on' : 'slots__cell'}
            aria-pressed={on}
            aria-label={`${DAY_NAMES[day]} ${PART_LABELS[part].toLowerCase()}`}
            onClick={() => onToggle(slot)}
          >
            <span aria-hidden="true">{on ? '✓' : ''}</span>
          </button>
        )
      })}
    </>
  )
}

function summary(slots: string[]): string {
  if (slots.length === 0) return 'Nothing chosen yet'
  if (slots.length === 21) return 'Free at any time'

  return `${slots.length} ${slots.length === 1 ? 'time' : 'times'} a week`
}

/** The same week, read-only: what a portfolio or an applicant row shows. */
export function AvailabilityChips({ slots }: { slots: string[] }) {
  const days = availabilityByDay(slots)

  if (days.length === 0) return null

  return (
    <div className="chipset chipset--static">
      {days.map(entry => (
        <span key={entry.day} className="chip chip--static">
          <strong>{DAY_LABELS[entry.day]}</strong>{' '}
          {entry.parts.map(part => PART_LABELS[part].toLowerCase()).join(', ')}
        </span>
      ))}
    </div>
  )
}
