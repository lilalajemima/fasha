import { useEffect, useState } from 'react'
import { ApiError } from './ApiClient'
import { api } from './api'

export type Loaded<T> = {
  data: T | null
  error: string | null
  loading: boolean
  reload: () => void
}

export function messageFor(problem: unknown): string {
  if (problem instanceof ApiError) return problem.message
  if (problem instanceof Error) return problem.message

  return 'Something went wrong'
}

export function useGet<T>(path: string | null): Loaded<T> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(path !== null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (path === null) return

    let live = true

    api
      .get<T>(path)
      .then(result => {
        if (!live) return
        setData(result)
        setError(null)
        setLoading(false)
      })
      .catch(problem => {
        if (!live) return
        setError(messageFor(problem))
        setLoading(false)
      })

    return () => {
      live = false
    }
  }, [path, attempt])

  return { data, error, loading, reload: () => setAttempt(count => count + 1) }
}
