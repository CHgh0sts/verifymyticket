"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatCard, RiskBadge } from "@/components/ui";
import { useLocale } from "@/components/LocaleProvider";

export default function DashboardPage() {
  const { t } = useLocale();
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
    return <p className="text-[var(--text-muted)]">{t("common.loading")}</p>;
  }

  const recent = data.tickets.slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          {t("dash.hello")}, {profile.username}
        </h1>
        <p className="mt-1 text-[var(--text-muted)]">{t("dash.overviewHint")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={t("dash.total")} value={data.stats.total} />
        <StatCard label={t("dash.clean")} value={data.stats.clean} hint={t("dash.riskLow")} />
        <StatCard
          label={t("dash.dupes")}
          value={data.stats.duplicates}
          hint={t("dash.riskMedium")}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/dashboard/tickets/new" className="btn btn-primary">
          {t("dash.addTicket")}
        </Link>
        <Link href="/dashboard/tickets" className="btn btn-secondary">
          {t("dash.seeAll")}
        </Link>
      </div>

      <section>
        <h2 className="text-lg font-semibold">{t("dash.recent")}</h2>
        {recent.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--text-muted)]">{t("dash.noTickets")}</p>
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
