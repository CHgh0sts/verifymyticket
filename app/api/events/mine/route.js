import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";

function eventKey(name, date) {
  const d = date ? new Date(date).toISOString().slice(0, 10) : "unknown";
  return `${(name || "").toLowerCase().trim()}|${d}`;
}

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  const [tickets, watches] = await Promise.all([
    prisma.ticket.findMany({
      where: { ownerId: session.userId },
      orderBy: { eventDate: "asc" },
    }),
    prisma.checkWatch.findMany({
      where: {
        OR: [{ userId: session.userId }, { email: session.email.toLowerCase() }],
        active: true,
      },
      include: { sighting: true },
    }),
  ]);

  const map = new Map();

  for (const t of tickets) {
    const key = eventKey(t.eventName, t.eventDate);
    if (!map.has(key)) {
      map.set(key, {
        key,
        eventName: t.eventName,
        venue: t.venue,
        city: t.city,
        eventDate: t.eventDate,
        tickets: [],
        watches: [],
      });
    }
    map.get(key).tickets.push({
      id: t.id,
      platform: t.platform,
      detectedDuplicate: t.detectedDuplicate,
    });
  }

  for (const w of watches) {
    const s = w.sighting;
    if (!s) continue;
    const key = eventKey(s.eventName, s.eventDate);
    if (!map.has(key)) {
      map.set(key, {
        key,
        eventName: s.eventName,
        venue: s.venue,
        city: s.city,
        eventDate: s.eventDate,
        tickets: [],
        watches: [],
      });
    }
    map.get(key).watches.push({
      id: w.id,
      unreadCount: w.unreadCount,
      purchaseStatus: s.purchaseStatus,
    });
  }

  const events = Array.from(map.values()).sort((a, b) => {
    if (!a.eventDate) return 1;
    if (!b.eventDate) return -1;
    return new Date(a.eventDate) - new Date(b.eventDate);
  });

  const now = Date.now();
  const upcoming = events.filter(
    (e) => e.eventDate && new Date(e.eventDate).getTime() >= now - 24 * 60 * 60 * 1000
  );
  const past = events.filter(
    (e) => !e.eventDate || new Date(e.eventDate).getTime() < now - 24 * 60 * 60 * 1000
  );

  return jsonOk({ upcoming, past, total: events.length });
}
