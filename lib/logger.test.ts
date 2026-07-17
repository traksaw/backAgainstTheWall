import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const captureExceptionMock = vi.fn()
vi.mock('@sentry/nextjs', () => ({
  captureException: (...args: unknown[]) => captureExceptionMock(...args),
}))

import { isProductionEnvironment, logger } from './logger'

describe('isProductionEnvironment', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('is true when VERCEL_ENV is production', () => {
    vi.stubEnv('VERCEL_ENV', 'production')
    vi.stubEnv('NODE_ENV', 'development')

    expect(isProductionEnvironment()).toBe(true)
  })

  it('is false on a Vercel preview deploy even though NODE_ENV is production there', () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    vi.stubEnv('NODE_ENV', 'production')

    expect(isProductionEnvironment()).toBe(false)
  })

  it('falls back to NODE_ENV when VERCEL_ENV is unset (local dev/CI)', () => {
    vi.stubEnv('VERCEL_ENV', undefined)
    vi.stubEnv('NODE_ENV', 'production')

    expect(isProductionEnvironment()).toBe(true)
  })
})

describe('logger.error', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    captureExceptionMock.mockReset()
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    errorSpy.mockRestore()
    vi.unstubAllEnvs()
  })

  it('strips submitted values from a Mongoose ValidationError before sending to Sentry', () => {
    const validationError = Object.assign(
      new Error("`bogus-archetype` is not a valid enum value for path `archetype`."),
      {
        name: 'ValidationError',
        errors: {
          archetype: { message: '`bogus-archetype` is not a valid enum value for path `archetype`.' },
        },
      }
    )

    logger.error('quiz submit failed:', validationError)

    expect(captureExceptionMock).toHaveBeenCalledTimes(1)
    const sentToSentry = captureExceptionMock.mock.calls[0][0] as Error
    expect(sentToSentry.message).not.toContain('bogus-archetype')
    expect(sentToSentry.message).toBe('Mongoose validation failed for field(s): archetype')
    expect(sentToSentry.name).toBe('ValidationError')
  })

  it('sends a plain Error to Sentry unchanged', () => {
    const plainError = new Error('ECONNREFUSED 127.0.0.1:27017')

    logger.error('quiz submit failed:', plainError)

    expect(captureExceptionMock).toHaveBeenCalledWith(plainError)
  })

  it('logs to the console outside production', () => {
    vi.stubEnv('VERCEL_ENV', undefined)
    vi.stubEnv('NODE_ENV', 'test')

    logger.error('context:', new Error('boom'))

    expect(errorSpy).toHaveBeenCalledTimes(1)
  })

  it('never logs to the console in production', () => {
    vi.stubEnv('VERCEL_ENV', 'production')

    logger.error('context:', new Error('boom'))

    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('still reports to Sentry when called with a message only (no err)', () => {
    logger.error('validation issue: missing field')

    expect(captureExceptionMock).toHaveBeenCalledTimes(1)
    const sentToSentry = captureExceptionMock.mock.calls[0][0] as Error
    expect(sentToSentry.message).toBe('validation issue: missing field')
  })
})

describe('logger.log/debug/warn', () => {
  beforeEach(() => {
    captureExceptionMock.mockReset()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('logs outside production and stays silent in production', () => {
    vi.stubEnv('VERCEL_ENV', undefined)
    vi.stubEnv('NODE_ENV', 'test')
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})

    logger.log('hello')
    logger.warn('careful')
    logger.debug('details')

    expect(logSpy).toHaveBeenCalledWith('hello')
    expect(warnSpy).toHaveBeenCalledWith('careful')
    expect(debugSpy).toHaveBeenCalledWith('details')

    vi.stubEnv('VERCEL_ENV', 'production')
    logSpy.mockClear()
    warnSpy.mockClear()
    debugSpy.mockClear()

    logger.log('hello')
    logger.warn('careful')
    logger.debug('details')

    expect(logSpy).not.toHaveBeenCalled()
    expect(warnSpy).not.toHaveBeenCalled()
    expect(debugSpy).not.toHaveBeenCalled()

    logSpy.mockRestore()
    warnSpy.mockRestore()
    debugSpy.mockRestore()
  })

  it('never call Sentry', () => {
    logger.log('hello')
    logger.warn('careful')
    logger.debug('details')

    expect(captureExceptionMock).not.toHaveBeenCalled()
  })
})
