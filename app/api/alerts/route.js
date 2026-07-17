import { prisma } from "@/lib/prisma";
import { assertSameOrigin, requireAuth } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";

function serializeWatch(w) {
  return {
    id: w.id,
    email: w.email,
    active: w.active,
    unreadCount: w.unreadCount,
    lastNotifiedAt: w.lastNotifiedAt,
    createdAt: w.createdAt,
    sighting: w.sighting
      ? {
          id: w.sighting.id,
          eventName: w.sighting.eventName,
          venue: w.sighting.venue,
          city: w.sighting.city,
          eventDate: w.sighting.eventDate,
          purchaseStatus: w.sighting.purchaseStatus,
          checkCount: w.sighting.checkCount,
          mode: w.sighting.mode,
        }
      : null,
    recentNotifications: (w.notifications || []).map((n) => ({
      id: n.id,
      reason: n.reason,
      status: n.status,
      readAt: n.readAt,
      createdAt: n.createdAt,
    })),
  };
}

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  const watches = await prisma.checkWatch.findMany({
    where: {
      OR: [{ userId: session.userId }, { email: session.email.toLowerCase() }],
    },
    include: {
      sighting: true,
      notifications: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
    orderBy: [{ unreadCount: "desc" }, { updatedAt: "desc" }],
  });

  // Lier userId si manquant
  await Promise.all(
    watches
      .filter((w) => !w.userId)
      .map((w) =>
        prisma.checkWatch.update({
          where: { id: w.id },
          data: { userId: session.userId },
        })
      )
  );

  const unreadTotal = watches.reduce((sum, w) => sum + (w.unreadCount || 0), 0);

  return jsonOk({
    watches: watches.map(serializeWatch),
    unreadTotal,
  });
}

export async function PATCH(request) {
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

  const { watchId, action } = body || {};
  if (!action) {
    return jsonError("action requise");
  }

  if (action === "markAllRead") {
    const ids = (
      await prisma.checkWatch.findMany({
        where: {
          OR: [{ userId: session.userId }, { email: session.email.toLowerCase() }],
        },
        select: { id: true },
      })
    ).map((w) => w.id);

    if (ids.length === 0) return jsonOk({ message: "Rien à marquer" });

    await prisma.$transaction([
      prisma.checkWatch.updateMany({
        where: { id: { in: ids } },
        data: { unreadCount: 0 },
      }),
      prisma.watchNotification.updateMany({
        where: { watchId: { in: ids }, readAt: null },
        data: { readAt: new Date() },
      }),
    ]);
    return jsonOk({ message: "Tout marqué comme lu" });
  }

  if (!watchId) {
    return jsonError("watchId requis");
  }

  const watch = await prisma.checkWatch.findFirst({
    where: {
      id: watchId,
      OR: [{ userId: session.userId }, { email: session.email.toLowerCase() }],
    },
  });
  if (!watch) return jsonError("Veille introuvable", 404);

  if (action === "deactivate") {
    await prisma.checkWatch.update({
      where: { id: watch.id },
      data: { active: false },
    });
    return jsonOk({ message: "Veille désactivée", active: false });
  }

  if (action === "activate") {
    await prisma.checkWatch.update({
      where: { id: watch.id },
      data: { active: true },
    });
    return jsonOk({ message: "Veille réactivée", active: true });
  }

  if (action === "markRead") {
    await prisma.$transaction([
      prisma.checkWatch.update({
        where: { id: watch.id },
        data: { unreadCount: 0 },
      }),
      prisma.watchNotification.updateMany({
        where: { watchId: watch.id, readAt: null },
        data: { readAt: new Date() },
      }),
    ]);
    return jsonOk({ message: "Marqué comme lu" });
  }

  return jsonError("Action inconnue");
}
