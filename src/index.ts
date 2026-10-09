import dotenv from 'dotenv'
import { appendFileSync, writeFileSync } from 'fs'
import LoveMsg from './libs/LoveMsg'
import { getDeliveredMessageCount } from './libs/WxNotify'
import { canSendNow, notificationTimeZone } from './utils/schedule'
dotenv.config()
process.env.TZ = notificationTimeZone

// 早安、午安、晚安、生日助手 => 由环境变量控制
if (canSendNow()) {
  const run = async () => {
    try {
      await LoveMsg()
      if (getDeliveredMessageCount() === 0 && canSendNow()) {
        throw new Error('没有消息发送成功')
      }
    } finally {
      if (getDeliveredMessageCount() > 0) {
        if (process.env.NOTIFICATION_MARKER) {
          writeFileSync(process.env.NOTIFICATION_MARKER, new Date().toISOString())
        }
        if (process.env.GITHUB_OUTPUT) {
          appendFileSync(process.env.GITHUB_OUTPUT, 'sent=true\n')
        }
      }
    }
  }
  run().catch(() => {
    console.error('消息任务失败，请检查接口和发送日志。')
    process.exitCode = 1
  })
} else {
  console.log(`跳过 ${process.env.MESSAGE_TYPE}：已超出北京时间发送窗口，不补发过期消息。`)
}
