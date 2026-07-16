import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClientIp, hashToken } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(
      new URL("/verify-email?error=missing", request.url)
    );
  }

  const tokenHash = hashToken(token);
  const user = await prisma.user.findFirst({
    where: {
      emailVerifyToken: tokenHash,
      emailVerifyExpires: { gt: new Date() },
    },
  });

  if (!user) {
    return NextResponse.redirect(
      new URL("/verify-email?error=invalid", request.url)
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: new Date(),
      emailVerifyToken: null,
      emailVerifyExpires: null,
    },
  });

  await writeAuditLog({
    action: "EMAIL_VERIFIED",
    userId: user.id,
    ip: getClientIp(request),
    userAgent: request.headers.get("user-agent"),
  });

  return NextResponse.redirect(
    new URL("/verify-email?success=1", request.url)
  );
}
