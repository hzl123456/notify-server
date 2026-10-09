/**
 * 消息入口
 */
import dotenv from 'dotenv'
import { goodMorning } from './goodMorning'
import { goodAfternoon } from './goodAfternoon'
import { goodEvening } from './goodEvening'
import { birthday } from './birthday'
import { isMessageType } from '../../utils/schedule'

dotenv.config()

export default async function main(
  handlers = { goodMorning, goodAfternoon, goodEvening, birthday }
) {
  const MESSAGE_TYPE = process.env.MESSAGE_TYPE
  if (!isMessageType(MESSAGE_TYPE)) {
    throw new Error('MESSAGE_TYPE 必须是 goodMorning、goodAfternoon、goodEvening 或 birthday')
  }
  await handlers[MESSAGE_TYPE]()
}
