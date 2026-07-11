
// WAS-32: shared pattern for any short-lived, single-use token flow
// (password reset, email verification, and future flows like invite
// links) - generate random bytes, send the raw token to the user (email
// link), store only a SHA-256 hash of it on the record being verified.
// Lookups happen by hash, so a leaked database read never exposes a token
// an attacker could replay.

import crypto from "crypto"

export function generateToken(): { token: string; tokenHash: string } {
  const token = crypto.randomBytes(32).toString("base64url")
  return { token, tokenHash: hashToken(token) }
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex")
}
