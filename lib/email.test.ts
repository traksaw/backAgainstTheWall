import { beforeEach, describe, expect, it, vi } from 'vitest'

const sendMock = vi.fn()

vi.mock('@/lib/resend', () => ({
  getResendClient: () => ({ emails: { send: sendMock } }),
}))

import { sendPasswordResetEmail, sendVerificationEmail } from './email'

describe('email', () => {
  beforeEach(() => {
    sendMock.mockReset()
    sendMock.mockResolvedValue({ data: { id: 'email-id' }, error: null })
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

  // WAS-32 lesson (found via manual smoke test): the Resend SDK resolves to
  // { data, error } rather than throwing on API-level failures (rate limits,
  // sandbox recipient restrictions, an unverified domain). Silently ignoring
  // `error` means a rejected send looks identical to a successful one to
  // every caller - AuthService's try/catch never fires, nothing is logged,
  // and the user never finds out their email didn't arrive.
  it('sendPasswordResetEmail throws when Resend reports an error', async () => {
    sendMock.mockResolvedValue({ data: null, error: { message: 'You can only send testing emails to your own email address' } })

    await expect(sendPasswordResetEmail('user@example.com', 'raw-token-abc')).rejects.toThrow(
      /You can only send testing emails/
    )
  })

  it('sendVerificationEmail throws when Resend reports an error', async () => {
    sendMock.mockResolvedValue({ data: null, error: { message: 'You can only send testing emails to your own email address' } })

    await expect(sendVerificationEmail('user@example.com', 'raw-token-xyz')).rejects.toThrow(
      /You can only send testing emails/
    )
  })
})
