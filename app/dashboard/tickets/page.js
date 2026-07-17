"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RiskBadge } from "@/components/ui";

export default function TicketsPage() {
  const [tickets, setTickets] = useState(null);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(null);

  async function load() {
    const res = await fetch("/api/tickets");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Erreur");
      return;
    }
    setTickets(data.tickets);
  }

  useEffect(() => {
    load().catch(() => setError("Erreur réseau"));
  }, []);

  async function remove(id) {
    if (!confirm("Supprimer ce billet ?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/tickets/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Suppression impossible");
        return;
      }
      await load();
    } finally {
      setDeleting(null);
    }
  }

  if (error) return <p className="text-[var(--danger)]">{error}</p>;
  if (!tickets) return <p className="text-[var(--text-muted)]">Chargement…</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Mes billets</h1>
          <p className="mt-1 text-[var(--text-muted)]">
            {tickets.length} billet{tickets.length !== 1 ? "s" : ""} enregistré
            {tickets.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/dashboard/tickets/new" className="btn btn-primary">
          Ajouter
        </Link>
      </div>

      {tickets.length === 0 ? (
        <div className="card p-8 text-center text-[var(--text-muted)]">
          Aucun billet.{" "}
          <Link href="/dashboard/tickets/new" className="text-[var(--accent)] hover:underline">
            Enregistrer le premier
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {tickets.map((t) => (
            <li key={t.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/dashboard/tickets/${t.id}`}
                    className="text-lg font-medium hover:text-[var(--accent)]"
                  >
                    {t.eventName}
                  </Link>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    {[t.venue, t.city, t.platform].filter(Boolean).join(" · ")}
                  </p>
                  {(t.block || t.row || t.seat) && (
                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                      {[
                        t.block && `Bloc ${t.block}`,
                        t.row && `Rang ${t.row}`,
                        t.seat && `Siège ${t.seat}`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}
                  <p className="mt-2 font-mono text-xs text-[var(--text-muted)]">
                    {t.barcodeType} · {t.barcodeLastDigits}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <RiskBadge
                    level={
                      t.detectedDuplicate
                        ? t.duplicateCount >= 2
                          ? "high"
                          : "medium"
                        : "low"
                    }
                    label={
                      t.detectedDuplicate
                        ? t.duplicateCount >= 2
                          ? "Risque élevé"
                          : "Prudence"
                        : "Risque faible"
                    }
                    emoji={
                      t.detectedDuplicate
                        ? t.duplicateCount >= 2
                          ? "🔴"
                          : "🟠"
                        : "🟢"
                    }
                    duplicateCount={t.detectedDuplicate ? t.duplicateCount : 0}
                  />
                  <Link
                    href={`/dashboard/tickets/${t.id}`}
                    className="btn btn-secondary !py-1.5 !px-3 text-sm"
                  >
                    Détail
                  </Link>
                  <button
                    type="button"
                    className="btn btn-danger !py-1.5 !px-3 text-sm"
                    disabled={deleting === t.id}
                    onClick={() => remove(t.id)}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
