import type { Notification } from '@prisma/client'

export type NotificationRecord = Notification

export type NewNotification = {
  userId: string
  type: string
  message: string
}

export interface NotificationStore {
  create(input: NewNotification): Promise<void>
  findForUser(userId: string): Promise<NotificationRecord[]>
  countUnread(userId: string): Promise<number>
  markRead(id: string, userId: string): Promise<number>
  markAllRead(userId: string): Promise<void>
}
