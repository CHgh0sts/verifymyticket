import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "crypto";
import {
  COOKIE_NAME,
  clearSessionCookie,
  createSessionToken,
  setSessionCookie,
  verifySessionToken,
} from "./session";

export {
  COOKIE_NAME,
  clearSessionCookie,
  createSessionToken,
  setSessionCookie,
  verifySessionToken,
};

const BCRYPT_ROUNDS = 12;

export async function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function generateToken(bytes = 32) {
  return randomBytes(bytes).toString("hex");
}

export function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    return {
      session: null,
      error: NextResponse.json({ error: "Non authentifié" }, { status: 401 }),
    };
  }
  return { session, error: null };
}

export function assertSameOrigin(request) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) return true;

  const allowed = new URL(appUrl);
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      return new URL(origin).host === allowed.host;
    } catch {
      return false;
    }
  }

  const referer = request.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).host === allowed.host;
    } catch {
      return false;
    }
  }

  return process.env.NODE_ENV !== "production";
}

export function getClientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}
