import { describe, expect, it } from 'vitest'
import { isLocalDatabase } from './localDatabase'

describe('which database the query tests may empty', () => {
  it('allows one on this computer', () => {
    expect(isLocalDatabase('postgresql://fasha:fasha@localhost:5433/fasha_test')).toBe(true)
    expect(isLocalDatabase('postgres://fasha@127.0.0.1:5433/fasha_test')).toBe(true)
  })

  it('refuses Supabase, through the pooler or directly', () => {
    expect(isLocalDatabase('postgresql://postgres.abc:pw@aws-1-eu-central-1.pooler.supabase.com:5432/postgres')).toBe(false)
    expect(isLocalDatabase('postgresql://postgres:pw@db.abcdefgh.supabase.co:5432/postgres')).toBe(false)
  })

  it('is not fooled by "localhost" somewhere other than the host', () => {
    expect(isLocalDatabase('postgresql://localhost:pw@db.abcdefgh.supabase.co:5432/localhost')).toBe(false)
    expect(isLocalDatabase('postgresql://u:p@localhost.example.com:5432/db')).toBe(false)
  })

  it('refuses nothing at all, or something that is not a database address', () => {
    expect(isLocalDatabase(undefined)).toBe(false)
    expect(isLocalDatabase('')).toBe(false)
    expect(isLocalDatabase('http://localhost:5433')).toBe(false)
    expect(isLocalDatabase('not a url')).toBe(false)
  })
})
