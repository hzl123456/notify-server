/**
 * 消息入口
 */
import dotenv from 'dotenv'
import { goodMorning } from './goodMorning'
import { goodAfternoon } from './goodAfternoon'
import { goodEvening } from './goodEvening'
import { birthday } from './birthday'

dotenv.config()

const { MESSAGE_TYPE } = process.env

export default function main() {
  if (MESSAGE_TYPE === 'goodAfternoon') {
    // 午安
    goodAfternoon()
  }
  else if (MESSAGE_TYPE === 'goodEvening') {
    // 晚安
    goodEvening()
  }
  else if (MESSAGE_TYPE === 'goodMorning') {
    // 早安
    goodMorning()
  }
  else {
    // 生日助手
    birthday()
  }
}
