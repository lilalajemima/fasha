import type { ReactNode } from 'react'
import { timeOfDay } from '../lib/format'
import { Button, Card, EmptyState } from './ui'
import '../styles/offline.css'

export function Loading({ what }: { what: string }) {
  return <p className="empty">Loading {what}…</p>
}

export function Problem({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Card variant="note">
      <h3>That did not load</h3>
      <p className="muted" style={{ marginBottom: onRetry ? 14 : 0 }}>{message}</p>
      {onRetry && <Button onClick={onRetry}>Try again</Button>}
    </Card>
  )
}

export function Saved({ at }: { at: number | null }) {
  const when = at === null ? null : timeOfDay(new Date(at).toISOString())

  return (
    <p className="saved" role="status">
      Fasha could not be reached, so this is the copy saved
      {when ? ` at ${when}` : ' the last time you were connected'}. It may have changed since.
    </p>
  )
}

export function Loaded<T>({ state, what, children }: {
  state: {
    data: T | null
    error: string | null
    loading: boolean
    stale?: boolean
    at?: number | null
    reload: () => void
  }
  what: string
  children: (data: T) => ReactNode
}) {
  if (state.error) return <Problem message={state.error} onRetry={state.reload} />
  if (state.loading && !state.data) return <Loading what={what} />
  if (!state.data) return <EmptyState>Nothing to show.</EmptyState>

  return (
    <>
      {state.stale && <Saved at={state.at ?? null} />}
      {children(state.data)}
    </>
  )
}
