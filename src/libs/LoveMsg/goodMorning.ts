/**
 * @name goodMorning
 * @description 说早安
 */
import API from '../../api/loveMsg'
import { wxNotify } from '../WxNotify'
import { textTemplate } from './templates/text'
import { textCardTemplate } from './templates/textcard'

// 美丽短句
const goodWord = async() => {
  try {
    // 并行请求，优响相应
    const dataSource = await Promise.all([
      API.getDayInfo(), // 工作日信息
      API.getSaylove(), // 土味情话
      API.getCaihongpi(), // 彩虹屁
      API.getOneWord(), // 一言
      API.getSongLyrics(), // 最美宋词
      API.getOneMagazines(), // one杂志
      API.getNetEaseCloud(), // 网易云热评
      API.getDayEnglish(), // 每日英语
    ])
    // 过滤掉异常数据
    const [dayInfo, sayLove, caiHongpi, oneWord, songLyrics, oneMagazines, netEaseCloud, dayEnglish] = dataSource
    // 对象写法
    const data: any = {
      dayInfo,
      sayLove,
      caiHongpi,
      oneWord,
      songLyrics,
      oneMagazines,
      netEaseCloud,
      dayEnglish,
    }
    const template = textTemplate(data)
    wxNotify(template)
  }
  catch (error) {
  }
}

// 天气信息
const weatherInfo = async() => {
  const weather = await API.getWeather('杭州')
  if (weather) {
    const lunarInfo = await API.getLunarDate(weather.date)
    const oneWord = await API.getOneWord()
    const template = textCardTemplate({ ...weather, lunarInfo, oneWord })
    // 发送消息
    await wxNotify(template)
  }
}

// goodMorning
export const goodMorning = async() => {
  await weatherInfo()
  await goodWord()
}
