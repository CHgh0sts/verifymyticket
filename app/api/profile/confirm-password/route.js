import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClientIp, hashToken } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

export async function GET(request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(
      new URL("/confirm-password-change?error=missing", request.url)
    );
  }

  const tokenHash = hashToken(token);
  const user = await prisma.user.findFirst({
    where: {
      passwordChangeToken: tokenHash,
      passwordChangeExpires: { gt: new Date() },
      pendingPasswordHash: { not: null },
    },
  });

  if (!user || !user.pendingPasswordHash) {
    return NextResponse.redirect(
      new URL("/confirm-password-change?error=invalid", request.url)
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: user.pendingPasswordHash,
      pendingPasswordHash: null,
      passwordChangeToken: null,
      passwordChangeExpires: null,
    },
  });

  await writeAuditLog({
    action: "PASSWORD_CHANGE_CONFIRMED",
    userId: user.id,
    ip: getClientIp(request),
    userAgent: request.headers.get("user-agent"),
  });

  return NextResponse.redirect(
    new URL("/confirm-password-change?success=1", request.url)
  );
}
