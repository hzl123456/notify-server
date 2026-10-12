import { describe, expect, it } from 'vitest'
import { canSendNow, hasReachedSendTime, MessageType } from '../src/utils/schedule'
import { getNotification, getNotifications } from '../scripts/schedule.cjs'

const { waitUntil } = require('../scripts/wait-until.cjs')

describe('Beijing notification dates and times', () => {
  it('does not send early and permits each type at or after its scheduled time', () => {
    const cases: [MessageType, string][] = [
      ['goodMorning', '2026-10-08T23:45:00Z'],
      ['goodAfternoon', '2026-10-09T02:58:00Z'],
      ['birthday', '2026-10-09T06:58:00Z'],
      ['goodEvening', '2026-10-09T13:58:00Z'],
    ]
    for (const [type, timestamp] of cases) {
      const target = Date.parse(timestamp)
      expect(getNotification(type, new Date(timestamp))).toEqual({
        type,
        date: '2026-10-09',
        id: `notification-2026-10-09-${type}`,
        scheduledAt: new Date(target).toISOString(),
      })
      expect(hasReachedSendTime(type, new Date(target - 1), '2026-10-09')).toEqual(false)
      expect(hasReachedSendTime(type, new Date(target), '2026-10-09')).toEqual(true)
      expect(hasReachedSendTime(type, new Date(target + 12 * 3600000), '2026-10-09')).toEqual(true)
    }
  })

  it('allows late sends, including an already prepared story after midnight', () => {
    const evening = new Date('2026-10-11T15:30:00Z')
    expect(hasReachedSendTime('goodAfternoon', evening, '2026-10-11')).toEqual(true)
    expect(hasReachedSendTime('birthday', evening, '2026-10-11')).toEqual(true)
    expect(hasReachedSendTime('goodEvening', evening, '2026-10-11')).toEqual(true)
    const late = new Date('2026-10-11T19:36:00Z')
    const story = getNotification('goodEvening', late, '2026-10-11')
    expect(hasReachedSendTime('goodEvening', late, story.date)).toEqual(true)
    // 新触发不会重新创建昨天的任务。
    expect(getNotifications(late)).toEqual([])
  })

  it('keeps deduplication keys tied to the planned Beijing date across midnight', () => {
    const before = getNotifications(new Date('2026-10-11T15:30:00Z')).find(
      (n) => n.type === 'goodEvening'
    )
    const after = getNotification('goodEvening', new Date('2026-10-11T19:36:00Z'), '2026-10-11')
    expect(before?.id).toEqual('notification-2026-10-11-goodEvening')
    expect(after?.id).toEqual(before?.id)
    expect(getNotification('goodEvening', new Date('2026-10-12T13:58:00Z')).id).toEqual(
      'notification-2026-10-12-goodEvening'
    )
  })

  it('checks automatic send times while keeping manual sends available', () => {
    const names = [
      'MESSAGE_TYPE',
      'GITHUB_EVENT_NAME',
      'ENFORCE_SCHEDULE',
      'ENFORCE_SEND_WINDOW',
      'NOTIFICATION_DATE',
    ]
    const previous = { ...process.env }
    const late = new Date('2026-10-11T19:36:00Z')
    try {
      delete process.env.ENFORCE_SCHEDULE
      delete process.env.ENFORCE_SEND_WINDOW
      process.env.MESSAGE_TYPE = 'goodEvening'
      process.env.NOTIFICATION_DATE = '2026-10-11'
      process.env.GITHUB_EVENT_NAME = 'schedule'
      expect(canSendNow(late)).toEqual(true)
      process.env.NOTIFICATION_DATE = '2026-10-12'
      expect(canSendNow(late)).toEqual(false)
      process.env.GITHUB_EVENT_NAME = 'workflow_dispatch'
      expect(canSendNow(late)).toEqual(true)
      process.env.ENFORCE_SCHEDULE = 'true'
      expect(canSendNow(late)).toEqual(false)
      process.env.MESSAGE_TYPE = 'unknown'
      expect(canSendNow(late)).toEqual(false)
    } finally {
      for (const name of names) {
        if (previous[name] === undefined) delete process.env[name]
        else process.env[name] = previous[name]
      }
    }
  })
})

