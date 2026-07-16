import { prisma } from "@/lib/prisma";
import { assertSameOrigin, getClientIp, requireAuth } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { jsonError, jsonOk } from "@/lib/api";

export async function GET(_request, { params }) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const ticket = await prisma.ticket.findFirst({
    where: { id, ownerId: session.userId },
  });

  if (!ticket) return jsonError("Billet introuvable", 404);

  return jsonOk({
    ticket: {
      id: ticket.id,
      category: ticket.category,
      eventName: ticket.eventName,
      venue: ticket.venue,
      city: ticket.city,
      eventDate: ticket.eventDate,
      organizer: ticket.organizer,
      platform: ticket.platform,
      orderNumber: ticket.orderNumber,
      seat: ticket.seat,
      row: ticket.row,
      block: ticket.block,
      ticketCategory: ticket.ticketCategory,
      purchaserName: ticket.purchaserName,
      purchasePrice:
        ticket.purchasePrice != null ? Number(ticket.purchasePrice) : null,
      purchaseDate: ticket.purchaseDate,
      barcodeLastDigits: ticket.barcodeLastDigits,
      barcodeType: ticket.barcodeType,
      detectedDuplicate: ticket.detectedDuplicate,
      duplicateCount: ticket.duplicateCount,
      createdAt: ticket.createdAt,
    },
  });
}

export async function DELETE(request, { params }) {
  if (!assertSameOrigin(request)) {
    return jsonError("Origine non autorisée", 403);
  }

  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const ticket = await prisma.ticket.findFirst({
    where: { id, ownerId: session.userId },
  });

  if (!ticket) return jsonError("Billet introuvable", 404);

  await prisma.ticket.delete({ where: { id: ticket.id } });

  await writeAuditLog({
    action: "TICKET_DELETE",
    userId: session.userId,
    ip: getClientIp(request),
    userAgent: request.headers.get("user-agent"),
    meta: { ticketId: id },
  });

  return jsonOk({ message: "Billet supprimé" });
}
