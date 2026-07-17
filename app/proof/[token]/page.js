"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { Alert } from "@/components/ui";

export default function ProofPage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/proofs/${token}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Erreur");
        setData(json);
      })
      .catch((e) => setError(e.message));
  }, [token]);

  const p = data?.payload;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-12">
        <h1 className="text-2xl font-semibold tracking-tight">
          Preuve de vérification
        </h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Résultat partagé via VerifyMyTicket — aucun code-barres n’est affiché.
        </p>

        {error && (
          <div className="mt-6">
            <Alert type="error">{error}</Alert>
          </div>
        )}

        {!error && !data && (
          <p className="mt-6 text-[var(--text-muted)]">Chargement…</p>
        )}

        {p && (
          <div className="card mt-6 space-y-4 p-5">
            <Alert
              type={
                p.status === "clean"
                  ? "success"
                  : p.risk?.level === "high"
                    ? "error"
                    : "warning"
              }
            >
              <p className="font-medium">{p.message || "Résultat de vérification"}</p>
            </Alert>

            {p.event && (
              <div>
                <p className="text-sm text-[var(--text-muted)]">Événement</p>
                <p className="font-medium">{p.event.name}</p>
                <p className="text-sm text-[var(--text-muted)]">
                  {[p.event.venue, p.event.city].filter(Boolean).join(" · ")}
                </p>
              </div>
            )}

            {p.risk && (
              <div>
                <p className="text-sm text-[var(--text-muted)]">Niveau de risque</p>
                <p className="font-medium">
                  {p.risk.label} ({p.risk.score}/100)
                </p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  {p.risk.summary}
                </p>
              </div>
            )}

            <p className="text-xs text-[var(--text-muted)]">
              Expire le{" "}
              {new Date(data.expiresAt).toLocaleString("fr-FR")}
            </p>
          </div>
        )}

        <Link href="/check" className="btn btn-primary mt-8 inline-flex">
          Faire ma propre vérification
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
