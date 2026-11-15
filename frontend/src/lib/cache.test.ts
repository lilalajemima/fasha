import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { blockedStorage, fullStorage, memoryStorage } from '../test/storage'
import { clearCache, readCache, writeCache } from './cache'

beforeEach(() => {
  vi.stubGlobal('localStorage', memoryStorage())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('keeping pages for when the connection drops', () => {
  it('gives back what was saved, with when it was saved', () => {
    const before = Date.now()

    writeCache('/opportunities', [{ id: 'one' }])

    const saved = readCache<{ id: string }[]>('/opportunities')

    expect(saved?.data).toEqual([{ id: 'one' }])
    expect(saved!.at).toBeGreaterThanOrEqual(before)
  })

  it('has nothing for a page never saved', () => {
    expect(readCache('/never')).toBeNull()
  })

  it('ignores something saved that it cannot read', () => {
    localStorage.setItem('fasha.cache./broken', '{not json')
    localStorage.setItem('fasha.cache./old', JSON.stringify({ data: [] }))

    expect(readCache('/broken')).toBeNull()
    expect(readCache('/old')).toBeNull()
  })

  it('leaves a page too big to keep uncached', () => {
    expect(writeCache('/huge', 'x'.repeat(300_000))).toBe(false)
    expect(readCache('/huge')).toBeNull()
  })

  it('clears every saved page on sign out, and nothing else', () => {
    localStorage.setItem('fasha.token', 'a-token')
    localStorage.setItem('fasha.tour.volunteer-1', 'done')
    writeCache('/opportunities', [])
    writeCache('/applications/mine', [])

    clearCache()

    expect(readCache('/opportunities')).toBeNull()
    expect(readCache('/applications/mine')).toBeNull()
    expect(localStorage.getItem('fasha.token')).toBe('a-token')
    expect(localStorage.getItem('fasha.tour.volunteer-1')).toBe('done')
  })

  it('makes room by dropping old pages when storage is full', () => {
    const full = fullStorage({ 'fasha.cache./old': '{"at":1,"data":[]}', 'fasha.token': 'a-token' })

    vi.stubGlobal('localStorage', full)
    writeCache('/new', [])

    expect(full.getItem('fasha.cache./old')).toBeNull()
    expect(full.getItem('fasha.token')).toBe('a-token')
  })

  it('carries on without a cache where the browser keeps no storage', () => {
    vi.stubGlobal('localStorage', blockedStorage())

    expect(readCache('/opportunities')).toBeNull()
    expect(writeCache('/opportunities', [])).toBe(false)
    expect(clearCache()).toBe(false)
  })
})
