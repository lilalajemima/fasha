import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { blockedStorage, memoryStorage } from '../test/storage'
import { tourFinish, tourSave, tourStart } from './tour'

beforeEach(() => {
  vi.stubGlobal('localStorage', memoryStorage())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('the first-time guide', () => {
  it('starts at the beginning for somebody who has never seen it', () => {
    expect(tourStart('volunteer-1', 5)).toBe(0)
  })

  it('picks up at the step they had reached', () => {
    tourSave('volunteer-1', 3)

    expect(tourStart('volunteer-1', 5)).toBe(3)
  })

  it('stays away once finished or skipped', () => {
    tourSave('volunteer-1', 2)
    tourFinish('volunteer-1')

    expect(tourStart('volunteer-1', 5)).toBeNull()
  })

  it('keeps each account apart on a shared phone', () => {
    tourFinish('volunteer-1')

    expect(tourStart('volunteer-1', 5)).toBeNull()
    expect(tourStart('organisation-1', 5)).toBe(0)
  })

  it('starts again from the top when a saved step no longer exists', () => {
    tourSave('volunteer-1', 7)

    expect(tourStart('volunteer-1', 5)).toBe(0)

    localStorage.setItem('fasha.tour.volunteer-1', 'nonsense')

    expect(tourStart('volunteer-1', 5)).toBe(0)
  })

  it('shows nothing rather than failing where the browser keeps no storage', () => {
    vi.stubGlobal('localStorage', blockedStorage())

    expect(tourStart('volunteer-1', 5)).toBeNull()
    expect(tourSave('volunteer-1', 1)).toBe(false)
    expect(tourFinish('volunteer-1')).toBe(false)
  })
})
