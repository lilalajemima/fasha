import { useEffect, useRef, useState } from 'react'
import { ApiError } from './ApiClient'
import { api } from './api'
import { readCache, writeCache } from './cache'

export type Loaded<T> = {
  data: T | null
  error: string | null
  loading: boolean
  stale: boolean
  at: number | null
  reload: () => void
}

const FRESH_FOR = 10_000
const PRESENT_FOR = 60_000
const PRESENCE_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart', 'mousemove'] as const

export function messageFor(problem: unknown): string {
  if (problem instanceof ApiError) return problem.message
  if (problem instanceof Error) return problem.message

  return 'Something went wrong'
}

export function useGet<T>(path: string | null, poll = 0): Loaded<T> {
  // The saved copy is read while rendering, not in an effect. From an effect
  // it would arrive one paint late, after the empty page had already shown,
  // which is the cascading render the compiler lint warns about.
  const [first] = useState(() => (path === null ? null : readCache<T>(path)))
  const [seededFor, setSeededFor] = useState(path)
  const [copyFor, setCopyFor] = useState(first ? path : null)
  const [data, setData] = useState<T | null>(first?.data ?? null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(path !== null && first === null)
  const [stale, setStale] = useState(false)
  const [at, setAt] = useState<number | null>(first?.at ?? null)
  const [attempt, setAttempt] = useState(0)
  const fetchedAt = useRef(0)
  const lastSeen = useRef(0)
  const fetched = useRef(false)

  // When the path changes, the saved copy for the new one is picked up in the
  // same render, using React's pattern for state that follows a prop: compare,
  // set, and React renders again before anything reaches the screen.
  if (path !== seededFor) {
    setSeededFor(path)
    setStale(false)
    setError(null)

    const saved = path === null ? null : readCache<T>(path)

    setCopyFor(saved ? path : null)

    if (saved) {
      setData(saved.data)
      setAt(saved.at)
      setLoading(false)
    }
  }

  const hasCopy = path !== null && copyFor === path

  useEffect(() => {
    fetched.current = false
  }, [path])

  useEffect(() => {
    if (path === null) return

    let live = true

    api
      .get<T>(path)
      .then(result => {
        if (!live) return

        fetchedAt.current = Date.now()
        fetched.current = true
        writeCache(path, result)
        setData(result)
        setAt(Date.now())
        setStale(false)
        setError(null)
        setLoading(false)
      })
      .catch(problem => {
        if (!live) return

        fetchedAt.current = Date.now()

        // A saved copy is worth more than an error page, so the failure is
        // reported as staleness and only becomes an error with nothing to show.
        if (fetched.current || hasCopy) setStale(true)
        else setError(messageFor(problem))

        setLoading(false)
      })

    return () => {
      live = false
    }
  }, [path, attempt, hasCopy])

  useEffect(() => {
    if (path === null) return

    lastSeen.current = Date.now()

    const revalidate = (force = false) => {
      if (document.visibilityState === 'hidden') return
      if (!force && Date.now() - fetchedAt.current < FRESH_FOR) return

      setAttempt(count => count + 1)
    }

    const onReturn = () => {
      lastSeen.current = Date.now()
      revalidate()
    }

    const onPresence = () => {
      const now = Date.now()

      if (now - lastSeen.current > PRESENT_FOR) revalidate(true)

      lastSeen.current = now
    }

    window.addEventListener('focus', onReturn)
    window.addEventListener('online', onReturn)
    document.addEventListener('visibilitychange', onReturn)

    if (poll > 0) {
      for (const event of PRESENCE_EVENTS) {
        window.addEventListener(event, onPresence, { passive: true })
      }

      window.addEventListener('scroll', onPresence, { passive: true })
    }

    const timer =
      poll > 0
        ? window.setInterval(() => {
            if (document.visibilityState !== 'visible') return
            if (Date.now() - lastSeen.current > PRESENT_FOR) return

            revalidate(true)
          }, poll)
        : undefined

    return () => {
      window.removeEventListener('focus', onReturn)
      window.removeEventListener('online', onReturn)
      document.removeEventListener('visibilitychange', onReturn)

      if (poll > 0) {
        for (const event of PRESENCE_EVENTS) {
          window.removeEventListener(event, onPresence)
        }

        window.removeEventListener('scroll', onPresence)
      }

      if (timer !== undefined) window.clearInterval(timer)
    }
  }, [path, poll])

  return { data, error, loading, stale, at, reload: () => setAttempt(count => count + 1) }
}