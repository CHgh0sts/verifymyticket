"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Alert } from "@/components/ui";

function daysUntil(date) {
  if (!date) return null;
  const diff = new Date(date).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function EventsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/events/mine")
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Erreur");
        setData(json);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-[var(--danger)]">{error}</p>;
  if (!data) return <p className="text-[var(--text-muted)]">Chargement…</p>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Mes événements</h1>
        <p className="mt-1 text-[var(--text-muted)]">
          Billets et veilles regroupés par date. Rappels email J-7 et J-1
          (cron serveur).
        </p>
      </div>

      <Alert type="info">
        Les rappels J-7 / J-1 sont envoyés par le script{" "}
        <code className="text-xs">npm run reminders</code> (à planifier en cron).
      </Alert>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">À venir ({data.upcoming.length})</h2>
        {data.upcoming.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">Aucun événement à venir.</p>
        ) : (
          <ul className="space-y-3">
            {data.upcoming.map((e) => {
              const d = daysUntil(e.eventDate);
              return (
                <li key={e.key} className="card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-medium">{e.eventName}</h3>
                      <p className="mt-1 text-sm text-[var(--text-muted)]">
                        {[e.venue, e.city].filter(Boolean).join(" · ")}
                        {e.eventDate
                          ? ` · ${new Date(e.eventDate).toLocaleString("fr-FR")}`
                          : ""}
                      </p>
                      <p className="mt-2 text-xs text-[var(--text-muted)]">
                        {e.tickets.length} billet{e.tickets.length !== 1 ? "s" : ""}
                        {" · "}
                        {e.watches.length} veille{e.watches.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    {d != null && (
                      <span className="rounded bg-[var(--accent-soft)] px-2 py-1 text-xs text-[var(--accent)]">
                        {d <= 0 ? "Aujourd’hui" : `J-${d}`}
                      </span>
                    )}
                  </div>
                  {e.tickets[0] && (
                    <Link
                      href={`/dashboard/tickets/${e.tickets[0].id}`}
                      className="mt-3 inline-block text-sm text-[var(--accent)] hover:underline"
                    >
                      Voir le billet →
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {data.past.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Passés</h2>
          <ul className="space-y-2">
            {data.past.map((e) => (
              <li key={e.key} className="text-sm text-[var(--text-muted)]">
                {e.eventName}
                {e.eventDate
                  ? ` · ${new Date(e.eventDate).toLocaleDateString("fr-FR")}`
                  : ""}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
