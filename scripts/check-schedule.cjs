const { appendFileSync } = require('node:fs')
const config = require('../config/notifications.json')

// 任何一次触发都按运行时的北京时间选择消息，而不补发触发时刻的旧消息。
function checkSchedule(now = new Date()) {
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
  const seconds =
    Number(value('hour')) * 3600 + Number(value('minute')) * 60 + Number(value('second'))
  for (const [type, time] of Object.entries(config.messages)) {
    const target = time.hour * 3600 + time.minute * 60
    if (seconds >= target && seconds < target + config.sendWindowMinutes * 60) {
      return { type, date, id: `notification-${date}-${type}` }
    }
  }
  return null
}

if (require.main === module) {
  const notification = checkSchedule()
  if (notification && process.env.GITHUB_OUTPUT) {
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      `message_type=${notification.type}\nnotification_id=${notification.id}\n`
    )
  }
  console.log(notification ? `当前待发送：${notification.id}` : '当前不在发送窗口内。')
}

module.exports = { checkSchedule }
