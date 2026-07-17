import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashToken, clearSessionCookie } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { appUrl } from "@/lib/email";
import { jsonError } from "@/lib/api";

export async function GET(request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) return jsonError("Token manquant", 400);

  const tokenHash = hashToken(token);
  const user = await prisma.user.findFirst({
    where: {
      deleteAccountToken: tokenHash,
      deleteAccountExpires: { gt: new Date() },
    },
  });

  if (!user) {
    return NextResponse.redirect(
      new URL("/dashboard/profile?delete=invalid", appUrl())
    );
  }

  const userId = user.id;

  await prisma.user.delete({ where: { id: userId } });

  await writeAuditLog({
    action: "ACCOUNT_DELETED",
    userId: null,
    meta: { formerUserId: userId },
  });

  const response = NextResponse.redirect(new URL("/?deleted=1", appUrl()));
  return clearSessionCookie(response);
}
