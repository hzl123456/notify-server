import { describe, expect, it } from 'vitest'
import {
  canSendNow,
  isWithinSendWindow,
  MessageType,
  notificationSchedule,
} from '../src/utils/schedule'

const { checkSchedule, getNotifications } = require('../scripts/check-schedule.cjs')
const { waitUntil } = require('../scripts/wait-until.cjs')

describe('Beijing notification windows', () => {
  it('sends each message at the configured Beijing time', () => {
    const cases: [MessageType, string][] = [
      ['goodMorning', '2026-10-08T23:45:00Z'],
      ['goodAfternoon', '2026-10-09T02:58:00Z'],
      ['birthday', '2026-10-09T06:58:00Z'],
      ['goodEvening', '2026-10-09T13:58:00Z'],
    ]
    for (const [type, timestamp] of cases) {
      const delay = notificationSchedule[type].maxDelayMinutes * 60000
      expect(isWithinSendWindow(type, new Date(timestamp))).toEqual(true)
      expect(checkSchedule(new Date(timestamp))).toEqual({
        type,
        date: '2026-10-09',
        id: `notification-2026-10-09-${type}`,
      })
      expect(isWithinSendWindow(type, new Date(Date.parse(timestamp) - 1000))).toEqual(false)
      expect(isWithinSendWindow(type, new Date(Date.parse(timestamp) + delay - 1))).toEqual(true)
      expect(isWithinSendWindow(type, new Date(Date.parse(timestamp) + delay))).toEqual(false)
      expect(checkSchedule(new Date(Date.parse(timestamp) + delay))).toEqual(null)
    }
  })

  it('does not send the delayed 03:36 story or other messages hours late', () => {
    expect(isWithinSendWindow('goodEvening', new Date('2026-10-08T19:36:00Z'))).toEqual(false)
    expect(checkSchedule(new Date('2026-10-08T19:36:00Z'))).toEqual(null)
    expect(isWithinSendWindow('goodEvening', new Date('2026-10-08T16:00:00Z'))).toEqual(false)
    expect(isWithinSendWindow('goodMorning', new Date('2026-10-08T02:56:00Z'))).toEqual(false)
    expect(isWithinSendWindow('goodAfternoon', new Date('2026-10-08T10:06:00Z'))).toEqual(false)
    expect(isWithinSendWindow('birthday', new Date('2026-10-08T14:06:00Z'))).toEqual(false)
  })

  it('uses the Beijing date to identify each daily delivery', () => {
    const first = checkSchedule(new Date('2026-10-08T23:45:00Z'))
    const repeat = checkSchedule(new Date('2026-10-08T23:53:00Z'))
    const nextDay = checkSchedule(new Date('2026-10-09T23:45:00Z'))
    expect(first.id).toEqual(repeat.id)
    expect(first.id).toEqual('notification-2026-10-09-goodMorning')
    expect(nextDay.id).toEqual('notification-2026-10-10-goodMorning')
  })

  it('enforces automatic sends and leaves manual sends available', () => {
    const previous = { ...process.env }
    const late = new Date('2026-10-08T19:36:00Z')
    try {
      delete process.env.ENFORCE_SEND_WINDOW
      delete process.env.NOTIFICATION_DATE
      process.env.MESSAGE_TYPE = 'goodEvening'
      process.env.GITHUB_EVENT_NAME = 'schedule'
      expect(canSendNow(late)).toEqual(false)
      process.env.GITHUB_EVENT_NAME = 'workflow_dispatch'
      expect(canSendNow(late)).toEqual(true)
      process.env.ENFORCE_SEND_WINDOW = 'true'
      expect(canSendNow(late)).toEqual(false)
      process.env.MESSAGE_TYPE = 'unknown'
      expect(canSendNow(new Date('2026-10-09T13:58:00Z'))).toEqual(false)
    } finally {
      for (const name of [
        'MESSAGE_TYPE',
        'GITHUB_EVENT_NAME',
        'ENFORCE_SEND_WINDOW',
        'NOTIFICATION_DATE',
      ]) {
        if (previous[name] === undefined) delete process.env[name]
        else process.env[name] = previous[name]
      }
    }
  })

  it('does not send a job from yesterday during the next day’s valid window', () => {
    const previous = { ...process.env }
    try {
      process.env.ENFORCE_SEND_WINDOW = 'true'
      process.env.MESSAGE_TYPE = 'goodMorning'
      process.env.NOTIFICATION_DATE = '2026-10-10'
      expect(canSendNow(new Date('2026-10-10T23:45:00Z'))).toEqual(false)
      process.env.NOTIFICATION_DATE = '2026-10-11'
      expect(canSendNow(new Date('2026-10-10T23:45:00Z'))).toEqual(true)
    } finally {
      for (const name of ['MESSAGE_TYPE', 'ENFORCE_SEND_WINDOW', 'NOTIFICATION_DATE']) {
        if (previous[name] === undefined) delete process.env[name]
        else process.env[name] = previous[name]
      }
    }
  })
})

