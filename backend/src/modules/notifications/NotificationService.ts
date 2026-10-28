import { NotFoundError } from '../../core/errors/HttpErrors'
import type { TokenPayload } from '../../core/security/TokenService'
import type { NotificationStore } from './NotificationStore'
import { toNotificationView, type NotificationFeed } from './NotificationView'

export class NotificationService {
  constructor(private readonly notifications: NotificationStore) {}

  async feedFor(actor: TokenPayload): Promise<NotificationFeed> {
    const [records, unread] = await Promise.all([
      this.notifications.findForUser(actor.userId),
      this.notifications.countUnread(actor.userId),
    ])

    return { unread, items: records.map(toNotificationView) }
  }

  async markRead(actor: TokenPayload, id: string): Promise<NotificationFeed> {
    const updated = await this.notifications.markRead(id, actor.userId)

    if (updated === 0) {
      throw new NotFoundError('That notification does not exist')
    }

    return this.feedFor(actor)
  }

  async markAllRead(actor: TokenPayload): Promise<NotificationFeed> {
    await this.notifications.markAllRead(actor.userId)

    return this.feedFor(actor)
  }
}
