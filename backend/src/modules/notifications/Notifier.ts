import type { NotificationStore } from './NotificationStore'

export const NOTIFICATION_TYPES = {
  applicationReceived: 'APPLICATION_RECEIVED',
  applicationDecided: 'APPLICATION_DECIDED',
  initiativeDecided: 'INITIATIVE_DECIDED',
  hoursDecided: 'HOURS_DECIDED',
}

export interface Notifier {
  send(userId: string, type: string, message: string): Promise<void>
}

export class DatabaseNotifier implements Notifier {
  constructor(private readonly notifications: NotificationStore) {}

  async send(userId: string, type: string, message: string): Promise<void> {
    try {
      await this.notifications.create({ userId, type, message })
    } catch (problem) {
      console.error('Could not write a notification:', problem)
    }
  }
}
