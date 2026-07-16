"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RiskBadge } from "@/components/ui";

export default function DuplicatesPage() {
  const [tickets, setTickets] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/tickets")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setTickets(data.tickets.filter((t) => t.detectedDuplicate));
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-[var(--danger)]">{error}</p>;
  if (!tickets) return <p className="text-[var(--text-muted)]">Chargement…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Doublons détectés</h1>
        <p className="mt-1 text-[var(--text-muted)]">
          Billets déjà enregistrés par un autre utilisateur.
        </p>
      </div>

      {tickets.length === 0 ? (
        <div className="card p-8 text-center text-[var(--text-muted)]">
          Aucun doublon pour le moment.{" "}
          <Link href="/dashboard/tickets" className="text-[var(--accent)] hover:underline">
            Voir mes billets
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {tickets.map((t) => (
            <li key={t.id} className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-medium">{t.eventName}</h2>
                  <p className="text-sm text-[var(--text-muted)]">
                    {t.platform} · enregistré le{" "}
                    {new Date(t.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <RiskBadge
                  level={t.duplicateCount >= 2 ? "high" : "medium"}
                  label={t.duplicateCount >= 2 ? "Risque élevé" : "Prudence"}
                  emoji={t.duplicateCount >= 2 ? "🔴" : "🟠"}
                  duplicateCount={t.duplicateCount}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
