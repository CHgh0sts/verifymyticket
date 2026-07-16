import { SignJWT, jwtVerify } from "jose";

export const COOKIE_NAME = "vmt_session";
const TOKEN_TTL = "7d";

export function getJwtSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET manquant ou trop court (min 32 caractères)");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload) {
  return new SignJWT({
    sub: payload.userId,
    email: payload.email,
    username: payload.username,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(getJwtSecretKey());
}

export async function verifySessionToken(token) {
  const { payload } = await jwtVerify(token, getJwtSecretKey());
  return {
    userId: payload.sub,
    email: payload.email,
    username: payload.username,
  };
}

export function setSessionCookie(response, token) {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}

export function clearSessionCookie(response) {
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
