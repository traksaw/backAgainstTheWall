import jwt, { SignOptions } from "jsonwebtoken";
import type { NextRequest } from "next/server";
import connectDB from "@/lib/mongoose";
import User from "@/models/User";
import { logger } from "@/lib/logger";

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "JWT_SECRET environment variable is not defined. Please add it to your .env.local file."
    );
  }
  return secret;
};

interface JwtPayload {
  userId: string;
  // Set automatically by jsonwebtoken on every sign() call (seconds since
  // epoch) unless signToken is called with `noTimestamp: true` - used by
  // getUserIdFromRequest to detect tokens issued before a password reset.
  iat?: number;
}

export function signToken(payload: JwtPayload, options?: SignOptions): string {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: "7d",
    ...options,
  });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, getJwtSecret()) as JwtPayload;
}

export async function getUserIdFromRequest(
  req: NextRequest
): Promise<string | null> {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;

  let decoded: JwtPayload;
  try {
    decoded = verifyToken(token);
  } catch (error) {
    // An expired/tampered/logged-out token is routine, not a bug - don't
    // send it to Sentry, just keep it visible outside production.
    logger.warn("Invalid token:", error);
    return null;
  }

  // WAS-88: a JWT is otherwise valid until its 7-day expiry regardless of
  // what happens to the account in the meantime. Reject it if the account's
  // password was changed after this token was issued - the reset is what
  // actually invalidates any other still-live session.
  let user: { passwordChangedAt?: Date } | null;
  try {
    await connectDB();
    user = await User.findById(decoded.userId).select("passwordChangedAt").lean();
  } catch (error) {
    logger.error("Failed to look up user for token validation:", error);
    return null;
  }
  if (!user) return null;

  if (
    user.passwordChangedAt &&
    decoded.iat !== undefined &&
    decoded.iat * 1000 < user.passwordChangedAt.getTime()
  ) {
    return null;
  }

  return decoded.userId;
}
