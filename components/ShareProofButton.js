"use client";

import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";

export default function ShareProofButton({ sightingId, result }) {
  const { t } = useLocale();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function createLink() {
    setLoading(true);
    setError("");
    setCopied(false);
    try {
      const res = await fetch("/api/proofs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sightingId,
          status: result.status,
          message: result.message,
          risk: result.risk
            ? {
                level: result.risk.level,
                score: result.risk.score,
                label: result.risk.label,
                summary: result.risk.summary,
              }
            : null,
          event: result.event
            ? {
                name: result.event.name || result.event.attraction,
                venue: result.event.venue,
                city: result.event.city,
                date: result.event.date || result.event.dateLabel,
              }
            : null,
          matchCount: result.matchCount,
          checkType: result.checkType,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("common.error"));
        return;
      }
      setUrl(data.url);
    } catch {
      setError(t("common.networkError"));
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="rounded-[10px] border border-[var(--border)] p-4">
      <p className="text-sm font-medium">{t("share.title")}</p>
      <p className="mt-1 text-xs text-[var(--text-muted)]">{t("share.hint")}</p>
      {!url ? (
        <button
          type="button"
          className="btn btn-secondary mt-3"
          disabled={loading}
          onClick={createLink}
        >
          {loading ? t("share.creating") : t("share.create")}
        </button>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            readOnly
            className="min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-xs"
            value={url}
          />
          <button type="button" className="btn btn-secondary" onClick={copy}>
            {copied ? t("common.copied") : t("common.copy")}
          </button>
        </div>
      )}
      {error && <p className="mt-2 text-sm text-[var(--danger)]">{error}</p>}
    </div>
  );
}
