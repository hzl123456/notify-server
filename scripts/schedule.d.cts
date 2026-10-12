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

export interface DeliveryArtifact {
  name: string
  expired: boolean
  created_at?: string
}

export function getDeliveryDate(now?: Date): string
export function getDeliveryId(type: NotificationPlan['type'], now?: Date): string
export function wasDeliveredToday(
  artifacts: DeliveryArtifact[],
  type: NotificationPlan['type'],
  now?: Date
): boolean
