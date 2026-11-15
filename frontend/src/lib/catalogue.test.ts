import { describe, expect, it } from 'vitest'
import { availabilityByDay, availabilityLine, slotOf } from './catalogue'

describe('describing when somebody is free', () => {
  it('names a slot the way the server stores it', () => {
    expect(slotOf('SAT', 'MORNING')).toBe('SAT_MORNING')
  })

  it('groups slots by day, in week order, whatever order they came in', () => {
    expect(availabilityByDay(['SAT_EVENING', 'MON_MORNING', 'SAT_MORNING'])).toEqual([
      { day: 'MON', parts: ['MORNING'] },
      { day: 'SAT', parts: ['MORNING', 'EVENING'] },
    ])
  })

  it('writes them as one short line for a card', () => {
    expect(availabilityLine(['SAT_EVENING', 'MON_MORNING', 'SAT_MORNING'])).toBe('Mon morning · Sat morning, evening')
  })

  it('says so when nothing is set', () => {
    expect(availabilityLine([])).toBe('Availability not set')
  })

  it('ignores a slot it does not recognise', () => {
    expect(availabilityByDay(['SOMEDAY_NOON', 'TUE_AFTERNOON'])).toEqual([{ day: 'TUE', parts: ['AFTERNOON'] }])
  })
})
