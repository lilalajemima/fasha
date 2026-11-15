const PRESETS = [
  { id: 'month', label: 'This month' },
  { id: '30', label: 'Last 30 days' },
  { id: '90', label: 'Last 3 months' },
  { id: 'all', label: 'All time' },
  { id: 'custom', label: 'Custom' },
]

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
