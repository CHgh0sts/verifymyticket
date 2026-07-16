import { NextResponse } from "next/server";
import { COOKIE_NAME, verifySessionToken } from "./lib/session";

async function getUserFromRequest(request) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

function assertCsrf(request) {
  const method = request.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return true;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) return process.env.NODE_ENV !== "production";

  let allowedHost;
  try {
    allowedHost = new URL(appUrl).host;
  } catch {
    return false;
  }

  const origin = request.headers.get("origin");
  if (origin) {
    try {
      return new URL(origin).host === allowedHost;
    } catch {
      return false;
    }
  }

  const referer = request.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).host === allowedHost;
    } catch {
      return false;
    }
  }

  return process.env.NODE_ENV !== "production";
}

function isDashboardPath(pathname) {
  return pathname.startsWith("/dashboard");
}

function isProtectedApi(pathname) {
  return pathname.startsWith("/api/tickets") || pathname.startsWith("/api/profile");
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/") && !assertCsrf(request)) {
    return NextResponse.json({ error: "Origine non autorisée" }, { status: 403 });
  }

  if (isDashboardPath(pathname) || isProtectedApi(pathname)) {
    const user = await getUserFromRequest(request);
    if (!user) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
      }
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (pathname === "/login" || pathname === "/register") {
    const user = await getUserFromRequest(request);
    if (user) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/tickets/:path*",
    "/api/profile/:path*",
    "/api/auth/:path*",
    "/api/check",
    "/login",
    "/register",
  ],
};
