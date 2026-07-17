import { prisma } from "@/lib/prisma";
import { sendCheckWatchAlertEmail } from "@/lib/email";

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
    },
    update: {
      userId: userId || undefined,
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
      watches: { select: { email: true } },
    },
  });
  if (!sighting) return { sent: 0 };

  const exclude = excludeEmail ? String(excludeEmail).toLowerCase().trim() : "";
  const recipients = [
    ...new Set(
      sighting.watches
        .map((w) => w.email.toLowerCase().trim())
        .filter((e) => e && e !== exclude)
    ),
  ];

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
  for (const email of recipients) {
    try {
      await sendCheckWatchAlertEmail(email, {
        eventLabel,
        reason,
        statusLabel,
      });
      sent += 1;
    } catch (err) {
      console.error("[check-watch] envoi échoué", email, err?.message || err);
    }
  }

  return { sent };
}
