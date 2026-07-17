"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Alert, RiskBadge } from "@/components/ui";

export default function TicketDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [ticket, setTicket] = useState(null);
  const [sightings, setSightings] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/tickets/${id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Introuvable");
    setTicket(data.ticket);
    setSightings(data.relatedSightings || []);
    setForm({
      eventName: data.ticket.eventName || "",
      venue: data.ticket.venue || "",
      city: data.ticket.city || "",
      platform: data.ticket.platform || "",
      organizer: data.ticket.organizer || "",
      orderNumber: data.ticket.orderNumber || "",
      block: data.ticket.block || "",
      row: data.ticket.row || "",
      seat: data.ticket.seat || "",
      purchaserName: data.ticket.purchaserName || "",
      notes: data.ticket.notes || "",
      eventDate: data.ticket.eventDate
        ? new Date(data.ticket.eventDate).toISOString().slice(0, 16)
        : "",
    });
  }, [id]);

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [load]);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          eventDate: form.eventDate || null,
          venue: form.venue || null,
          city: form.city || null,
          organizer: form.organizer || null,
          orderNumber: form.orderNumber || null,
          block: form.block || null,
          row: form.row || null,
          seat: form.seat || null,
          purchaserName: form.purchaserName || null,
          notes: form.notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Enregistrement impossible");
        return;
      }
      setTicket(data.ticket);
      setMsg("Modifications enregistrées");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm("Supprimer ce billet ?")) return;
    const res = await fetch(`/api/tickets/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/dashboard/tickets");
  }

  if (error) {
    return (
      <div>
        <p className="text-[var(--danger)]">{error}</p>
        <Link href="/dashboard/tickets" className="mt-4 inline-block text-[var(--accent)]">
          ← Retour
        </Link>
      </div>
    );
  }
  if (!ticket || !form) {
    return <p className="text-[var(--text-muted)]">Chargement…</p>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/dashboard/tickets"
            className="text-sm text-[var(--text-muted)] hover:text-[var(--accent)]"
          >
            ← Mes billets
          </Link>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {ticket.eventName}
          </h1>
          <p className="mt-1 font-mono text-xs text-[var(--text-muted)]">
            {ticket.barcodeType} · ****{ticket.barcodeLastDigits} (code jamais
            affiché en clair)
          </p>
        </div>
        <RiskBadge
          level={
            ticket.detectedDuplicate
              ? ticket.duplicateCount >= 2
                ? "high"
                : "medium"
              : "low"
          }
          label={
            ticket.detectedDuplicate
              ? ticket.duplicateCount >= 2
                ? "Risque élevé"
                : "Prudence"
              : "Risque faible"
          }
          emoji={
            ticket.detectedDuplicate
              ? ticket.duplicateCount >= 2
                ? "🔴"
                : "🟠"
              : "🟢"
          }
          duplicateCount={ticket.detectedDuplicate ? ticket.duplicateCount : 0}
        />
      </div>

      <form onSubmit={save} className="card space-y-4 p-5">
        <h2 className="font-medium">Modifier les infos</h2>
        {[
          ["eventName", "Événement", true],
          ["platform", "Plateforme", true],
          ["venue", "Lieu", false],
          ["city", "Ville", false],
          ["organizer", "Organisateur", false],
          ["orderNumber", "N° commande", false],
          ["purchaserName", "Nom sur le billet", false],
          ["block", "Bloc", false],
          ["row", "Rang", false],
          ["seat", "Siège", false],
        ].map(([key, label, required]) => (
          <label key={key} className="block text-sm">
            <span className="text-[var(--text-muted)]">{label}</span>
            <input
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2"
              value={form[key]}
              required={required}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            />
          </label>
        ))}
        <label className="block text-sm">
          <span className="text-[var(--text-muted)]">Date événement</span>
          <input
            type="datetime-local"
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2"
            value={form.eventDate}
            onChange={(e) => setForm((f) => ({ ...f, eventDate: e.target.value }))}
          />
        </label>
        <label className="block text-sm">
          <span className="text-[var(--text-muted)]">Notes (privées)</span>
          <textarea
            rows={3}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </label>
        {msg && (
          <Alert type={msg.includes("impossible") ? "error" : "success"}>{msg}</Alert>
        )}
        <div className="flex flex-wrap gap-2">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
          <button type="button" className="btn btn-danger" onClick={remove}>
            Supprimer
          </button>
        </div>
      </form>

      <section className="card p-5">
        <h2 className="font-medium">Historique lié (vérifications publiques)</h2>
        {sightings.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Aucune vérification publique liée pour l’instant.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {sightings.map((s) => (
              <li key={s.id} className="text-sm text-[var(--text-muted)]">
                <span className="text-[var(--text)]">{s.eventName}</span>
                {" · "}
                {s.mode} · {s.purchaseStatus} ·×{s.checkCount} ·{" "}
                {new Date(s.createdAt).toLocaleDateString("fr-FR")}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
