import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { appUrl } from "@/lib/email";
import { googleConfigured, OAUTH_STATE_COOKIE } from "@/lib/google-oauth";

export async function GET() {
  if (!googleConfigured()) {
    return NextResponse.redirect(
      new URL("/login?error=google_not_configured", appUrl())
    );
  }

  const state = randomBytes(16).toString("hex");
  const redirectUri = `${appUrl()}/api/auth/google/callback`;
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });

  const response = NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params}`
  );
  response.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
  return response;
}
