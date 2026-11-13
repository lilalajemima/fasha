import { quantity } from '../../lib/format'
import type { InterestCount } from './stats'

export type Change = {
  amount: number
  against: string
  kind: 'count' | 'points'
  // Whether a rise is good news. Null when it is neither, such as rejections.
  upIsGood: boolean | null
}

export type Tile = {
  label: string
  value: string
  note?: string
  change?: Change | null
}

function ChangeLine({ change }: { change: Change }) {
  const { amount, against, kind, upIsGood } = change

  if (amount === 0) return <span className="tile__change">Same as {against}</span>

  const up = amount > 0
  const size = Math.abs(amount)
  const tone = upIsGood === null ? '' : up === upIsGood ? ' tile__change--good' : ' tile__change--bad'
  const words = kind === 'points'
    ? `${size} ${size === 1 ? 'point' : 'points'} ${up ? 'higher' : 'lower'}`
    : `${size} ${up ? 'more' : 'fewer'}`

  // The arrow and the words carry the direction; the colour only agrees with
  // them, so this still reads in greyscale and without full colour vision.
  return (
    <span className={`tile__change${tone}`}>
      <span aria-hidden="true">{up ? '▲' : '▼'} </span>
      {words} than {against}
    </span>
  )
}

/**
 * The first thing on the page after the filters, and the first page of the
 * report: a sentence that says what happened, the handful of numbers behind
 * it, and which interests came up most. Everything here is counted from the
 * same filtered rows that are listed underneath it.
 */
export function Summary({ heading, lede, tiles, interests, interestNote }: {
  heading: string
  lede: string
  tiles: Tile[]
  // Left out entirely for a single event, where every tag is 100% of it.
  interests?: { top: InterestCount[]; others: number } | null
  interestNote?: string
}) {
  return (
    <section className="summary" aria-label={heading} data-tour="summary">
      <h2 className="summary__heading">{heading}</h2>
      <p className="summary__lede">{lede}</p>

      <div className="summary__tiles">
        {tiles.map(tile => (
          <div key={tile.label} className="tile">
            <span className="tile__label">{tile.label}</span>
            <span className="tile__value">{tile.value}</span>
            {tile.note && <span className="tile__note">{tile.note}</span>}
            {tile.change && <ChangeLine change={tile.change} />}
          </div>
        ))}
      </div>

      {interests !== undefined && (
        <div className="summary__interests">
          <h3 className="summary__subheading">Most common interests</h3>
          <p className="summary__hint">{interestNote}</p>

          {interests === null ? (
            <p className="summary__hint">Counting interests…</p>
          ) : interests.top.length === 0 ? (
            <p className="summary__hint">Nothing in this period was tagged with an interest.</p>
          ) : (
            <ol className="meters">
              {interests.top.map(entry => {
                const percent = Math.round(entry.share * 100)

                return (
                  <li key={entry.name} className="meter">
                    <span className="meter__name">{entry.name}</span>
                    <span className="meter__track" aria-hidden="true">
                      <span className="meter__fill" style={{ width: `${Math.max(percent, 2)}%` }} />
                    </span>
                    <span className="meter__figure">
                      {entry.count} · {percent}%
                    </span>
                  </li>
                )
              })}
            </ol>
          )}

          {interests !== null && interests.others > 0 && (
            <p className="summary__hint">and {quantity(interests.others, 'other interest')}</p>
          )}
        </div>
      )}
    </section>
  )
}
