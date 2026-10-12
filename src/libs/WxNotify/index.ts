/**
 * @description 获取环境变量参数，执行微信消息通知函数
 */
import dotenv from 'dotenv'
import { getToken } from './getToken'
import { postMsg } from './postMsg'
import { canSendNow } from '../../utils/schedule'

// 读取 .env环境变量
dotenv.config()
const { WX_COMPANY_ID, WX_APP_ID, WX_APP_SECRET } = process.env

let deliveredMessageCount = 0

export function getDeliveredMessageCount() {
  return deliveredMessageCount
}

// 主函数
export async function wxNotify(config: any, dependencies = { getToken, postMsg, canSendNow }) {
  if (!dependencies.canSendNow()) {
    console.log('跳过发送：尚未到计划发送时间。')
    return false
  }
  try {
    // 获取token
    const accessToken = await dependencies.getToken({
      id: WX_COMPANY_ID as string,
      secret: WX_APP_SECRET as string,
    })
    // 发送消息
    const defaultConfig = {
      msgtype: 'text',
      agentid: WX_APP_ID,
      ...config,
    }
    const option = { ...defaultConfig, ...config }
    // 发送前再次确认当前计划已经到时。
    if (!dependencies.canSendNow()) {
      console.log('跳过发送：尚未到计划发送时间。')
      return false
    }
    const res = await dependencies.postMsg(accessToken, option)
    if (res.errcode !== 0) {
      throw new Error(`企业微信返回错误码 ${res.errcode}`)
    }
    deliveredMessageCount += 1
    console.log('wx:信息发送成功！', res)
    return true
  } catch (error) {
    console.log('wx:信息发送失败！', error instanceof Error ? error.message : '未知错误')
    return false
  }
}
