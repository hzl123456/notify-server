import dotenv from 'dotenv'
import { appendFileSync, writeFileSync } from 'fs'
import LoveMsg from './libs/LoveMsg'
import { getDeliveredMessageCount, getFirstDeliveredAt } from './libs/WxNotify'
import { canSendNow, notificationTimeZone, MessageType } from './utils/schedule'
import { getDeliveryId } from '../scripts/schedule.cjs'
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
        const sentAt = getFirstDeliveredAt() as Date
        const deliveryId = getDeliveryId(process.env.MESSAGE_TYPE as MessageType, sentAt)
        if (process.env.NOTIFICATION_MARKER) {
          writeFileSync(
            process.env.NOTIFICATION_MARKER,
            JSON.stringify({
              sentAt: sentAt.toISOString(),
              deliveryId,
              plannedDate: process.env.NOTIFICATION_DATE,
            })
          )
        }
        if (process.env.GITHUB_OUTPUT) {
          appendFileSync(process.env.GITHUB_OUTPUT, `sent=true\ndelivery_id=${deliveryId}\n`)
        }
      }
    }
  }
  run().catch(() => {
    console.error('消息任务失败，请检查接口和发送日志。')
    process.exitCode = 1
  })
} else {
  console.log(`跳过 ${process.env.MESSAGE_TYPE}：尚未到北京时间计划发送时间。`)
}
