import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { Button, Card, EmptyState, StatusBadge } from '../components/ui'
import { getNotifications } from '../mocks/api'
import type { AppNotification, NotificationKind } from '../mocks/types'

const LABEL: Record<NotificationKind, string> = {
  application: 'Application',
  approval: 'Verified',
  invite: 'Invitation',
  reminder: 'Reminder',
  review: 'Under review',
}
const TONE: Record<NotificationKind, 'ok' | 'warn' | 'info' | 'neutral'> = {
  application: 'info',
  approval: 'ok',
  invite: 'info',
  reminder: 'neutral',
  review: 'warn',
}

export default function Notifications() {
  const [items, setItems] = useState<AppNotification[]>([])
  useEffect(() => { getNotifications().then(list => setItems(list.map(n => ({ ...n })))) }, [])

  const unread = items.filter(n => !n.read).length
  const markAll = () => setItems(items.map(n => ({ ...n, read: true })))
  const markOne = (id: string) =>
    setItems(items.map(n => (n.id === id ? { ...n, read: true } : n)))

  return (
    <>
      <PageHeader
        title="Notifications"
        meta={unread === 0 ? 'You are up to date.' : `${unread} unread`}
        action={<Button onClick={markAll} disabled={unread === 0}>Mark all as read</Button>}
      />

      <Card>
        <div className="divided">
          {items.map(n => (
            <div key={n.id} className="row" style={{ alignItems: 'flex-start' }}>
              <div style={{ minWidth: 0 }}>
                <div className="cluster" style={{ marginBottom: 6 }}>
                  <StatusBadge tone={TONE[n.kind]}>{LABEL[n.kind]}</StatusBadge>
                  {!n.read && <span className="dot" aria-label="Unread" />}
                  <span className="muted">{n.when}</span>
                </div>
                <h3 style={{ marginBottom: 2 }}>{n.title}</h3>
                <p className="muted" style={{ margin: 0 }}>{n.body}</p>
              </div>
              <div className="cluster">
                {n.link && <Link to={n.link} onClick={() => markOne(n.id)}>Open ↗</Link>}
                {!n.read && (
                  <button className="linkbtn" onClick={() => markOne(n.id)}>Mark as read</button>
                )}
              </div>
            </div>
          ))}
          {items.length === 0 && <EmptyState>Nothing yet.</EmptyState>}
        </div>
      </Card>

      <p className="muted" style={{ marginTop: 20 }}>
        Fasha sends notifications inside the app only. There is no email or SMS, which keeps the
        platform usable without extra cost to volunteers.
      </p>
    </>
  )
}
