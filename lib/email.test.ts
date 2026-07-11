import { beforeEach, describe, expect, it, vi } from 'vitest'

const sendMock = vi.fn()

vi.mock('@/lib/resend', () => ({
  getResendClient: () => ({ emails: { send: sendMock } }),
}))

import { sendPasswordResetEmail, sendVerificationEmail } from './email'

describe('email', () => {
  beforeEach(() => {
    sendMock.mockReset()
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
    process.env.EMAIL_FROM = 'test@example.com'
  })

  it('sendPasswordResetEmail includes the reset link with the raw token', async () => {
    await sendPasswordResetEmail('user@example.com', 'raw-token-abc')

    expect(sendMock).toHaveBeenCalledTimes(1)
    const [args] = sendMock.mock.calls[0]
    expect(args.to).toBe('user@example.com')
    expect(args.from).toBe('test@example.com')
    expect(args.html).toContain('http://localhost:3000/reset-password?token=raw-token-abc')
  })

  it('sendVerificationEmail includes the verify link with the raw token', async () => {
    await sendVerificationEmail('user@example.com', 'raw-token-xyz')

    expect(sendMock).toHaveBeenCalledTimes(1)
    const [args] = sendMock.mock.calls[0]
    expect(args.to).toBe('user@example.com')
    expect(args.html).toContain('http://localhost:3000/verify-email?token=raw-token-xyz')
  })
})
