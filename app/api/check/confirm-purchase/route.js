import { prisma } from "@/lib/prisma";
import { assertSameOrigin, getClientIp } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { notifySightingWatchers } from "@/lib/check-watch";
import { confirmPurchaseSchema } from "@/lib/validations";
import { jsonError, jsonOk, jsonZodError } from "@/lib/api";

export async function POST(request) {
  if (!assertSameOrigin(request)) {
    return jsonError("Origine non autorisée", 403);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("JSON invalide");
  }

  const parsed = confirmPurchaseSchema.safeParse(body);
  if (!parsed.success) return jsonZodError(parsed.error);

  const sighting = await prisma.codeSighting.findUnique({
    where: { id: parsed.data.sightingId },
  });
  if (!sighting) return jsonError("Vérification introuvable", 404);

  if (
    (sighting.purchaseStatus === "owned" || sighting.purchaseStatus === "claimed") &&
    !parsed.data.purchased
  ) {
    return jsonOk({
      purchaseStatus: sighting.purchaseStatus,
      message: "Ce billet est déjà marqué comme acheté.",
    });
  }

  const purchaseStatus = parsed.data.purchased ? "claimed" : "watching";
  const wasAlreadyPurchased =
    sighting.purchaseStatus === "owned" || sighting.purchaseStatus === "claimed";

  const updated = await prisma.codeSighting.update({
    where: { id: sighting.id },
    data: { purchaseStatus },
  });

  if (parsed.data.purchased && !wasAlreadyPurchased) {
    await notifySightingWatchers({
      sightingId: updated.id,
      excludeEmail: parsed.data.alertEmail || null,
      reason:
        "Quelqu'un a confirmé l'achat d'un billet correspondant à votre vérification.",
      purchaseStatus: "claimed",
    });
  }

  await writeAuditLog({
    action: parsed.data.purchased ? "CHECK_PURCHASE_CLAIMED" : "CHECK_PURCHASE_DECLINED",
    ip: getClientIp(request),
    userAgent: request.headers.get("user-agent"),
    meta: {
      sightingId: updated.id,
      purchaseStatus: updated.purchaseStatus,
    },
  });

  return jsonOk({
    purchaseStatus: updated.purchaseStatus,
    message: parsed.data.purchased
      ? "Merci. Ce billet est maintenant compté comme acheté."
      : "OK. On garde cette vérification en mémoire sans la marquer comme achetée.",
  });
}
