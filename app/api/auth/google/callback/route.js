import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  createSessionToken,
  setSessionCookie,
  getClientIp,
} from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { appUrl } from "@/lib/email";
import { OAUTH_STATE_COOKIE, googleConfigured } from "@/lib/google-oauth";

function usernameFromEmail(email) {
  const base = email
    .split("@")[0]
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 24);
  return base || `user${Date.now().toString(36)}`;
}

async function uniqueUsername(base) {
  let candidate = base;
  let i = 0;
  while (await prisma.user.findUnique({ where: { username: candidate } })) {
    i += 1;
    candidate = `${base}${i}`.slice(0, 32);
  }
  return candidate;
}

export async function GET(request) {
  if (!googleConfigured()) {
    return NextResponse.redirect(
      new URL("/login?error=google_not_configured", appUrl())
    );
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieStore = await cookies();
  const expected = cookieStore.get(OAUTH_STATE_COOKIE)?.value;

  if (!code || !state || !expected || state !== expected) {
    return NextResponse.redirect(new URL("/login?error=oauth_state", appUrl()));
  }

  const redirectUri = `${appUrl()}/api/auth/google/callback`;
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL("/login?error=oauth_token", appUrl()));
  }

  const tokens = await tokenRes.json();
  const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!profileRes.ok) {
    return NextResponse.redirect(new URL("/login?error=oauth_profile", appUrl()));
  }

  const profile = await profileRes.json();
  const email = String(profile.email || "").toLowerCase().trim();
  const googleId = profile.sub;
  if (!email || !googleId) {
    return NextResponse.redirect(new URL("/login?error=oauth_email", appUrl()));
  }

  let user = await prisma.user.findFirst({
    where: { OR: [{ googleId }, { email }] },
  });

  if (user) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        googleId,
        emailVerified: user.emailVerified || new Date(),
      },
    });
  } else {
    const username = await uniqueUsername(usernameFromEmail(email));
    user = await prisma.user.create({
      data: {
        email,
        username,
        googleId,
        password: null,
        emailVerified: new Date(),
      },
    });
  }

  const sessionToken = await createSessionToken({
    userId: user.id,
    email: user.email,
    username: user.username,
  });

  await writeAuditLog({
    action: "LOGIN_GOOGLE",
    userId: user.id,
    ip: getClientIp(request),
    userAgent: request.headers.get("user-agent"),
  });

  const response = NextResponse.redirect(new URL("/dashboard", appUrl()));
  response.cookies.set(OAUTH_STATE_COOKIE, "", { path: "/", maxAge: 0 });
  return setSessionCookie(response, sessionToken);
}
