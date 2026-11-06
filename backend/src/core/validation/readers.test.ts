import { describe, expect, it } from 'vitest'
import { SKILLS } from '../domain/catalogue'
import { BadRequestError } from '../errors/HttpErrors'
import { readAvailability, readTagList } from './readers'

describe('readTagList against the catalogue', () => {
  it('keeps tags that are on the list', () => {
    const tags = readTagList({ skills: ['First aid', 'Graphic design'] }, 'skills', SKILLS)

    expect(tags).toEqual(['First aid', 'Graphic design'])
  })

  it('refuses a tag that is not on it', () => {
    expect(() => readTagList({ skills: ['Juggling'] }, 'skills', SKILLS)).toThrow(BadRequestError)
  })

  /** Matching is exact, so a near miss has to be caught at the door. */
  it('refuses a near miss rather than storing it', () => {
    expect(() => readTagList({ skills: ['graphic designs'] }, 'skills', SKILLS)).toThrow(
      'is not on the list Fasha matches on',
    )
  })

  it('still drops duplicates and blanks', () => {
    const tags = readTagList({ skills: ['First aid', ' First aid ', ''] }, 'skills', SKILLS)

    expect(tags).toEqual(['First aid'])
  })
})

describe('readAvailability', () => {
  it('accepts times of the week and returns them in week order', () => {
    const slots = readAvailability({ availabilitySlots: ['SUN_MORNING', 'MON_EVENING'] }, 'availabilitySlots')

    expect(slots).toEqual(['MON_EVENING', 'SUN_MORNING'])
  })

  it('treats a missing field as nothing chosen', () => {
    expect(readAvailability({}, 'availabilitySlots')).toEqual([])
  })

  it('refuses a slot that is not a real time', () => {
    expect(() =>
      readAvailability({ availabilitySlots: ['SOMEDAY_LATER'] }, 'availabilitySlots'),
    ).toThrow(BadRequestError)
  })
})
