import { useState } from 'react'
import { Loaded } from '../components/Loader'
import PageHeader from '../components/PageHeader'
import { Button, Card, EmptyState, StatusBadge, type Tone } from '../components/ui'
import { api } from '../lib/api'
import { longDate } from '../lib/format'
import type { NotificationFeed, NotificationView } from '../lib/types'
import { messageFor, useGet } from '../lib/useGet'
import { useNotifications } from '../notifications/NotificationsContext'

/** The server sends a type; the page decides what to call it and how loud it is. */
const KINDS: Record<string, { label: string; tone: Tone }> = {
  APPLICATION_RECEIVED: { label: 'Application', tone: 'info' },
  APPLICATION_DECIDED: { label: 'Application', tone: 'ok' },
  INITIATIVE_DECIDED: { label: 'Initiative', tone: 'ok' },
  HOURS_DECIDED: { label: 'Hours', tone: 'ok' },
}

function kindOf(type: string): { label: string; tone: Tone } {
  return KINDS[type] ?? { label: 'Update', tone: 'neutral' }
}

export default function Notifications() {
  const feed = useGet<NotificationFeed>('/notifications')
  // The bell in the top bar counts the same unread items, so it reloads too.
  const { refresh } = useNotifications()
  const [problem, setProblem] = useState('')
  const [busy, setBusy] = useState('')

  async function run(id: string, work: () => Promise<unknown>) {
    setProblem('')
    setBusy(id)

    try {
      await work()
      feed.reload()
      refresh()
    } catch (failure) {
      setProblem(messageFor(failure))
    } finally {
      setBusy('')
    }
  }

  function markOne(item: NotificationView) {
    run(item.id, () => api.patch(`/notifications/${item.id}/read`))
  }

  function markAll() {
    run('all', () => api.patch('/notifications/read-all'))
  }

  const unread = feed.data?.unread ?? 0

  return (
    <>
      <PageHeader
        title="Notifications"
        action={
          <Button disabled={unread === 0 || busy === 'all'} onClick={markAll}>
            {busy === 'all' ? 'Marking…' : 'Mark all as read'}
          </Button>
        }
      />

      {problem && <p className="error" role="alert">{problem}</p>}

      <Loaded state={feed} what="your notifications">
        {data => (
          <Card>
            <div className="divided">
              {data.items.map(item => {
                const kind = kindOf(item.type)

                return (
                  <div key={item.id} className="row" style={{ alignItems: 'flex-start' }}>
                    <div style={{ minWidth: 0 }}>
                      <div className="cluster" style={{ marginBottom: 6 }}>
                        <StatusBadge tone={kind.tone}>{kind.label}</StatusBadge>
                        {!item.isRead && <span className="dot" aria-label="Unread" />}
                        <span className="muted">{longDate(item.createdAt)}</span>
                      </div>
                      <p style={{ margin: 0 }}>{item.message}</p>
                    </div>
                    {!item.isRead && (
                      <button
                        className="linkbtn"
                        disabled={busy === item.id}
                        onClick={() => markOne(item)}
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                )
              })}
              {data.items.length === 0 && <EmptyState>Nothing yet.</EmptyState>}
            </div>
          </Card>
        )}
      </Loaded>

      <p className="muted" style={{ marginTop: 20 }}>
        Fasha sends notifications inside the app only. There is no email or SMS, which keeps the
        platform usable without extra cost to volunteers.
      </p>
    </>
  )
}
