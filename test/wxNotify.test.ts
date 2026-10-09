import { describe, expect, it, vi } from 'vitest'
import { getDeliveredMessageCount, wxNotify } from '../src/libs/WxNotify'

describe('notification delivery', () => {
  it('does not contact WeChat outside the send window', async () => {
    const getToken = vi.fn(async () => 'test-token')
    const postMsg = vi.fn(async () => ({ errcode: 0 }))
    const result = await wxNotify(
      { text: { content: 'test' } },
      {
        getToken,
        postMsg,
        canSendNow: () => false,
      }
    )
    expect(result).toEqual(false)
    expect(getToken).toHaveBeenCalledTimes(0)
    expect(postMsg).toHaveBeenCalledTimes(0)
  })

  it('does not send when fetching the token crosses the deadline', async () => {
    let inWindow = true
    const postMsg = vi.fn(async () => ({ errcode: 0 }))
    const result = await wxNotify(
      { text: { content: 'test' } },
      {
        getToken: async () => {
          inWindow = false
          return 'test-token'
        },
        postMsg,
        canSendNow: () => inWindow,
      }
    )
    expect(result).toEqual(false)
    expect(postMsg).toHaveBeenCalledTimes(0)
  })

  it('does not record a WeChat API error as a successful delivery', async () => {
    const before = getDeliveredMessageCount()
    const result = await wxNotify(
      { text: { content: 'test' } },
      {
        getToken: async () => 'test-token',
        postMsg: async () => ({ errcode: 40014 }),
        canSendNow: () => true,
      }
    )
    expect(result).toEqual(false)
    expect(getDeliveredMessageCount()).toEqual(before)
  })

  it('records a confirmed successful delivery', async () => {
    const before = getDeliveredMessageCount()
    const result = await wxNotify(
      { text: { content: 'test' } },
      {
        getToken: async () => 'test-token',
        postMsg: async () => ({ errcode: 0 }),
        canSendNow: () => true,
      }
    )
    expect(result).toEqual(true)
    expect(getDeliveredMessageCount()).toEqual(before + 1)
  })
})
