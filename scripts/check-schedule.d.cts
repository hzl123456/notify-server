import config from '../config/notifications.json'

export interface NotificationPlan {
  type: keyof typeof config.messages
  date: string
  id: string
  scheduledAt: string
}

export function getNotification(
  type: NotificationPlan['type'],
  now?: Date,
  notificationDate?: string
): NotificationPlan
export function getNotifications(now?: Date): NotificationPlan[]
export function checkSchedule(now?: Date): Pick<NotificationPlan, 'type' | 'date' | 'id'> | null
