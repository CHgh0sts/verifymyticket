/**
 * Recherche d'événements Europe via Ticketmaster Discovery API (gratuite).
 * https://developer.ticketmaster.com/
 *
 * Sans TICKETMASTER_API_KEY : données de démo pour tester le parcours.
 */

const EU_COUNTRIES = ["FR", "GB", "DE", "ES", "IT", "NL", "BE", "CH", "AT", "IE", "PT", "PL"];

const DEMO_EVENTS = [
  {
    id: "demo-bts-sdf-17",
    name: "BTS — World Tour",
    attraction: "BTS",
    date: "2026-07-17T20:00:00Z",
    dateLabel: "17/07/2026",
    timeLabel: "20:00",
    venue: "Stade de France",
    city: "Paris",
    country: "France",
    countryCode: "FR",
    url: "https://www.ticketmaster.fr",
    source: "demo",
  },
  {
    id: "demo-bts-sdf-18",
    name: "BTS — World Tour",
    attraction: "BTS",
    date: "2026-07-18T20:00:00Z",
    dateLabel: "18/07/2026",
    timeLabel: "20:00",
    venue: "Stade de France",
    city: "Paris",
    country: "France",
    countryCode: "FR",
    url: "https://www.ticketmaster.fr",
    source: "demo",
  },
  {
    id: "demo-coldplay-lyon",
    name: "Coldplay — Music of the Spheres",
    attraction: "Coldplay",
    date: "2026-08-02T19:30:00Z",
    dateLabel: "02/08/2026",
    timeLabel: "19:30",
    venue: "Groupama Stadium",
    city: "Lyon",
    country: "France",
    countryCode: "FR",
    url: "https://www.ticketmaster.fr",
    source: "demo",
  },
  {
    id: "demo-taylor-london",
    name: "Taylor Swift — The Eras Tour",
    attraction: "Taylor Swift",
    date: "2026-06-21T18:30:00Z",
    dateLabel: "21/06/2026",
    timeLabel: "18:30",
    venue: "Wembley Stadium",
    city: "London",
    country: "United Kingdom",
    countryCode: "GB",
    url: "https://www.ticketmaster.co.uk",
    source: "demo",
  },
  {
    id: "demo-daft-bercy",
    name: "Daft Punk — Tribute Night",
    attraction: "Daft Punk",
    date: "2026-09-12T21:00:00Z",
    dateLabel: "12/09/2026",
    timeLabel: "21:00",
    venue: "Accor Arena",
    city: "Paris",
    country: "France",
    countryCode: "FR",
    url: "https://www.ticketmaster.fr",
    source: "demo",
  },
  {
    id: "demo-olympics-paris",
    name: "Jeux Olympiques — Cérémonie",
    attraction: "Jeux Olympiques",
    date: "2026-07-24T20:00:00Z",
    dateLabel: "24/07/2026",
    timeLabel: "20:00",
    venue: "Stade de France",
    city: "Paris",
    country: "France",
    countryCode: "FR",
    url: "https://www.ticketmaster.fr",
    source: "demo",
  },
];

function formatDateFr(iso) {
  if (!iso) return { dateLabel: "Date à confirmer", timeLabel: null };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { dateLabel: "Date à confirmer", timeLabel: null };
  return {
    dateLabel: new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(d),
    timeLabel: new Intl.DateTimeFormat("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(d),
  };
}

function normalizeTmEvent(ev) {
  const venue = ev._embedded?.venues?.[0];
  const attraction =
    ev._embedded?.attractions?.[0]?.name ||
    ev.name?.split(" - ")[0] ||
    ev.name;
  const start = ev.dates?.start?.dateTime || ev.dates?.start?.localDate;
  const { dateLabel, timeLabel } = formatDateFr(start);

  return {
    id: ev.id,
    name: ev.name,
    attraction,
    date: start || null,
    dateLabel,
    timeLabel,
    venue: venue?.name || "Lieu à confirmer",
    city: venue?.city?.name || "",
    country: venue?.country?.name || "",
    countryCode: venue?.country?.countryCode || "",
    url: ev.url || null,
    source: "ticketmaster",
  };
}

function filterDemo(keyword, city) {
  const q = (keyword || "").toLowerCase().trim();
  const c = (city || "").toLowerCase().trim();
  return DEMO_EVENTS.filter((e) => {
    const hay = `${e.name} ${e.attraction} ${e.venue} ${e.city}`.toLowerCase();
    const matchQ = !q || hay.includes(q) || q.split(/\s+/).every((w) => hay.includes(w));
    const matchC = !c || e.city.toLowerCase().includes(c);
    return matchQ && matchC;
  });
}

async function fetchCountry(apikey, keyword, countryCode, city) {
  const params = new URLSearchParams({
    apikey,
    keyword,
    countryCode,
    size: "20",
    sort: "date,asc",
    classificationName: "music",
  });
  if (city) params.set("city", city);

  const res = await fetch(
    `https://app.ticketmaster.com/discovery/v2/events.json?${params}`,
    { next: { revalidate: 300 } }
  );

  if (!res.ok) return [];
  const data = await res.json();
  const events = data._embedded?.events || [];
  return events.map(normalizeTmEvent);
}

/**
 * Recherche d'événements en Europe.
 * @returns {{ events: Array, demo: boolean, source: string }}
 */
export async function searchEuropeEvents({ keyword, city, countryCode } = {}) {
  const q = String(keyword || "").trim();
  if (q.length < 2) {
    return { events: [], demo: false, source: "none", error: "Mot-clé trop court" };
  }

  const apikey = process.env.TICKETMASTER_API_KEY;

  if (!apikey) {
    const events = filterDemo(q, city);
    return {
      events,
      demo: true,
      source: "demo",
      message:
        "Mode démo : configurez TICKETMASTER_API_KEY pour les vrais événements Ticketmaster Europe.",
    };
  }

  const countries = countryCode
    ? [countryCode.toUpperCase()]
    : EU_COUNTRIES.slice(0, 7);

  const batches = await Promise.allSettled(
    countries.map((cc) => fetchCountry(apikey, q, cc, city))
  );

  const byId = new Map();
  for (const result of batches) {
    if (result.status !== "fulfilled") continue;
    for (const ev of result.value) {
      if (!byId.has(ev.id)) byId.set(ev.id, ev);
    }
  }

  let events = Array.from(byId.values());

  // Si Ticketmaster ne renvoie rien (quota / marché), fallback démo filtré
  if (events.length === 0) {
    const demo = filterDemo(q, city);
    if (demo.length > 0) {
      return {
        events: demo,
        demo: true,
        source: "demo-fallback",
        message: "Aucun résultat Ticketmaster — suggestions de démo affichées.",
      };
    }
  }

  events.sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(a.date) - new Date(b.date);
  });

  return {
    events: events.slice(0, 40),
    demo: false,
    source: "ticketmaster",
  };
}

/** Groupe les occurrences par attraction / nom pour l'UI. */
export function groupEventsByAttraction(events) {
  const groups = new Map();
  for (const ev of events) {
    const key = (ev.attraction || ev.name).trim();
    if (!groups.has(key)) {
      groups.set(key, { attraction: key, occurrences: [] });
    }
    groups.get(key).occurrences.push(ev);
  }
  return Array.from(groups.values());
}
