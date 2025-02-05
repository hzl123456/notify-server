/**
 * @Author: linhe
 * @Date: 2022/9/20 12:00
 */
import dayjs from 'dayjs'
// @ts-ignore
import solarLunar from 'solarlunar'
import { wxNotify } from '../WxNotify'

/**
 * 计算公历生日距离天数
 * @param month 月
 * @param day 日
 * **/
function getBirthdaySolar(month: number, day: number) {
  // 公历计算
  const nowDate = dayjs(Date.now())
  const toDate = dayjs(new Date(nowDate.year(), month - 1, day, 23, 59, 59, 999))
  // 如果已经过了，就计算明年的
  if (toDate.isBefore(nowDate, 'day'))
    return toDate.add(1, 'year').diff(nowDate, 'day')
  else
    return toDate.diff(nowDate, 'day')
}

/**
 * 计算农历生日距离天数
 * @param month 月
 * @param day 日
 * **/
function getBirthdayLunar(month: number, day: number) {
  function getToDateSolarByLunar(date: any) {
    return dayjs(new Date(date.cYear, date.cMonth - 1, date.cDay, 23, 59, 59, 999))
  }
  // 今天公历
  const nowDateSolar = dayjs(Date.now())
  // 今天农历
  const nowDateLunar = solarLunar.solar2lunar(
    nowDateSolar.year(),
    nowDateSolar.month() + 1,
    nowDateSolar.date(),
  )
  // 目标农历转公历
  let toDateSolarByLunar = solarLunar.lunar2solar(nowDateLunar.lYear, month, day)
  // 目标公历
  let toDateSolar = getToDateSolarByLunar(toDateSolarByLunar)
  // 如果已经过了，就计算明年的
  if (toDateSolar.isBefore(nowDateSolar, 'day')) {
    // 得到新的目标农历转公历和目标公历
    toDateSolarByLunar = solarLunar.lunar2solar(nowDateLunar.lYear + 1, month, day)
    toDateSolar = getToDateSolarByLunar(toDateSolarByLunar)
  }
  return toDateSolar.diff(nowDateSolar, 'day')
}

const normalBirthdayList: IBirthday[] = [
  { name: '小杜', month: 1, day: 9 },
  { name: '小何', month: 5, day: 22 },
  { name: '小子由', month: 1, day: 11 },
  { name: '小杜妈妈', month: 2, day: 15, isLunar: true },
  { name: '小杜爸爸', month: 11, day: 1 },
  { name: '小何爸爸', month: 1, day: 22 },
]

const recentBirthdayList: IBirthday[] = [
  ...normalBirthdayList,
  { name: '糖糖', month: 9, day: 12 },
  { name: '小凡', month: 8, day: 8 },
]

interface IBirthday{
  name: string
  month: number
  day: number
  isLunar?: boolean // 是否农历
}

export const birthday = async() => {
  let description = ''

  // 每日生日提醒
  description += '每日生日提醒 ❤️\n'
  for (const data of normalBirthdayList) {
    const { isLunar, month, day, name } = data
    const dayOfBirthday = isLunar ? getBirthdayLunar(month, day) : getBirthdaySolar(month, day)
    description += `距 ${name} ${isLunar ? '农历' : '公历'}生日${month}月${day}日还有 ${dayOfBirthday} 天\n`
  }
  // 近一月生日提醒
  description += '\n近一月生日提醒 🧡\n'
  let hasAdd = false
  for (const data of recentBirthdayList) {
    const { isLunar, month, day, name } = data
    const dayOfBirthday = isLunar ? getBirthdayLunar(month, day) : getBirthdaySolar(month, day)
    if (dayOfBirthday <= 30) {
      description += `距 ${name} ${isLunar ? '农历' : '公历'}生日${month}月${day}日还有 ${dayOfBirthday} 天\n`
      hasAdd = true
    }
  }
  if (!hasAdd) description += '无\n'

  // 温馨提示
  description += '\n温馨提示 💖️：您可以联系胖虎添加您关注的朋友生日，胖虎将会在距离您关注的朋友生日30日内进行每日提醒哦~'

  await wxNotify({
    msgtype: 'textcard',
    textcard: {
      title: '生日提醒小助手',
      description,
      url: 'https://api.vvhan.com/api/60s',
      btntxt: 'By胖虎',
    },
  })
}
