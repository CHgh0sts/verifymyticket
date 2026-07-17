import { prisma } from "@/lib/prisma";
import { assertSameOrigin, requireAuth } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";

export async function POST(request) {
  if (!assertSameOrigin(request)) {
    return jsonError("Origine non autorisée", 403);
  }
  const { session, error } = await requireAuth();
  if (error) return error;

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("JSON invalide");
  }

  const endpoint = body?.endpoint;
  const p256dh = body?.keys?.p256dh;
  const auth = body?.keys?.auth;
  if (!endpoint || !p256dh || !auth) {
    return jsonError("Subscription invalide");
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: {
      userId: session.userId,
      endpoint,
      p256dh,
      auth,
    },
    update: {
      userId: session.userId,
      p256dh,
      auth,
    },
  });

  return jsonOk({ message: "Notifications activées" });
}

export async function DELETE(request) {
  if (!assertSameOrigin(request)) {
    return jsonError("Origine non autorisée", 403);
  }
  const { session, error } = await requireAuth();
  if (error) return error;

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("JSON invalide");
  }

  if (body?.endpoint) {
    await prisma.pushSubscription.deleteMany({
      where: { userId: session.userId, endpoint: body.endpoint },
    });
  } else {
    await prisma.pushSubscription.deleteMany({
      where: { userId: session.userId },
    });
  }
  return jsonOk({ message: "Notifications désactivées" });
}
