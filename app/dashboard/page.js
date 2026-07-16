"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatCard, RiskBadge } from "@/components/ui";

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/tickets").then((r) => r.json()),
      fetch("/api/profile").then((r) => r.json()),
    ])
      .then(([ticketsData, profileData]) => {
        if (ticketsData.error) throw new Error(ticketsData.error);
        if (profileData.error) throw new Error(profileData.error);
        setData(ticketsData);
        setProfile(profileData);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return <p className="text-[var(--danger)]">{error}</p>;
  }

  if (!data || !profile) {
    return <p className="text-[var(--text-muted)]">Chargement…</p>;
  }

  const recent = data.tickets.slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Bonjour, {profile.username}
        </h1>
        <p className="mt-1 text-[var(--text-muted)]">
          Tableau de bord — historique et statistiques de vos billets.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Billets enregistrés" value={data.stats.total} />
        <StatCard label="Sans doublon" value={data.stats.clean} hint="Risque faible" />
        <StatCard
          label="Doublons détectés"
          value={data.stats.duplicates}
          hint="À surveiller"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/dashboard/tickets/new" className="btn btn-primary">
          Enregistrer un billet
        </Link>
        <Link href="/dashboard/tickets" className="btn btn-secondary">
          Voir tous les billets
        </Link>
      </div>

      <section>
        <h2 className="text-lg font-semibold">Historique récent</h2>
        {recent.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--text-muted)]">
            Aucun billet pour le moment.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {recent.map((t) => (
              <li key={t.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-medium">{t.eventName}</p>
                  <p className="text-sm text-[var(--text-muted)]">
                    {t.platform}
                    {t.city ? ` · ${t.city}` : ""}
                    {" · "}
                    {new Date(t.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <RiskBadge
                  level={t.detectedDuplicate ? (t.duplicateCount >= 2 ? "high" : "medium") : "low"}
                  label={
                    t.detectedDuplicate
                      ? t.duplicateCount >= 2
                        ? "Risque élevé"
                        : "Prudence"
                      : "Risque faible"
                  }
                  emoji={t.detectedDuplicate ? (t.duplicateCount >= 2 ? "🔴" : "🟠") : "🟢"}
                  duplicateCount={t.detectedDuplicate ? t.duplicateCount : 0}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
