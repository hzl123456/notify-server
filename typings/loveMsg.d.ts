// 定义天气返回值类型
interface IWeatherResponseProps {
  province: string
  city: string
  adcode: string
  weather: string
  temperature: string
  winddirection: string
  windpower: string
  humidity: string
  reporttime: string
  temperature_float: string
  humidity_float: string
}

// 预警信息
interface IAlarmProps {
  /** 暴雨 */
  alarm_type: ''
  /** 橙色 */
  alarm_level: ''
  /** 内容 */
  alarm_content: ''
}

interface IVerseProps {
  /** 长安白日照春空，绿杨结烟垂袅风。 */
  content: string
  /** 阳春歌 */
  origin: string
  /** 李白 */
  author: string
  /** 古诗文-天气-太阳 */
  category: string
  /** 天行数据接口 名称 */
  source: string
}

// 每日简报
interface DailyBriefing {
  mtime: string
  title: string
  digest: string
  source: string
  url: string
  imgsrc: string
}

// 今日头条
interface TodayHeadlines {
  ctime: string
  title: string
  description: string
  picUrl: string
  url: string
  source: string
}

// 最美宋词
interface IVerseProps {
  /** 长安白日照春空，绿杨结烟垂袅风。 */
  content: string
  /** 阳春歌 */
  origin: string
  /** 李白 */
  author: string
  /** 古诗文-天气-太阳 */
  category: string
  /** 天行数据接口 名称 */
  source: string
}

// 每日一句好英语
interface ResEnglishProps {
  content: string
  note: string
  imgurl: string
  date: string
}

// 韩寒主编的ONE一个杂志，本接口返回每日一句
interface OneMagazines {
  word: string
  wordfrom: string
  imgurl: string
  note: string
}

// 故事大全
interface StorybookProps {
  title: string
  content: string
}

// 网易云热评
interface NetEaseCloudProps {
  source: string
  content: string
}

// 获取农历信息
interface ResLunarDateProps {
  lunar_festival: string
  festival: string
  lubarmonth: string
  lunarday: string
  jieqi: string
}

// 土味情话
interface SayloveProps {
  content: string
}

// 励志古言
interface InspirationalWordProps {
  saying: string
  transl: string
  source: string
}

// 雷人笑话
interface JokeProps {
  title: string
  content: string
}

// 一言
interface OneWordProps {
  hitokoto: string
  from: string
  from_who: string
  creator: string
}

// 日期信息
interface DayInfo {
  cnweekday: string // 星期几
  info: string // 工作日，节假日
}

/**
 * 模板
 */
// goodMorning
type TextCardTemplateProps = IWeatherResponseProps & {
  lunarInfo: ResLunarDateProps
  oneWord?: OneWordProps | null
}

// goodEvening
type TextTemplateProps = {
  dayInfo: DayInfo | null
  sayLove: SayloveProps | null
  caiHongpi: SayloveProps | null
  oneWord: OneWordProps | null
  songLyrics: IVerseProps | null
  oneMagazines: OneMagazines | null
  netEaseCloud: NetEaseCloudProps | null
  dayEnglish: ResEnglishProps | null
}
