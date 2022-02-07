/**
 * @name goodAfternoon
 * @description 说午安
 */
import API from '../../api/loveMsg'
import { wxNotify } from '../WxNotify'

export const goodAfternoon = async() => {
  const res = await API.getJoke()

  let text = '今日份午安来喽:\n'

  text += `
请欣赏以下雷人笑话😝\n`

  text += `
${res.map(n => `『${n.title}』${n.content}`).join('\n\n')}`

  // 对于太长的文本需要进行截断发送，以 maxCount 为分界线，最大字节是 2048，这里就用 1024 吧
  const maxCount = 1024;
  for (let i = 0; i < text.length; i += maxCount) {
    const content = text.substring(i, Math.min(i + maxCount - 1, text.length - 1))
    const template = {
      msgtype: 'text',
      text: { content }
    }
    await wxNotify(template)
  }
}
