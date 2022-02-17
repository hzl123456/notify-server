/**
 * @name goodEvening
 * @description 说晚安
 */
import API from '../../api/loveMsg'
import { wxNotify } from '../WxNotify'
import { newsTemplate } from './templates/news'

// 获取新闻
const getNews = async () => {
  try {
    // 今日头条
    const result = await API.getTianTopNews()
    // 发送消息
    const times = Math.ceil(result.length / 8)
    for (let i = 0; i < times; i++) {
      const start = 8 * i
      const end = 8 * i + 8 < result.length ? 8 * i + 8 : result.length
      const template = newsTemplate(result.slice(start, end))
      await wxNotify(template)
    }
  } catch (e) {
  }
}

// 获今日取故事
const getStory = async () => {
  const res = await API.getStorybook()
  const text = `给小杜宝的今日份睡前故事来喽：
🌑🌒🌓🌔🌕🌝😛\n
『${res.title}』
${res.content}`

  // 对于太长的文本需要进行截断发送，以 maxCount 为分界线，最大字节是 2048，这里就用 500 吧
  const maxCount = 500
  for (let i = 0; i < text.length; i += maxCount) {
    const content = text.substring(i, Math.min(i + maxCount, text.length - 1))
    const template = {
      msgtype: 'text',
      text: { content }
    }
    await wxNotify(template)
  }
}

// 执行函数
export const goodEvening = async () => {
  await getStory()
  await getNews()
}
