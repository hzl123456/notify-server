import config from '../../config/notifications.json'

export const notificationSchedule = config.messages

export type MessageType = keyof typeof notificationSchedule

export const notificationTimeZone = config.timeZone
export const sendWindowMinutes = config.sendWindowMinutes

export function isMessageType(value: string | undefined): value is MessageType {
  return Object.prototype.hasOwnProperty.call(notificationSchedule, value || '')
}

// 使用北京时间判断窗口，不依赖 GitHub runner 或服务器自身的时区。
export function isWithinSendWindow(type: MessageType, now = new Date()): boolean {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: notificationTimeZone,
    hourCycle: 'h23',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(now)
  const value = (name: string) => Number(parts.find((part) => part.type === name)?.value)
  const seconds = value('hour') * 3600 + value('minute') * 60 + value('second')
  const schedule = notificationSchedule[type]
  const scheduledSeconds = schedule.hour * 3600 + schedule.minute * 60
  return seconds >= scheduledSeconds && seconds < scheduledSeconds + sendWindowMinutes * 60
}

export function shouldEnforceSendWindow(): boolean {
  return process.env.GITHUB_EVENT_NAME === 'schedule' || process.env.ENFORCE_SEND_WINDOW === 'true'
}

export function canSendNow(now = new Date()): boolean {
  if (!shouldEnforceSendWindow()) return true
  const type = process.env.MESSAGE_TYPE
  return isMessageType(type) && isWithinSendWindow(type, now)
}
