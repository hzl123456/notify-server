const config = require('../config/notifications.json')

function getLocalTime(now) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: config.timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(now)
  const value = (name) => parts.find((part) => part.type === name).value
  const date = `${value('year')}-${value('month')}-${value('day')}`
  const localTimestamp = Date.UTC(
    Number(value('year')),
    Number(value('month')) - 1,
    Number(value('day')),
    Number(value('hour')),
    Number(value('minute')),
    Number(value('second'))
  )
  return { date, offset: localTimestamp - Math.floor(now.getTime() / 1000) * 1000 }
}

function getNotification(type, now = new Date(), notificationDate) {
  const time = config.messages[type]
  if (!time) throw new Error(`未知消息类型：${type}`)
  const local = getLocalTime(now)
  const date = notificationDate || local.date
  const offset = local.offset
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isFinite(Date.parse(`${date}T00:00:00Z`)) ||
    new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date
  ) {
    throw new Error('计划日期无效')
  }
  const scheduledAt =
    Date.parse(`${date}T00:00:00Z`) + (time.hour * 60 + time.minute) * 60000 - offset
  return {
    type,
    date,
    id: `notification-${date}-${type}`,
    scheduledAt: new Date(scheduledAt).toISOString(),
  }
}

// 只安排今天的计划；提前启动的 runner 等待到时，不自动重建历史积压。
function getNotifications(now = new Date()) {
  const timestamp = now.getTime()
  const notifications = []
  for (const type of Object.keys(config.messages)) {
    const today = getNotification(type, now)
    const target = Date.parse(today.scheduledAt)
    if (target - timestamp <= config.prepareAheadMinutes * 60000) notifications.push(today)
  }
  return notifications.sort((a, b) => Date.parse(a.scheduledAt) - Date.parse(b.scheduledAt))
}

function getDeliveryDate(now = new Date()) {
  return getLocalTime(now).date
}

function getDeliveryId(type, now = new Date()) {
  if (!config.messages[type]) throw new Error(`未知消息类型：${type}`)
  return `delivery-${getDeliveryDate(now)}-${type}`
}

function wasDeliveredToday(artifacts, type, now = new Date()) {
  const date = getDeliveryDate(now)
  const id = getDeliveryId(type, now)
  return artifacts.some((artifact) => {
    if (artifact.expired) return false
    // 新记录以实际发送日期命名，上传跨午夜也不改变归属。
    if (artifact.name === id) return true
    // 兼容旧记录：历史计划可能在今天补发，以记录创建时间识别。
    if (!new RegExp(`^notification-\\d{4}-\\d{2}-\\d{2}-${type}$`).test(artifact.name)) return false
    const createdAt = new Date(artifact.created_at)
    return Number.isFinite(createdAt.getTime()) && getDeliveryDate(createdAt) === date
  })
}

module.exports = {
  getNotifications,
  getNotification,
  getDeliveryDate,
  getDeliveryId,
  wasDeliveredToday,
}
