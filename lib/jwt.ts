import jwt, { SignOptions } from "jsonwebtoken";
import type { NextRequest } from "next/server";

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

  try {
    const decoded = verifyToken(token);
    return decoded.userId;
  } catch (error) {
    console.error("Invalid token:", error);
    return null;
  }
}



