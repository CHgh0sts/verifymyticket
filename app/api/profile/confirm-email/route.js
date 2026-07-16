import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClientIp, hashToken } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

export async function GET(request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(
      new URL("/confirm-email-change?error=missing", request.url)
    );
  }

  const tokenHash = hashToken(token);
  const user = await prisma.user.findFirst({
    where: {
      emailChangeToken: tokenHash,
      emailChangeExpires: { gt: new Date() },
      pendingEmail: { not: null },
    },
  });

  if (!user || !user.pendingEmail) {
    return NextResponse.redirect(
      new URL("/confirm-email-change?error=invalid", request.url)
    );
  }

  const taken = await prisma.user.findFirst({
    where: {
      email: user.pendingEmail,
      NOT: { id: user.id },
    },
  });
  if (taken) {
    return NextResponse.redirect(
      new URL("/confirm-email-change?error=taken", request.url)
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      email: user.pendingEmail,
      emailVerified: new Date(),
      pendingEmail: null,
      emailChangeToken: null,
      emailChangeExpires: null,
    },
  });

  await writeAuditLog({
    action: "EMAIL_CHANGE_CONFIRMED",
    userId: user.id,
    ip: getClientIp(request),
    userAgent: request.headers.get("user-agent"),
    meta: { email: user.pendingEmail },
  });

  return NextResponse.redirect(
    new URL("/confirm-email-change?success=1", request.url)
  );
}
