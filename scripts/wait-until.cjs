const { appendFileSync } = require('node:fs')

async function waitUntil(scheduledAt, dependencies = {}) {
  const target = Date.parse(scheduledAt)
  if (!Number.isFinite(target)) {
    throw new Error('发送时间无效')
  }
  const now = dependencies.now || (() => Date.now())
  const sleep =
    dependencies.sleep ||
    ((milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)))
  while (true) {
    const current = now()
    if (current >= target) return true
    await sleep(Math.min(target - current, 30000))
  }
}

if (require.main === module) {
  console.log(
    `已准备，等待北京时间 ${new Date(process.env.NOTIFICATION_SCHEDULED_AT).toLocaleString(
      'sv-SE',
      { timeZone: 'Asia/Shanghai' }
    )}。`
  )
  waitUntil(process.env.NOTIFICATION_SCHEDULED_AT)
    .then((ready) => {
      if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `ready=${ready}\n`)
      console.log('已到发送时间，开始发送或补发。')
    })
    .catch((error) => {
      console.error(error.message)
      process.exitCode = 1
    })
}

module.exports = { waitUntil }
