import { NextResponse } from "next/server";
import {
  assertSameOrigin,
  clearSessionCookie,
  getClientIp,
  getSession,
} from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { jsonError } from "@/lib/api";

export async function POST(request) {
  if (!assertSameOrigin(request)) {
    return jsonError("Origine non autorisée", 403);
  }

  const session = await getSession();
  if (session) {
    await writeAuditLog({
      action: "LOGOUT",
      userId: session.userId,
      ip: getClientIp(request),
      userAgent: request.headers.get("user-agent"),
    });
  }

  const response = NextResponse.json({ message: "Déconnexion réussie" });
  return clearSessionCookie(response);
}
