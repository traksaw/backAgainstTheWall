import { getResendClient } from "@/lib/resend"

const getAppUrl = (): string => {
  const url = process.env.NEXT_PUBLIC_APP_URL
  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_APP_URL environment variable is not defined. Please add it to your .env.local file."
    )
  }
  return url
}

const getFromAddress = (): string => {
  const from = process.env.EMAIL_FROM
  if (!from) {
    throw new Error(
      "EMAIL_FROM environment variable is not defined. Please add it to your .env.local file."
    )
  }
  return from
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const link = `${getAppUrl()}/reset-password?token=${token}`
  // WAS-32: the Resend SDK resolves to { data, error } instead of throwing
  // on API-level failures (rate limits, sandbox recipient restrictions, an
  // unverified domain) - ignoring `error` would make a rejected send look
  // identical to a successful one to every caller.
  const { error } = await getResendClient().emails.send({
    from: getFromAddress(),
    to,
    subject: "Reset your password",
    html: `<p>Click the link below to reset your password. This link expires in 1 hour and can only be used once.</p><p><a href="${link}">${link}</a></p><p>If you didn't request this, you can safely ignore this email.</p>`,
  })
  if (error) {
    throw new Error(error.message)
  }
}

export async function sendVerificationEmail(to: string, token: string) {
  const link = `${getAppUrl()}/verify-email?token=${token}`
  const { error } = await getResendClient().emails.send({
    from: getFromAddress(),
    to,
    subject: "Verify your email",
    html: `<p>Click the link below to verify your email address. This link expires in 24 hours and can only be used once.</p><p><a href="${link}">${link}</a></p>`,
  })
  if (error) {
    throw new Error(error.message)
  }
}
