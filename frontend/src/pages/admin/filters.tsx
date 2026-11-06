/**
 * The controls the oversight pages share. Activity and Export both offer the
 * same period, so it lives here rather than being written twice and drifting.
 */

const PRESETS = [
  { id: 'month', label: 'This month' },
  { id: '30', label: 'Last 30 days' },
  { id: '90', label: 'Last 3 months' },
  { id: 'all', label: 'All time' },
  { id: 'custom', label: 'Custom' },
]

/** Local date, not UTC: in Kigali an ISO conversion lands on the day before. */
function isoDay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${date.getFullYear()}-${month}-${day}`
}

export function rangeFor(preset: string): { from: string; to: string } {
  const today = new Date()

  if (preset === 'month') {
    return { from: isoDay(new Date(today.getFullYear(), today.getMonth(), 1)), to: isoDay(today) }
  }

  if (preset === '30' || preset === '90') {
    const back = new Date(today)

    back.setDate(back.getDate() - Number(preset))

    return { from: isoDay(back), to: isoDay(today) }
  }

  return { from: '', to: '' }
}

export function kindOf(mode: string): string {
  return mode === 'VIRTUAL' ? 'Virtual' : 'In person'
}

/** One control for the period, with the two date fields only when they are needed. */
export function Period({ preset, from, to, onPreset, onFrom, onTo }: {
  preset: string
  from: string
  to: string
  onPreset: (value: string) => void
  onFrom: (value: string) => void
  onTo: (value: string) => void
}) {
  return (
    <>
      <span className="toolbar__field">
        <label className="toolbar__label" htmlFor="period">Period</label>
        <select
          id="period"
          className="input toolbar__select"
          value={preset}
          onChange={event => onPreset(event.target.value)}
        >
          {PRESETS.map(option => (
            <option key={option.id} value={option.id}>{option.label}</option>
          ))}
        </select>
      </span>

      {preset === 'custom' && (
        <>
          <span className="toolbar__field">
            <label className="toolbar__label" htmlFor="from">From</label>
            <input
              id="from"
              className="input toolbar__select"
              type="date"
              value={from}
              onChange={event => onFrom(event.target.value)}
            />
          </span>
          <span className="toolbar__field">
            <label className="toolbar__label" htmlFor="to">To</label>
            <input
              id="to"
              className="input toolbar__select"
              type="date"
              value={to}
              onChange={event => onTo(event.target.value)}
            />
          </span>
        </>
      )}
    </>
  )
}