describe('preparing and recovering all notification types', () => {
  it('prepares the missed types at the real early trigger times', () => {
    const cases: [string, MessageType][] = [
      ['2026-10-10T04:09:57+08:00', 'goodMorning'],
      ['2026-10-10T02:45:51Z', 'goodAfternoon'],
      ['2026-10-11T02:11:43Z', 'goodAfternoon'],
      ['2026-10-10T05:54:13Z', 'birthday'],
      ['2026-10-11T05:35:44Z', 'birthday'],
      ['2026-10-10T12:22:06Z', 'goodEvening'],
      ['2026-10-11T11:36:50Z', 'goodEvening'],
      ['2026-10-09T18:11:04+08:00', 'goodEvening'],
    ]
    for (const [timestamp, type] of cases) {
      const now = new Date(timestamp)
      const notifications = getNotifications(now)
      const item = notifications.find(
        (n) => n.type === type && Date.parse(n.scheduledAt) > now.getTime()
      )
      expect(item).toBeDefined()
      expect(hasReachedSendTime(type, now, item?.date)).toEqual(false)
    }
  })

  it('recovers every due type in a single late run rather than only selecting one', () => {
    const notifications = getNotifications(new Date('2026-10-11T15:30:00Z'))
    expect(notifications.map((n) => n.type)).toEqual([
      'goodMorning',
      'goodAfternoon',
      'birthday',
      'goodEvening',
    ])
    expect(notifications.map((n) => n.date)).toEqual(Array(4).fill('2026-10-11'))
    expect(new Set(notifications.map((n) => n.id)).size).toEqual(4)
    expect(getNotifications(new Date('2026-10-11T19:36:00Z'))).toEqual([])
  })

  it('does not replay yesterday’s noon, birthday or bedtime at the reported 10:39 trigger', () => {
    const now = new Date('2026-10-12T02:39:09Z')
    const notifications = getNotifications(now)
    expect(notifications.map((n) => n.type)).toEqual(['goodMorning', 'goodAfternoon'])
    expect(notifications.map((n) => n.date)).toEqual(['2026-10-12', '2026-10-12'])
    expect(hasReachedSendTime('goodAfternoon', now, notifications[1].date)).toEqual(false)
    expect(
      getNotifications(new Date('2026-10-12T02:58:00Z')).filter((n) => n.type === 'goodAfternoon')
        .length
    ).toEqual(1)
  })

  it('covers all four messages at their target times using the real October 10 and 11 triggers', () => {
    const days = [
      ['2026-10-10', ['04:09:57', '08:03:59', '10:45:51', '13:54:13', '17:32:17', '20:22:06']],
      ['2026-10-11', ['04:40:17', '07:53:21', '10:11:43', '13:35:44', '17:45:14', '19:36:50']],
    ] as const
    for (const [date, times] of days) {
      const deliveries = new Map<string, number>()
      for (const time of times) {
        const now = new Date(`${date}T${time}+08:00`)
        for (const item of getNotifications(now).filter((n) => n.date === date)) {
          if (!deliveries.has(item.id))
            deliveries.set(item.id, Math.max(now.getTime(), Date.parse(item.scheduledAt)))
        }
      }
      expect(deliveries.size).toEqual(4)
      for (const type of ['goodMorning', 'goodAfternoon', 'birthday', 'goodEvening'] as const) {
        expect(deliveries.get(`notification-${date}-${type}`)).toEqual(
          Date.parse(getNotification(type, new Date(`${date}T12:00:00+08:00`)).scheduledAt)
        )
      }
    }
  })
})

describe('waiting on a prepared runner', () => {
  it('becomes ready at the scheduled time without sending early', async () => {
    const target = Date.parse('2026-10-11T13:58:00Z')
    let current = target - 90000
    const result = await waitUntil(new Date(target).toISOString(), {
      now: () => current,
      sleep: async (milliseconds: number) => {
        expect(current).toBeLessThan(target)
        expect(milliseconds).toBeLessThanOrEqual(30000)
        current += milliseconds
      },
    })
    expect(result).toEqual(true)
    expect(current).toEqual(target)
  })

  it('permits catch-up even when the runner resumes hours late or after midnight', async () => {
    const target = Date.parse('2026-10-11T13:58:00Z')
    let current = target - 1000
    const result = await waitUntil(new Date(target).toISOString(), {
      now: () => current,
      sleep: async () => {
        current = target + 6 * 3600000
      },
    })
    expect(result).toEqual(true)
    expect(
      await waitUntil(new Date(target).toISOString(), { now: () => target + 24 * 3600000 })
    ).toEqual(true)
  })
})
