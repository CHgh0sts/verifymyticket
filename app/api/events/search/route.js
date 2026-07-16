import { searchEuropeEvents, groupEventsByAttraction } from "@/lib/events";
import { rateLimitCheck } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";

export async function GET(request) {
  const ip = getClientIp(request);
  const rl = await rateLimitCheck(ip);
  if (!rl.success) {
    return jsonError("Trop de recherches. Réessayez plus tard.", 429);
  }

  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("q") || searchParams.get("keyword") || "";
  const city = searchParams.get("city") || "";
  const countryCode = searchParams.get("country") || "";

  if (keyword.trim().length < 2) {
    return jsonError("Indiquez au moins 2 caractères (ex. BTS, Coldplay…)", 400);
  }

  try {
    const result = await searchEuropeEvents({ keyword, city, countryCode });
    const groups = groupEventsByAttraction(result.events);

    return jsonOk({
      keyword,
      city: city || null,
      count: result.events.length,
      demo: result.demo,
      source: result.source,
      message: result.message || null,
      events: result.events,
      groups,
    });
  } catch (err) {
    console.error("[events/search]", err.message);
    return jsonError("Impossible de récupérer les événements", 502);
  }
}
