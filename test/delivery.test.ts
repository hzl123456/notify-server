import { describe, expect, it } from 'vitest'
import { getDeliveryId, wasDeliveredToday } from '../scripts/schedule.cjs'

// 本次问题中的真实旧版记录：计划日期是 11 日，实际创建于 12 日 10:39。
const legacy = [
  {
    name: 'notification-2026-10-11-goodAfternoon',
    created_at: '2026-10-12T02:39:29Z',
    expired: false,
  },
  { name: 'notification-2026-10-11-birthday', created_at: '2026-10-12T02:39:29Z', expired: false },
  {
    name: 'notification-2026-10-11-goodEvening',
    created_at: '2026-10-12T02:39:32Z',
    expired: false,
  },
]

describe('deduplication by actual Beijing send date', () => {
  it('recognizes the 10:39 noon receipt before the second 10:58 send', () => {
    expect(wasDeliveredToday(legacy, 'goodAfternoon', new Date('2026-10-12T02:58:00Z'))).toEqual(
      true
    )
  })

  it('also suppresses today’s birthday and bedtime after their 10:39 catch-up', () => {
    expect(wasDeliveredToday(legacy, 'birthday', new Date('2026-10-12T06:58:00Z'))).toEqual(true)
    expect(wasDeliveredToday(legacy, 'goodEvening', new Date('2026-10-12T13:58:00Z'))).toEqual(true)
  })

  it('does not block tomorrow or a different message type', () => {
    expect(wasDeliveredToday(legacy, 'goodAfternoon', new Date('2026-10-13T02:58:00Z'))).toEqual(
      false
    )
    expect(wasDeliveredToday(legacy, 'goodMorning', new Date('2026-10-12T02:58:00Z'))).toEqual(
      false
    )
  })

  it('uses Beijing rather than UTC to identify a send day', () => {
    expect(getDeliveryId('goodMorning', new Date('2026-10-11T23:45:00Z'))).toEqual(
      'delivery-2026-10-12-goodMorning'
    )
  })

  it('keeps the actual send date even when receipt upload crosses midnight', () => {
    const receipt = [
      {
        name: 'delivery-2026-10-11-goodEvening',
        created_at: '2026-10-11T16:00:02Z',
        expired: false,
      },
    ]
    expect(wasDeliveredToday(receipt, 'goodEvening', new Date('2026-10-11T15:59:59Z'))).toEqual(
      true
    )
    expect(wasDeliveredToday(receipt, 'goodEvening', new Date('2026-10-11T16:00:03Z'))).toEqual(
      false
    )
  })

  it('ignores expired receipts and unrelated artifact names', () => {
    const now = new Date('2026-10-12T03:00:00Z')
    const receipts = [
      { ...legacy[0], expired: true },
      { name: 'unrelated-goodAfternoon', created_at: '2026-10-12T02:39:29Z', expired: false },
      {
        name: 'delivery-2026-10-12-goodAfternoon',
        created_at: '2026-10-12T02:39:29Z',
        expired: true,
      },
    ]
    expect(wasDeliveredToday(receipts, 'goodAfternoon', now)).toEqual(false)
  })
})
