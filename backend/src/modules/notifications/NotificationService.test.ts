import { describe, expect, it } from 'vitest'
import { NotFoundError } from '../../core/errors/HttpErrors'
import { NotificationService } from './NotificationService'
import type { NewNotification, NotificationRecord, NotificationStore } from './NotificationStore'

const volunteer = { userId: 'volunteer-1', role: 'VOLUNTEER' }

function makeNotification(overrides: Partial<NotificationRecord> = {}): NotificationRecord {
  return {
    id: 'notification-1',
    userId: 'volunteer-1',
    type: 'APPLICATION_DECIDED',
    message: 'You have a place on the wetland clean up.',
    isRead: false,
    createdAt: new Date('2026-11-14T09:00:00.000Z'),
    ...overrides,
  }
}

class FakeNotificationStore implements NotificationStore {
  constructor(private readonly records: NotificationRecord[] = []) {}

  async create(input: NewNotification) {
    this.records.push(makeNotification({ ...input, id: `notification-${this.records.length + 1}` }))
  }

  async findForUser(userId: string) {
    return this.records.filter(record => record.userId === userId)
  }

  async countUnread(userId: string) {
    return this.records.filter(record => record.userId === userId && !record.isRead).length
  }

  async markRead(id: string, userId: string) {
    const record = this.records.find(entry => entry.id === id && entry.userId === userId)

    if (!record || record.isRead) return 0

    record.isRead = true

    return 1
  }

  async markAllRead(userId: string) {
    this.records
      .filter(record => record.userId === userId)
      .forEach(record => {
        record.isRead = true
      })
  }
}

describe('the notification feed', () => {
  it('counts what has not been read', async () => {
    const service = new NotificationService(
      new FakeNotificationStore([makeNotification(), makeNotification({ id: 'n2', isRead: true })]),
    )

    const feed = await service.feedFor(volunteer)

    expect(feed.items).toHaveLength(2)
    expect(feed.unread).toBe(1)
  })

  it('shows nothing belonging to someone else', async () => {
    const service = new NotificationService(
      new FakeNotificationStore([makeNotification({ userId: 'volunteer-2' })]),
    )

    const feed = await service.feedFor(volunteer)

    expect(feed.items).toHaveLength(0)
  })

  it('drops the unread count when one is read', async () => {
    const service = new NotificationService(new FakeNotificationStore([makeNotification()]))
    const feed = await service.markRead(volunteer, 'notification-1')

    expect(feed.unread).toBe(0)
  })

  it('clears everything at once', async () => {
    const service = new NotificationService(
      new FakeNotificationStore([makeNotification(), makeNotification({ id: 'n2' })]),
    )

    const feed = await service.markAllRead(volunteer)

    expect(feed.unread).toBe(0)
  })

  it('refuses to read a notification belonging to someone else', async () => {
    const service = new NotificationService(
      new FakeNotificationStore([makeNotification({ userId: 'volunteer-2' })]),
    )

    await expect(service.markRead(volunteer, 'notification-1')).rejects.toThrow(NotFoundError)
  })
})
