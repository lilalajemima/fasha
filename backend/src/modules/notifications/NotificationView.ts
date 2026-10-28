import type { NotificationRecord } from './NotificationStore'

export type NotificationView = {
  id: string
  type: string
  message: string
  isRead: boolean
  createdAt: string
}

export type NotificationFeed = {
  unread: number
  items: NotificationView[]
}

export function toNotificationView(record: NotificationRecord): NotificationView {
  return {
    id: record.id,
    type: record.type,
    message: record.message,
    isRead: record.isRead,
    createdAt: record.createdAt.toISOString(),
  }
}
