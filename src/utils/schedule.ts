import config from '../../config/notifications.json'
import { getNotification } from '../../scripts/check-schedule.cjs'

export const notificationSchedule = config.messages

export type MessageType = keyof typeof notificationSchedule

export const notificationTimeZone = config.timeZone

// 计划阶段和最终发送共用同一套日期、时间计算。
export { getNotification }

export function isMessageType(value: string | undefined): value is MessageType {
  return Object.prototype.hasOwnProperty.call(notificationSchedule, value || '')
}

export function hasReachedSendTime(type: MessageType, now = new Date(), date?: string): boolean {
  return now.getTime() >= Date.parse(getNotification(type, now, date).scheduledAt)
}

export function shouldCheckSendTime(): boolean {
  return (
    process.env.GITHUB_EVENT_NAME === 'schedule' ||
    process.env.ENFORCE_SCHEDULE === 'true' ||
    process.env.ENFORCE_SEND_WINDOW === 'true'
  )
}

export function canSendNow(now = new Date()): boolean {
  if (!shouldCheckSendTime()) return true
  const type = process.env.MESSAGE_TYPE
  if (!isMessageType(type)) return false
  const date = process.env.NOTIFICATION_DATE
  return hasReachedSendTime(type, now, date)
}
