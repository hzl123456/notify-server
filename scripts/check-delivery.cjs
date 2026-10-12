const { appendFileSync } = require('fs')
const { execFileSync } = require('child_process')
const { wasDeliveredToday, getDeliveryDate } = require('./schedule.cjs')

// 遍历所有记录，兼容旧计划日期的记录；查询失败直接退出，避免误判未发送。
const pages = JSON.parse(
  execFileSync(
    'gh',
    [
      'api',
      '--method',
      'GET',
      '--paginate',
      '--slurp',
      `repos/${process.env.GITHUB_REPOSITORY}/actions/artifacts?per_page=100`,
    ],
    { encoding: 'utf8' }
  )
)
const artifacts = pages.flatMap((page) => page.artifacts)
const now = new Date()
const delivered = wasDeliveredToday(artifacts, process.env.MESSAGE_TYPE, now)
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `delivered=${delivered}\n`)
console.log(
  `${getDeliveryDate(now)} ${process.env.MESSAGE_TYPE}：${
    delivered ? '今天已发送，跳过' : '今天尚未发送'
  }`
)
