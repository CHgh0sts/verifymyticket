import { prisma } from "@/lib/prisma";
import { sendCheckWatchAlertEmail } from "@/lib/email";
import { sendPushToUser } from "@/lib/push";

const STATUS_LABELS = {
  owned: "déjà acheté",
  claimed: "confirmé comme acheté",
  watching: "vérifié avant achat (non confirmé)",
};

export async function upsertCheckWatch({ sightingId, email, userId }) {
  if (!sightingId || !email) return null;
  const normalized = String(email).toLowerCase().trim();
  if (!normalized.includes("@")) return null;

  return prisma.checkWatch.upsert({
    where: {
      sightingId_email: {
        sightingId,
        email: normalized,
      },
    },
    create: {
      sightingId,
      email: normalized,
      userId: userId || null,
      active: true,
    },
    update: {
      userId: userId || undefined,
      active: true,
    },
  });
}

/**
 * Prévenir les autres abonnés d'un sighting (pas l'auteur de l'action).
 */
export async function notifySightingWatchers({
  sightingId,
  excludeEmail,
  reason,
  purchaseStatus,
}) {
  if (!sightingId) return { sent: 0 };

  const sighting = await prisma.codeSighting.findUnique({
    where: { id: sightingId },
    select: {
      eventName: true,
      venue: true,
      city: true,
      eventDate: true,
      watches: {
        where: { active: true },
        select: { id: true, email: true, userId: true },
      },
    },
  });
  if (!sighting) return { sent: 0 };

  const exclude = excludeEmail ? String(excludeEmail).toLowerCase().trim() : "";
  const watches = sighting.watches.filter(
    (w) => w.email.toLowerCase().trim() && w.email.toLowerCase().trim() !== exclude
  );

  const eventLabel = [
    sighting.eventName,
    sighting.city,
    sighting.venue,
    sighting.eventDate
      ? new Date(sighting.eventDate).toLocaleDateString("fr-FR")
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const statusLabel = purchaseStatus
    ? STATUS_LABELS[purchaseStatus] || purchaseStatus
    : null;

  let sent = 0;
  for (const watch of watches) {
    try {
      await sendCheckWatchAlertEmail(watch.email, {
        eventLabel,
        reason,
        statusLabel,
        watchId: watch.id,
      });

      await prisma.checkWatch.update({
        where: { id: watch.id },
        data: {
          unreadCount: { increment: 1 },
          lastNotifiedAt: new Date(),
        },
      });

      const notif = await prisma.watchNotification.create({
        data: {
          watchId: watch.id,
          userId: watch.userId || null,
          reason: reason || "Activité détectée",
          status: purchaseStatus || null,
        },
      });

      if (watch.userId) {
        await sendPushToUser(watch.userId, {
          title: "Alerte billet — VerifyMyTicket",
          body: reason || "Activité détectée sur un billet suivi",
          url: `/dashboard/alerts?watch=${watch.id}`,
          tag: `watch-${watch.id}`,
        }).catch(() => {});
      }

      void notif;
      sent += 1;
    } catch (err) {
      console.error("[check-watch] envoi échoué", watch.email, err?.message || err);
    }
  }

  return { sent };
}
