const { appendFileSync } = require('fs')
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
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(`${date}T00:00:00Z`)) || new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date) {
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

// 一次触发可准备多种消息；提前接到的任务由 runner 等待到发送时间。
function getNotifications(now = new Date()) {
  const timestamp = now.getTime()
  const notifications = []
  for (const type of Object.keys(config.messages)) {
    const today = getNotification(type, now)
    const target = Date.parse(today.scheduledAt)
    if (target <= timestamp) {
      notifications.push(today)
    } else {
      // 跨过午夜也保留最近一次到期的消息，由发送记录判断是否需要补发。
      notifications.push(getNotification(type, new Date(timestamp - 86400000)))
      if (target - timestamp <= config.prepareAheadMinutes * 60000) notifications.push(today)
    }
  }
  return notifications.sort((a, b) => Date.parse(a.scheduledAt) - Date.parse(b.scheduledAt))
}

// 保留仅检查当前可发送消息的接口，发送端也使用同一份窗口计算。
function checkSchedule(now = new Date()) {
  const current = getNotifications(now).find(
    (item) => Date.parse(item.scheduledAt) <= now.getTime()
  )
  return current ? { type: current.type, date: current.date, id: current.id } : null
}

if (typeof require !== 'undefined' && require.main === module) {
  const notifications = getNotifications()
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      `notifications=${JSON.stringify(notifications)}\nhas_notifications=${
        notifications.length > 0
      }\n`
    )
  }
  console.log(
    notifications.length ? JSON.stringify(notifications, null, 2) : '当前没有待准备或待补发的消息。'
  )
}

module.exports = { checkSchedule, getNotifications, getNotification }
