/**
 * 卡片类型模板定义
 * 模板内容配置
 * 微信通知 textcard 类型的 description 内容限制512个字节
 */
import dayjs from 'dayjs'

// 相识的日子
const start_stamp = '2020-10-21'

// 结婚的日子
const start_marry_stamp = '2023-02-16'

export const textCardTemplate = (data: TextCardTemplateProps) => {
  const {
    city,
    weather,
    temperature,
    winddirection,
    windpower,
    humidity,
    lunarInfo,
    oneWord,
  } = data

  const date = dayjs().format('YYYY-MM-DD')

  // 今日、恋爱天数
  const today = `${date.replace('-', '年').replace('-', '月')}日`
  const dateLength = dayjs(date).diff(start_stamp, 'day') + 1

  // 结婚天数
  const marryDateLength = dayjs(date).diff(start_marry_stamp, 'day') + 1

  // 公历节日、农历节日和二十四节气
  const { festival, lunar_festival, jieqi, lubarmonth, lunarday } = lunarInfo
  const festival_info = festival ? `| ${festival}` : ''
  const lunar_festival_info = lunar_festival ? `| ${lunar_festival}` : ''
  const jieqi_info = jieqi ? `| ${jieqi}` : ''

  // 拼接内容
  let description = `${city} | ${today} | ${festival_info}
农历 | ${lubarmonth}${lunarday} ${lunar_festival_info} ${jieqi_info}\n
今日天气状况：
天气：${weather}
风速：${winddirection} ~ ${windpower}
温度：${temperature}℃（实时）
湿度：${humidity}\n`

  // 最高温度
  if (Number(temperature) <= 10) {
    description += `
哈喽哈喽~这里是来自胖虎的爱心提醒哦：
当前实时温度仅为🥶 ${temperature}℃，可冷可冷了~
小杜宝可要注意保暖哦~\n`
  }

  if (oneWord) {
    description += `
『 ${oneWord.hitokoto} 』`
  }

  // 内容末尾，自定义
  description += `
  [ 点我有惊喜 ] ❤️ 🧡 💛 💚 💖`

  const title = `这是我们相识的第 ${dateLength} 天，结婚的第 ${marryDateLength} 天`

  return {
    msgtype: 'textcard',
    textcard: {
      title,
      description,
      url: 'https://api.vvhan.com/api/60s', // 60s看世界
      btntxt: 'By胖虎',
    },
  }
}
