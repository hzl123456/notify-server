import { describe, expect, it, vi } from 'vitest'
import main from '../src/libs/LoveMsg'

describe('message dispatch', () => {
  it('reads MESSAGE_TYPE for each invocation and waits for completion', async () => {
    const previous = process.env.MESSAGE_TYPE
    let completed = false
    const handler = async () => {
      await Promise.resolve()
      completed = true
    }
    const handlers = {
      goodMorning: vi.fn(handler),
      goodAfternoon: vi.fn(handler),
      goodEvening: vi.fn(handler),
      birthday: vi.fn(handler),
    }
    try {
      for (const [type, mockedHandler] of Object.entries(handlers)) {
        process.env.MESSAGE_TYPE = type
        completed = false
        await main(handlers)
        expect(completed).toEqual(true)
        expect(mockedHandler).toHaveBeenCalledTimes(1)
      }
    } finally {
      if (previous === undefined) delete process.env.MESSAGE_TYPE
      else process.env.MESSAGE_TYPE = previous
    }
  })

  it('rejects unknown message types instead of sending birthday reminders', async () => {
    const previous = process.env.MESSAGE_TYPE
    try {
      process.env.MESSAGE_TYPE = 'unknown'
      let message = ''
      try {
        await main()
      } catch (error) {
        message = (error as Error).message
      }
      expect(message).toContain('MESSAGE_TYPE')
    } finally {
      if (previous === undefined) delete process.env.MESSAGE_TYPE
      else process.env.MESSAGE_TYPE = previous
    }
  })
})
