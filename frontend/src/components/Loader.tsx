import type { ReactNode } from 'react'
import { Button, Card, EmptyState } from './ui'

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

export function Loaded<T>({ state, what, children }: {
  state: { data: T | null; error: string | null; loading: boolean; reload: () => void }
  what: string
  children: (data: T) => ReactNode
}) {
  if (state.error) return <Problem message={state.error} onRetry={state.reload} />
  if (state.loading && !state.data) return <Loading what={what} />
  if (!state.data) return <EmptyState>Nothing to show.</EmptyState>

  return <>{children(state.data)}</>
}
