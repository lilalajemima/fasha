import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from '../auth/AuthContext'
import { api } from '../lib/api'
import type { NotificationFeed } from '../lib/types'

type NotificationsValue = {
  unread: number
  refresh: () => void
}

const EVERY = 60_000

const NotificationsContext = createContext<NotificationsValue>({
  unread: 0,
  refresh: () => undefined,
})

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [unread, setUnread] = useState(0)

  const refresh = useCallback(() => {
    if (!user) return

    api
      .get<NotificationFeed>('/notifications')
      .then(feed => setUnread(feed.unread))
      .catch(() => undefined)
  }, [user])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Polling only while the tab is in front. A hidden tab cannot show a badge
  // to anybody, and browsers throttle its timers anyway.
  useEffect(() => {
    if (!user) return

    const tick = () => {
      if (document.visibilityState === 'visible') refresh()
    }

    const timer = window.setInterval(tick, EVERY)

    window.addEventListener('focus', tick)
    window.addEventListener('online', tick)
    document.addEventListener('visibilitychange', tick)

    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', tick)
      window.removeEventListener('online', tick)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [user, refresh])

  const value = useMemo(() => ({ unread, refresh }), [unread, refresh])

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}

export function useNotifications() {
  return useContext(NotificationsContext)
}