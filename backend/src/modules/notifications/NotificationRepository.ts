import type { PrismaClient } from '@prisma/client'
import { BaseRepository } from '../../core/database/BaseRepository'
import { prisma } from '../../core/database/prisma'
import type { NewNotification, NotificationRecord, NotificationStore } from './NotificationStore'

const MOST_RECENT = 50

export class NotificationRepository extends BaseRepository implements NotificationStore {
  constructor(db: PrismaClient = prisma) {
    super(db)
  }

  async create(input: NewNotification): Promise<void> {
    await this.db.notification.create({ data: input })
  }

  findForUser(userId: string): Promise<NotificationRecord[]> {
    return this.db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: MOST_RECENT,
    })
  }

  countUnread(userId: string): Promise<number> {
    return this.db.notification.count({ where: { userId, isRead: false } })
  }

  async markRead(id: string, userId: string): Promise<number> {
    const result = await this.db.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    })

    return result.count
  }

  async markAllRead(userId: string): Promise<void> {
    await this.db.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    })
  }
}
