"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import BarcodeScanner from "@/components/BarcodeScanner";
import { Alert, DuplicateAlert, RiskBadge } from "@/components/ui";

const PLATFORMS = [
  "Ticketmaster",
  "France Billet",
  "See Tickets",
  "Stade de France",
  "Fnac Spectacles",
  "Autre",
];

const schema = z.object({
  category: z.enum([
    "CONCERT",
    "FESTIVAL",
    "SPORT",
    "THEATER",
    "CINEMA",
    "TRAIN",
    "FLIGHT",
    "OLYMPICS",
    "OTHER",
  ]),
  eventName: z.string().min(1, "Requis"),
  venue: z.string().optional(),
  city: z.string().optional(),
  eventDate: z.string().optional(),
  organizer: z.string().optional(),
  platform: z.string().min(1, "Requis"),
  orderNumber: z.string().optional(),
  seat: z.string().optional(),
  row: z.string().optional(),
  block: z.string().optional(),
  ticketCategory: z.string().optional(),
  purchaserName: z.string().optional(),
  purchasePrice: z.string().optional(),
  purchaseDate: z.string().optional(),
  barcodeType: z.enum(["QR", "DATAMATRIX", "BARCODE"]),
  barcodeValue: z.string().min(4, "Code trop court"),
});

function toIsoOrEmpty(dateLocal) {
  if (!dateLocal) return "";
  const d = new Date(dateLocal);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
}

export default function NewTicketPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      category: "CONCERT",
      barcodeType: "QR",
      platform: "Ticketmaster",
      eventName: "",
      barcodeValue: "",
    },
  });

  async function onSubmit(values) {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const payload = {
        ...values,
        eventDate: toIsoOrEmpty(values.eventDate) || null,
        purchaseDate: toIsoOrEmpty(values.purchaseDate) || null,
        purchasePrice: values.purchasePrice
          ? Number(String(values.purchasePrice).replace(",", "."))
          : null,
      };

      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Enregistrement impossible");
        return;
      }
      setResult(data);
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">Billet enregistré</h1>
        {result.risk && (
          <RiskBadge
            level={result.risk.level}
            label={result.risk.label}
            emoji={result.risk.emoji}
            duplicateCount={result.duplicateCount}
          />
        )}
        <DuplicateAlert warning={result.warning} />
        {!result.warning && (
          <Alert type="success">Aucun doublon trouvé — risque faible.</Alert>
        )}
        <div className="flex gap-3">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => router.push("/dashboard/tickets")}
          >
            Voir mes billets
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setResult(null);
              setValue("barcodeValue", "");
            }}
          >
            Ajouter un autre
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Enregistrer un billet</h1>
        <p className="mt-1 text-[var(--text-muted)]">
          La valeur du code est hashée côté serveur (HMAC-SHA-256) et jamais stockée en clair.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-5 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="eventName">
              Nom de l&apos;événement *
            </label>
            <input id="eventName" className="input" {...register("eventName")} />
            {errors.eventName && (
              <p className="mt-1 text-sm text-[var(--danger)]">{errors.eventName.message}</p>
            )}
          </div>

          <div>
            <label className="label" htmlFor="category">
              Type
            </label>
            <select id="category" className="input" {...register("category")}>
              <option value="CONCERT">Concert</option>
              <option value="FESTIVAL">Festival</option>
              <option value="SPORT">Sport</option>
              <option value="THEATER">Théâtre</option>
              <option value="CINEMA">Cinéma</option>
              <option value="TRAIN">Train</option>
              <option value="FLIGHT">Avion</option>
              <option value="OLYMPICS">Jeux Olympiques</option>
              <option value="OTHER">Autre</option>
            </select>
          </div>

          <div>
            <label className="label" htmlFor="platform">
              Plateforme *
            </label>
            <select id="platform" className="input" {...register("platform")}>
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="venue">
              Salle
            </label>
            <input id="venue" className="input" {...register("venue")} />
          </div>

          <div>
            <label className="label" htmlFor="city">
              Ville
            </label>
            <input id="city" className="input" {...register("city")} />
          </div>

          <div>
            <label className="label" htmlFor="eventDate">
              Date de l&apos;événement
            </label>
            <input id="eventDate" type="datetime-local" className="input" {...register("eventDate")} />
          </div>

          <div>
            <label className="label" htmlFor="organizer">
              Organisateur
            </label>
            <input id="organizer" className="input" {...register("organizer")} />
          </div>

          <div>
            <label className="label" htmlFor="orderNumber">
              N° de commande
            </label>
            <input id="orderNumber" className="input" {...register("orderNumber")} />
          </div>

          <div>
            <label className="label" htmlFor="purchaserName">
              Nom de l&apos;acheteur
            </label>
            <input id="purchaserName" className="input" {...register("purchaserName")} />
          </div>

          <div>
            <label className="label" htmlFor="purchasePrice">
              Prix
            </label>
            <input
              id="purchasePrice"
              className="input"
              placeholder="89.00"
              {...register("purchasePrice")}
            />
          </div>

          <div>
            <label className="label" htmlFor="purchaseDate">
              Date d&apos;achat
            </label>
            <input
              id="purchaseDate"
              type="datetime-local"
              className="input"
              {...register("purchaseDate")}
            />
          </div>

          <div>
            <label className="label" htmlFor="block">
              Bloc
            </label>
            <input id="block" className="input" {...register("block")} />
          </div>

          <div>
            <label className="label" htmlFor="row">
              Rang
            </label>
            <input id="row" className="input" {...register("row")} />
          </div>

          <div>
            <label className="label" htmlFor="seat">
              Siège
            </label>
            <input id="seat" className="input" {...register("seat")} />
          </div>

          <div>
            <label className="label" htmlFor="ticketCategory">
              Catégorie placement
            </label>
            <input
              id="ticketCategory"
              className="input"
              placeholder="Orchestre, VIP…"
              {...register("ticketCategory")}
            />
          </div>
        </div>

        <div className="border-t border-[var(--border)] pt-5 space-y-4">
          <div>
            <label className="label" htmlFor="barcodeType">
              Type de code *
            </label>
            <select id="barcodeType" className="input" {...register("barcodeType")}>
              <option value="QR">QR Code</option>
              <option value="DATAMATRIX">DataMatrix</option>
              <option value="BARCODE">Code-barres</option>
            </select>
          </div>

          <div>
            <label className="label" htmlFor="barcodeValue">
              Valeur du code *
            </label>
            <textarea
              id="barcodeValue"
              rows={3}
              className="input font-mono text-sm"
              placeholder="Collez la valeur du QR / code-barres…"
              {...register("barcodeValue")}
            />
            {errors.barcodeValue && (
              <p className="mt-1 text-sm text-[var(--danger)]">
                {errors.barcodeValue.message}
              </p>
            )}
          </div>

          <BarcodeScanner
            onScan={(text) => setValue("barcodeValue", text, { shouldValidate: true })}
          />
        </div>

        {error && <Alert type="error">{error}</Alert>}

        <button type="submit" className="btn btn-primary w-full" disabled={loading}>
          {loading ? "Enregistrement…" : "Enregistrer le billet"}
        </button>
      </form>
    </div>
  );
}
