import { Resend } from "resend"

const getResendApiKey = (): string => {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    throw new Error(
      "RESEND_API_KEY environment variable is not defined. Please add it to your .env.local file."
    )
  }
  return key
}

let client: Resend | null = null

export function getResendClient(): Resend {
  if (!client) {
    client = new Resend(getResendApiKey())
  }
  return client
}
