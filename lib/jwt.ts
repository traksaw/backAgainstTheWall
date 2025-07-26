import jwt, { SignOptions } from "jsonwebtoken"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"

const JWT_SECRET = process.env.JWT_SECRET || "changeme-in-production"

interface JwtPayload {
  userId: string
}

export function signToken(payload: JwtPayload, options?: SignOptions): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "7d",
    ...options,
  })
}


export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload
  } catch {
    return null
  }
}

export async function verifyTokenAsync(token: string): Promise<{ userId: string }> {
  return new Promise((resolve, reject) => {
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err || !decoded) return reject(err)
      resolve(decoded as { userId: string })
    })
  })
}

// ✅ Updated: get token from cookies on the request
export async function getUserIdFromRequest(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get("token")?.value
  if (!token) return null

  try {
    const decoded = await verifyTokenAsync(token)
    return decoded.userId
  } catch {
    return null
  }
}


