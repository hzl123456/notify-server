import axios from 'axios'
import { getTian } from '../utils/http'

/**
 * 给女朋友发送内容的相关接口
 */
enum LoveMsgURL {
  // 天气
  weather = 'https://restapi.amap.com/v3/weather/weatherInfo',
  // 一言
  oneWord = 'https://v1.hitokoto.cn/?encode=json',
  // 国内新闻
  topNews = 'https://apis.tianapi.com/guonei/index',
  // 最美宋词
  songLyrics = 'https://apis.tianapi.com/zmsc/index',
  // 每日一句美好英语
  dayEnglish = 'https://apis.tianapi.com/everyday/index',
  // 韩寒主编的ONE一个杂志，本接口返回每日一句
  oneMagazines = 'https://apis.tianapi.com/one/index',
  // 故事大全
  storybook = 'https://apis.tianapi.com/story/index',
  // 网易云热评
  netEaseCloud = 'https://apis.tianapi.com/hotreview/index',
  // 获取农历信息
  lunarDate = 'https://apis.tianapi.com/lunar/index',
  // 土味情话
  saylove = 'https://apis.tianapi.com/saylove/index',
  // 彩虹屁
  caihongpi = 'https://apis.tianapi.com/caihongpi/index',
  // 笑话
  joke = 'https://apis.tianapi.com/joke/index',
  // 日期
  dayInfo = 'https://apis.tianapi.com/jiejiari/index',
}

class API {
  key: string

  constructor(key?: string) {
    this.key = key || '' // 为了方便，key在 http中统一添加
  }

  getKey() {
    return this.key
  }

  // 天气
  async getWeather(): Promise<IWeatherResponseProps> {
    const response = await axios({
      url: LoveMsgURL.weather,
      params: {
        key: 'ce468efe250c3cc7dc6f8e742a79ce3c',
        city: '330100' // 杭州
      }
    })
    return response.data.lives[0]
  }

  // 今日头条
  async getTianTopNews() {
    const res = await getTian<{ newslist: TodayHeadlines[] }>({
      url: LoveMsgURL.topNews,
      params: {
        key: '79e9f058ea0cca237a22b2d18c6c8b52',
        page: 1,
        num: 8
      }
    })
    return res.newslist
  }

  // 最美宋词
  async getSongLyrics() {
    return await getTian<IVerseProps>({ url: LoveMsgURL.songLyrics })
  }

  // 每日一句美好英语
  async getDayEnglish() {
    return await getTian<ResEnglishProps>({ url: LoveMsgURL.dayEnglish })
  }

  // one一个杂志
  async getOneMagazines() {
    return await getTian<OneMagazines>({ url: LoveMsgURL.oneMagazines })
  }

  // 故事大全
  async getStorybook() {
    const res = await getTian<{ list: StorybookProps[] }>({ url: LoveMsgURL.storybook })
    return res.list[0]
  }

  // 网易云热评
  async getNetEaseCloud() {
    return await getTian<NetEaseCloudProps>({ url: LoveMsgURL.netEaseCloud })
  }

  // 获取农历信息
  async getLunarDate(date: string) {
    return await getTian<ResLunarDateProps>({ url: LoveMsgURL.lunarDate, params: { date } })
  }

  // 土味情话
  async getSaylove() {
    return await getTian<SayloveProps>({ url: LoveMsgURL.saylove })
  }

  // 彩虹屁
  async getCaihongpi() {
    return await getTian<SayloveProps>({ url: LoveMsgURL.caihongpi })
  }

  // 雷人笑话
  async getJoke(num = 6) {
    const res = await getTian<{ list: JokeProps[] }>({ url: LoveMsgURL.joke, params: { num } })
    return res.list
  }

  // 日期信息
  async getDayInfo(): Promise<DayInfo | null> {
    const res = await getTian<{ list: DayInfo[] }>({ url: LoveMsgURL.dayInfo })
    return res.list[0]
  }

  // 一言
  async getOneWord(): Promise<OneWordProps | null> {
    try {
      const response = await axios(LoveMsgURL.oneWord, { timeout: 30000 })
      return response.data
    } catch (error) {
      return null
    }
  }
}

export default new API()
