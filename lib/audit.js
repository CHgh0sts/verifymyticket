import { prisma } from "./prisma";

export async function writeAuditLog({ action, userId, ip, userAgent, meta }) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        userId: userId || null,
        ip: ip || null,
        userAgent: userAgent || null,
        meta: meta || undefined,
      },
    });
  } catch (err) {
    console.error("[audit]", action, err.message);
  }
}

export async function recordLoginAttempt({ email, ip, success, userId }) {
  try {
    await prisma.loginAttempt.create({
      data: {
        email: email.toLowerCase(),
        ip: ip || null,
        success,
        userId: userId || null,
      },
    });
  } catch (err) {
    console.error("[login-attempt]", err.message);
  }
}

/** Returns true if the account/IP should be locked out. */
export async function isLoginLocked(email, ip) {
  const since = new Date(Date.now() - 15 * 60 * 1000);
  const emailFails = await prisma.loginAttempt.count({
    where: {
      email: email.toLowerCase(),
      success: false,
      createdAt: { gte: since },
    },
  });
  if (emailFails >= 5) return true;

  if (ip && ip !== "unknown") {
    const ipFails = await prisma.loginAttempt.count({
      where: {
        ip,
        success: false,
        createdAt: { gte: since },
      },
    });
    if (ipFails >= 15) return true;
  }
  return false;
}
