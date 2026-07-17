"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Alert } from "@/components/ui";
import { useLocale } from "@/components/LocaleProvider";

function formatDate(d, locale) {
  if (!d) return "—";
  return new Date(d).toLocaleString(locale === "en" ? "en-GB" : "fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AlertsClient() {
  const { t, locale } = useLocale();
  const searchParams = useSearchParams();
  const highlight = searchParams.get("watch");
  const [watches, setWatches] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/alerts");
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || t("common.error"));
    setWatches(data.watches);
  }, [t]);

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [load]);

  async function act(watchId, action) {
    setBusy(`${watchId}-${action}`);
    try {
      const res = await fetch("/api/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ watchId, action }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || t("common.error"));
        return;
      }
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function markAll() {
    setBusy("all");
    try {
      await fetch("/api/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markAllRead" }),
      });
      await load();
    } finally {
      setBusy(null);
    }
  }

  if (error) return <p className="text-[var(--danger)]">{error}</p>;
  if (!watches) return <p className="text-[var(--text-muted)]">{t("common.loading")}</p>;

  const unread = watches.reduce((s, w) => s + (w.unreadCount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{t("dash.alertsTitle")}</h1>
          <p className="mt-1 text-[var(--text-muted)]">
            {t("dash.alertsHint")}
            {unread > 0
              ? ` · ${t(unread > 1 ? "dash.unreadPlural" : "dash.unread", { n: unread })}`
              : ""}
          </p>
        </div>
        {unread > 0 && (
          <button
            type="button"
            className="btn btn-secondary"
            disabled={busy === "all"}
            onClick={markAll}
          >
            {t("dash.markAllRead")}
          </button>
        )}
      </div>

      {watches.length === 0 ? (
        <div className="card p-8 text-center text-[var(--text-muted)]">
          {t("dash.noWatches")}{" "}
          <Link href="/check" className="text-[var(--accent)] hover:underline">
            {t("nav.checkTicket")}
          </Link>{" "}
          {t("dash.toCreateWatch")}
        </div>
      ) : (
        <ul className="space-y-4">
          {watches.map((w) => (
            <li
              key={w.id}
              id={`watch-${w.id}`}
              className={`card p-5 ${
                highlight === w.id ? "ring-2 ring-[var(--accent)]" : ""
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-medium">
                      {w.sighting?.eventName || "—"}
                    </h2>
                    {!w.active && (
                      <span className="rounded bg-[var(--bg-elevated)] px-2 py-0.5 text-xs text-[var(--text-muted)]">
                        {t("dash.inactive")}
                      </span>
                    )}
                    {w.unreadCount > 0 && (
                      <span className="rounded bg-[var(--accent-soft)] px-2 py-0.5 text-xs text-[var(--accent)]">
                        {t(w.unreadCount > 1 ? "dash.newMany" : "dash.newOne", {
                          n: w.unreadCount,
                        })}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    {[w.sighting?.venue, w.sighting?.city]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {formatDate(w.createdAt, locale)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {w.unreadCount > 0 && (
                    <button
                      type="button"
                      className="btn btn-secondary !py-1.5 !px-3 text-sm"
                      disabled={busy === `${w.id}-markRead`}
                      onClick={() => act(w.id, "markRead")}
                    >
                      {t("dash.markRead")}
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-secondary !py-1.5 !px-3 text-sm"
                    disabled={busy?.startsWith(w.id)}
                    onClick={() => act(w.id, w.active ? "deactivate" : "activate")}
                  >
                    {w.active ? t("dash.deactivate") : t("dash.activate")}
                  </button>
                </div>
              </div>

              {w.recentNotifications?.length > 0 && (
                <ul className="mt-4 space-y-2 border-t border-[var(--border)] pt-4">
                  {w.recentNotifications.map((n) => (
                    <li
                      key={n.id}
                      className={`text-sm ${n.readAt ? "text-[var(--text-muted)]" : "text-[var(--text)]"}`}
                    >
                      <span className="font-medium">{n.reason}</span>
                      <span className="ml-2 text-xs opacity-70">
                        {formatDate(n.createdAt, locale)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}

      <Alert type="info">{t("dash.alertsInfo")}</Alert>
    </div>
  );
}