describe('preparing notifications before sparse GitHub triggers', () => {
  it('prepares noon and bedtime messages at the actual early triggers that previously skipped them', () => {
    for (const [timestamp, type] of [
      ['2026-10-10T04:09:57+08:00', 'goodMorning'],
      ['2026-10-10T02:45:51Z', 'goodAfternoon'],
      ['2026-10-11T02:11:43Z', 'goodAfternoon'],
      ['2026-10-10T05:54:13Z', 'birthday'],
      ['2026-10-11T05:35:44Z', 'birthday'],
      ['2026-10-10T12:22:06Z', 'goodEvening'],
      ['2026-10-11T11:36:50Z', 'goodEvening'],
      ['2026-10-09T18:11:04+08:00', 'goodEvening'],
    ]) {
      const now = new Date(timestamp)
      const notifications = getNotifications(now)
      const item = notifications.find((n: { type: string }) => n.type === type)
      expect(item).toBeDefined()
      expect(Date.parse(item.scheduledAt)).toBeGreaterThan(now.getTime())
      expect(isWithinSendWindow(type as MessageType, now)).toEqual(false)
    }
  })

  it('keeps all eligible message types when catch-up and advance preparation overlap', () => {
    expect(
      getNotifications(new Date('2026-10-11T05:35:44Z')).map((n: { type: string }) => n.type)
    ).toEqual(['goodAfternoon', 'birthday'])
    expect(
      getNotifications(new Date('2026-10-11T11:36:50Z')).map((n: { type: string }) => n.type)
    ).toEqual(['goodEvening'])
    expect(getNotifications(new Date('2026-10-11T19:36:00Z'))).toEqual([])
    expect(getNotifications(new Date('2026-10-11T15:00:00Z'))).toEqual([])
  })

  it('covers all four messages using the real October 10 and 11 trigger times', () => {
    const days = [
      ['2026-10-10', ['04:09:57', '08:03:59', '10:45:51', '13:54:13', '17:32:17', '20:22:06']],
      ['2026-10-11', ['04:40:17', '07:53:21', '10:11:43', '13:35:44', '17:45:14', '19:36:50']],
    ] as const
    for (const [date, times] of days) {
      const deliveries = new Map<string, string>()
      for (const time of times) {
        const now = new Date(`${date}T${time}+08:00`)
        for (const item of getNotifications(now)) {
          if (!deliveries.has(item.id)) {
            const deliveryTime = Math.max(now.getTime(), Date.parse(item.scheduledAt))
            expect(deliveryTime).toBeLessThan(Date.parse(item.expiresAt))
            deliveries.set(item.id, new Date(deliveryTime).toISOString())
          }
        }
      }
      expect(deliveries.size).toEqual(4)
      for (const type of ['goodMorning', 'goodAfternoon', 'birthday', 'goodEvening'] as const) {
        const expected = {
          goodMorning: '23:45',
          goodAfternoon: '02:58',
          birthday: '06:58',
          goodEvening: '13:58',
        }[type]
        const utcDate =
          type === 'goodMorning'
            ? new Date(Date.parse(`${date}T00:00:00Z`) - 86400000).toISOString().slice(0, 10)
            : date
        expect(deliveries.get(`notification-${date}-${type}`)).toEqual(
          `${utcDate}T${expected}:00.000Z`
        )
      }
    }
  })
})

describe('waiting on a prepared runner', () => {
  it('becomes ready at the scheduled time and never signals an early send', async () => {
    const target = Date.parse('2026-10-11T13:58:00Z')
    let current = target - 90000
    const result = await waitUntil(
      new Date(target).toISOString(),
      new Date(target + 60000).toISOString(),
      {
        now: () => current,
        sleep: async (milliseconds: number) => {
          expect(current).toBeLessThan(target)
          expect(milliseconds).toBeLessThanOrEqual(30000)
          current += milliseconds
        },
      }
    )
    expect(result).toEqual(true)
    expect(current).toEqual(target)
  })

  it('skips when a stalled runner resumes after the deadline', async () => {
    const target = Date.parse('2026-10-11T13:58:00Z')
    let current = target - 1000
    const result = await waitUntil(
      new Date(target).toISOString(),
      new Date(target + 60000).toISOString(),
      {
        now: () => current,
        sleep: async () => {
          current = target + 60000
        },
      }
    )
    expect(result).toEqual(false)
  })
})
