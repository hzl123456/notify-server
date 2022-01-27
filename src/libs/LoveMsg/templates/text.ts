/**
 * @description 纯文本模板-企业微信消息通知
 * https://open.work.weixin.qq.com/api/doc/90000/90135/90236
 */
import dayjs from 'dayjs'

export const textTemplate = (data: TextTemplateProps) => {
  const { dayInfo, caiHongpi, sayLove, songLyrics, oneMagazines, netEaseCloud, oneWord, dayEnglish } = data
  let text = '早安呀，我可爱的小杜宝~\n'

  if (dayInfo) {
    const { info, cnweekday } = dayInfo
    if (info === '工作日') {
      text += `
如果我小杜宝已经起床啦！胖虎向你说早安呦~，记得吃早饭呀😆\n
嗯哼哼~今天可是${ cnweekday }，工作日哦，那上班可别迟到了哦~\n`
    } else {
      text += `
如果我小杜宝还没起床呀！胖虎就等着小杜宝起床给我说早安呦🤣\n
嗯哼哼~既然今天是${ cnweekday }，节假日哦，就让你再睡会懒觉~下次可不能啦~😝\n`
    }
  }

  // 添加笑话
  if (caiHongpi) {
    text += `
${ caiHongpi.content }\n`
  }

  if (sayLove) {
    text += `
${ sayLove.content }\n`
  }

  // 诗句
  if (songLyrics) {
    text += `
『${ songLyrics.source }』${ songLyrics.content }\n`
  }

  if (oneMagazines) {
    text += `
『ONE杂志』${ oneMagazines.word }\n`
  }

  if (netEaseCloud) {
    text += `
『网易云音乐热评』${ netEaseCloud.content }——${ netEaseCloud.source }\n`
  }

  // 添加一句一言
  if (oneWord) {
    text += `
『一言』${ oneWord.hitokoto }\n`
  }

  // 每日英语
  if (dayEnglish) {
    text += `
『每日英语（${ dayjs(dayEnglish.date).format('ll') }』${ dayEnglish.content }`
  }

  return {
    msgtype: 'text',
    text: {
      content: text
    }
  }
}
