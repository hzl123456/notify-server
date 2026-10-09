import { describe, expect, it } from 'vitest'
import { canSendNow, isWithinSendWindow, MessageType } from '../src/utils/schedule'

const { checkSchedule } = require('../scripts/check-schedule.cjs')

describe('Beijing notification windows', () => {
  it('sends each message at the configured Beijing time', () => {
    const cases: [MessageType, string][] = [
      ['goodMorning', '2026-10-08T23:45:00Z'],
      ['goodAfternoon', '2026-10-09T02:58:00Z'],
      ['birthday', '2026-10-09T06:58:00Z'],
      ['goodEvening', '2026-10-09T13:58:00Z'],
    ]
    for (const [type, timestamp] of cases) {
      expect(isWithinSendWindow(type, new Date(timestamp))).toEqual(true)
      expect(checkSchedule(new Date(timestamp))).toEqual({
        type,
        date: '2026-10-09',
        id: `notification-2026-10-09-${type}`,
      })
      expect(isWithinSendWindow(type, new Date(Date.parse(timestamp) - 1000))).toEqual(false)
      expect(
        isWithinSendWindow(type, new Date(Date.parse(timestamp) + 29 * 60000 + 59000))
      ).toEqual(true)
      expect(isWithinSendWindow(type, new Date(Date.parse(timestamp) + 30 * 60000))).toEqual(false)
      expect(checkSchedule(new Date(Date.parse(timestamp) + 30 * 60000))).toEqual(null)
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
      for (const name of ['MESSAGE_TYPE', 'GITHUB_EVENT_NAME', 'ENFORCE_SEND_WINDOW']) {
        if (previous[name] === undefined) delete process.env[name]
        else process.env[name] = previous[name]
      }
    }
  })
})
