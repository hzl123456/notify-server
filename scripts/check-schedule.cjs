const { appendFileSync } = require('fs')
const { getNotifications, getNotification } = require('./schedule.cjs')

if (require.main === module) {
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

module.exports = { getNotifications, getNotification }
