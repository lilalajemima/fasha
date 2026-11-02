import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from '../auth/AuthContext'
import { api } from '../lib/api'
import type { NotificationFeed } from '../lib/types'

type NotificationsValue = {
  unread: number
  refresh: () => void
}

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

  const value = useMemo(() => ({ unread, refresh }), [unread, refresh])

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}

export function useNotifications() {
  return useContext(NotificationsContext)
}
