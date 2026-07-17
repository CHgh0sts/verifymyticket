"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert } from "@/components/ui";

export default function OrganizerPage() {
  const [data, setData] = useState(null);
  const [msg, setMsg] = useState("");
  const [newKey, setNewKey] = useState("");
  const [codesText, setCodesText] = useState("");
  const [eventName, setEventName] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/organizer");
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Erreur");
    setData(json);
  }, []);

  useEffect(() => {
    load().catch((e) => setMsg(e.message));
  }, [load]);

  async function act(body) {
    const res = await fetch("/api/organizer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) {
      setMsg(json.error || "Erreur");
      return null;
    }
    setMsg(json.message || "OK");
    if (json.apiKey) setNewKey(json.apiKey);
    await load();
    return json;
  }

  if (!data) return <p className="text-[var(--text-muted)]">Chargement…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Espace organisateur</h1>
        <p className="mt-1 text-[var(--text-muted)]">
          Uploadez des lots de codes (hashés côté serveur) et consultez les
          croisements avec les vérifications publiques.
        </p>
      </div>

      {msg && <Alert type="info">{msg}</Alert>}

      {!data.isOrganizer ? (
        <div className="card space-y-3 p-5">
          <p className="text-sm text-[var(--text-muted)]">
            Activez le mode organisateur pour créer des clés API et déposer des
            lots.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => act({ action: "enable" })}
          >
            Activer le mode organisateur
          </button>
        </div>
      ) : (
        <>
          <section className="card space-y-3 p-5">
            <h2 className="font-medium">Clés API</h2>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => act({ action: "createKey", name: "Production" })}
            >
              Créer une clé
            </button>
            {newKey && (
              <Alert type="warning">
                Copiez cette clé maintenant :{" "}
                <code className="break-all text-xs">{newKey}</code>
              </Alert>
            )}
            <ul className="space-y-2 text-sm">
              {data.keys.map((k) => (
                <li key={k.id} className="flex items-center justify-between gap-2">
                  <span>
                    {k.name} · <code>{k.keyPrefix}…</code>
                  </span>
                  <button
                    type="button"
                    className="btn btn-danger !py-1 !px-2 text-xs"
                    onClick={() => act({ action: "revokeKey", keyId: k.id })}
                  >
                    Révoquer
                  </button>
                </li>
              ))}
            </ul>
            <p className="text-xs text-[var(--text-muted)]">
              API : <code>POST /api/organizer/v1/batches</code> avec header{" "}
              <code>Authorization: Bearer vmt_…</code>
            </p>
          </section>

          <section className="card space-y-3 p-5">
            <h2 className="font-medium">Upload d’un lot</h2>
            <input
              className="input"
              placeholder="Nom de l’événement"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
            />
            <textarea
              className="input min-h-32 font-mono text-xs"
              placeholder="Un code par ligne"
              value={codesText}
              onChange={(e) => setCodesText(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-primary"
              onClick={() =>
                act({
                  action: "uploadBatch",
                  eventName,
                  codes: codesText
                    .split(/\r?\n/)
                    .map((l) => l.trim())
                    .filter(Boolean),
                })
              }
            >
              Hasher et enregistrer
            </button>
          </section>

          <section className="card space-y-2 p-5">
            <h2 className="font-medium">Lots récents</h2>
            {data.batches.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">Aucun lot.</p>
            ) : (
              <ul className="space-y-2 text-sm text-[var(--text-muted)]">
                {data.batches.map((b) => (
                  <li key={b.id}>
                    {b.eventName} · {b.itemCount} codes ·{" "}
                    {new Date(b.createdAt).toLocaleDateString("fr-FR")}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
