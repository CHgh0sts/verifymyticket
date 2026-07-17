"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { Alert } from "@/components/ui";
import TurnstileWidget from "@/components/TurnstileWidget";
import BarcodeScanner from "@/components/BarcodeScanner";

const alertEmailSchema = z.object({
  alertEmail: z.string().email("Email invalide").max(255),
});

const nameSchema = z.object({
  purchaserName: z.string().min(2, "Indiquez le nom et prénom").max(200),
});

const seatSchema = z
  .object({
    block: z.string().max(50).optional(),
    row: z.string().max(50).optional(),
    seat: z.string().max(50).optional(),
  })
  .superRefine((data, ctx) => {
    if (
      !String(data.block || "").trim() &&
      !String(data.row || "").trim() &&
      !String(data.seat || "").trim()
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["seat"],
        message: "Indiquez au moins un élément (bloc, rang ou siège)",
      });
    }
  });

const barcodeFullSchema = z.object({
  barcodeValue: z.string().min(4, "Collez la valeur du code (min. 4 caractères)"),
});

const barcodeLast4Schema = z.object({
  barcodeValue: z
    .string()
    .length(4, "Exactement 4 caractères")
    .regex(/^\S{4}$/, "4 caractères sans espace"),
});

const PHASES_GUEST = [
  { phase: "account", label: "Compte" },
  { phase: "event", label: "Événement" },
  { phase: "date", label: "Date" },
  { phase: "intent", label: "Contexte" },
  { phase: "method", label: "Méthode" },
  { phase: "infos", label: "Infos" },
];

const PHASES_AUTH = [
  { phase: "event", label: "Événement" },
  { phase: "date", label: "Date" },
  { phase: "intent", label: "Contexte" },
  { phase: "method", label: "Méthode" },
  { phase: "infos", label: "Infos" },
];

const INTENTS = [
  {
    id: "owned",
    label: "J'ai déjà acheté le billet",
    description: "Je vérifie un billet que je possède déjà.",
  },
  {
    id: "precheck",
    label: "Je vérifie avant d'acheter",
    description:
      "Je veux savoir s'il a déjà circulé. Si c'est OK, on te demandera si tu l'achètes.",
  },
];

const CHECK_TYPES = [
  {
    id: "name",
    label: "Nom et prénom",
    description: "Vérifie si ce nom a déjà été vu pour cet événement.",
  },
  {
    id: "seat",
    label: "Emplacement",
    description: "Compare bloc, rang et siège déjà enregistrés.",
  },
  {
    id: "barcode",
    label: "Code-barres / QR",
    description: "Vérifie le code complet ou les 4 derniers caractères.",
  },
];

function Stepper({ phases, phase }) {
  const currentIdx = phases.findIndex((p) => p.phase === phase);
  return (
    <ol className="mb-10 flex items-center gap-1 sm:gap-2">
      {phases.map((s, i) => {
        const isCurrent = i === currentIdx;
        const isDone = i < currentIdx;
        return (
          <li
            key={s.phase}
            className={`flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2 transition-transform duration-300 ease-out ${
              isCurrent ? "scale-100 origin-left" : "scale-[0.78] origin-left opacity-70"
            }`}
          >
            <div
              className={`flex shrink-0 items-center justify-center rounded-full font-semibold transition-all duration-300 ${
                isCurrent
                  ? "h-9 w-9 text-sm bg-[var(--accent)] text-[#042f2e] shadow-[0_0_0_4px_var(--accent-soft)]"
                  : isDone
                    ? "h-7 w-7 text-xs bg-[var(--accent)] text-[#042f2e]"
                    : "h-7 w-7 text-xs bg-[var(--bg-elevated)] text-[var(--text-muted)]"
              }`}
            >
              {i + 1}
            </div>
            <span
              className={`hidden truncate sm:inline transition-all duration-300 ${
                isCurrent
                  ? "text-sm font-semibold text-[var(--text)]"
                  : "text-xs text-[var(--text-muted)]"
              }`}
            >
              {s.label}
            </span>
            {i < phases.length - 1 && (
              <div
                className={`mx-0.5 h-px min-w-[0.5rem] flex-1 transition-colors duration-300 ${
                  isDone ? "bg-[var(--accent)]" : "bg-[var(--border)]"
                }`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export default function CheckPage() {
  const [user, setUser] = useState(undefined);
  const [phase, setPhase] = useState(null);
  const [alertEmail, setAlertEmail] = useState("");
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchMeta, setSearchMeta] = useState(null);
  const [groups, setGroups] = useState([]);
  const [openSuggest, setOpenSuggest] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [selectedAttraction, setSelectedAttraction] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [intent, setIntent] = useState(null);
  const [checkType, setCheckType] = useState(null);
  const [barcodeMode, setBarcodeMode] = useState("full");
  const [captchaToken, setCaptchaToken] = useState("");
  const [result, setResult] = useState(null);
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [followUpDone, setFollowUpDone] = useState(false);

  const boxRef = useRef(null);
  const abortRef = useRef(null);
  const requestIdRef = useRef(0);

  const authReady = user !== undefined && phase !== null;
  const phases = user ? PHASES_AUTH : PHASES_GUEST;

  const {
    register: registerAlertEmail,
    handleSubmit: handleSubmitAlertEmail,
    formState: { errors: alertEmailErrors },
  } = useForm({
    resolver: zodResolver(alertEmailSchema),
    defaultValues: { alertEmail: "" },
  });

  const activeSchema =
    checkType === "name"
      ? nameSchema
      : checkType === "seat"
        ? seatSchema
        : barcodeMode === "last4"
          ? barcodeLast4Schema
          : barcodeFullSchema;

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(activeSchema),
    defaultValues: {
      barcodeValue: "",
      purchaserName: "",
      block: "",
      row: "",
      seat: "",
    },
  });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.authenticated && data.user) {
          setUser(data.user);
          setAlertEmail(data.user.email || "");
          setPhase("event");
        } else {
          setUser(null);
          setPhase("account");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null);
          setPhase("account");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    reset({
      barcodeValue: "",
      purchaserName: "",
      block: "",
      row: "",
      seat: "",
    });
    setResult(null);
    setServerError("");
  }, [checkType, barcodeMode, reset]);

  const onToken = useCallback((token) => setCaptchaToken(token), []);

  const runSearch = useCallback(async (q, c) => {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setGroups([]);
      setSearchError("");
      setSearchMeta(null);
      setSearching(false);
      setOpenSuggest(false);
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const reqId = ++requestIdRef.current;

    setSearching(true);
    setSearchError("");
    setOpenSuggest(true);

    try {
      const params = new URLSearchParams({ q: trimmed });
      if (c.trim()) params.set("city", c.trim());

      const res = await fetch(`/api/events/search?${params}`, {
        signal: controller.signal,
      });
      const data = await res.json();
      if (reqId !== requestIdRef.current) return;

      if (!res.ok) {
        setGroups([]);
        setSearchError(data.error || "Recherche impossible");
        return;
      }

      setSearchMeta(data);
      setGroups(data.groups || []);
      setHighlight(0);
      if ((data.groups || []).length === 0) {
        setSearchError("Aucun événement trouvé");
      }
    } catch (err) {
      if (err?.name === "AbortError") return;
      if (reqId !== requestIdRef.current) return;
      setGroups([]);
      setSearchError("Erreur réseau");
    } finally {
      if (reqId === requestIdRef.current) setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (phase !== "event") return;
    const t = setTimeout(() => runSearch(query, city), 280);
    return () => clearTimeout(t);
  }, [query, city, phase, runSearch]);

  useEffect(() => {
    function onDocClick(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) {
        setOpenSuggest(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function onAccountEmailSubmit(values) {
    setAlertEmail(values.alertEmail.trim().toLowerCase());
    setPhase("event");
  }

  function pickAttraction(group) {
    setQuery(group.attraction);
    setSelectedAttraction(group);
    setSelectedEvent(null);
    setOpenSuggest(false);
    setPhase("date");
  }

  function pickOccurrence(ev) {
    setSelectedEvent(ev);
    setIntent(null);
    setCheckType(null);
    setPhase("intent");
    setResult(null);
    setServerError("");
    setConfirmMessage("");
    setFollowUpDone(false);
  }

  function pickIntent(value) {
    setIntent(value);
    setCheckType(null);
    setResult(null);
    setServerError("");
    setConfirmMessage("");
    setFollowUpDone(false);
    setPhase("method");
  }

  function pickCheckType(type) {
    setCheckType(type);
    setBarcodeMode("full");
    setResult(null);
    setServerError("");
    setConfirmMessage("");
    setFollowUpDone(false);
    setPhase("infos");
  }

  function resetToSearch() {
    setPhase("event");
    setSelectedAttraction(null);
    setSelectedEvent(null);
    setIntent(null);
    setCheckType(null);
    setResult(null);
    setServerError("");
    setConfirmMessage("");
    setFollowUpDone(false);
    setOpenSuggest(query.trim().length >= 2);
  }

  function resetForAnotherTicket() {
    setSelectedAttraction(null);
    setSelectedEvent(null);
    setIntent(null);
    setCheckType(null);
    setBarcodeMode("full");
    setResult(null);
    setServerError("");
    setConfirmMessage("");
    setFollowUpDone(false);
    setCaptchaToken("");
    reset({
      barcodeValue: "",
      purchaserName: "",
      block: "",
      row: "",
      seat: "",
    });
    setPhase("event");
    setOpenSuggest(false);
  }

  const verificationDone =
    Boolean(result) && (!result.askPurchaseFollowUp || followUpDone);

  function onQueryKeyDown(e) {
    if (!openSuggest || groups.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % groups.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h - 1 + groups.length) % groups.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      pickAttraction(groups[highlight]);
    } else if (e.key === "Escape") {
      setOpenSuggest(false);
    }
  }

  async function onSubmit(values) {
    if (!selectedEvent || !intent || !checkType) {
      setServerError("Parcours incomplet");
      return;
    }
    setLoading(true);
    setServerError("");
    setResult(null);
    setConfirmMessage("");
    setFollowUpDone(false);
    try {
      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent,
          checkType,
          mode: barcodeMode,
          barcodeValue: values.barcodeValue,
          purchaserName: values.purchaserName,
          block: values.block,
          row: values.row,
          seat: values.seat,
          captchaToken,
          alertEmail: user ? undefined : alertEmail,
          event: {
            id: selectedEvent.id,
            name: selectedEvent.name,
            attraction: selectedEvent.attraction,
            venue: selectedEvent.venue,
            city: selectedEvent.city,
            dateLabel: selectedEvent.dateLabel,
            date: selectedEvent.date,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setServerError(data.error || "Erreur lors de la vérification");
        return;
      }
      setResult(data);
    } catch {
      setServerError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  async function confirmPurchase(purchased) {
    if (!result?.sightingId) return;
    setConfirmLoading(true);
    setConfirmMessage("");
    try {
      const res = await fetch("/api/check/confirm-purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sightingId: result.sightingId,
          purchased,
          alertEmail: user ? undefined : alertEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setConfirmMessage(data.error || "Mise à jour impossible");
        return;
      }
      setConfirmMessage(data.message);
      setFollowUpDone(true);
    } catch {
      setConfirmMessage("Erreur réseau");
    } finally {
      setConfirmLoading(false);
    }
  }

  const showBox =
    openSuggest && query.trim().length >= 2 && (searching || groups.length > 0 || searchError);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6 lg:max-w-4xl lg:px-8">
        <h1 className="animate-fade-up text-3xl font-semibold tracking-tight">
          Vérifier un billet
        </h1>
        <p className="animate-fade-up delay-1 mt-2 text-[var(--text-muted)]">
          {authReady && !user ? (
            <>
              Connectez-vous ou indiquez un email pour être alerté si quelqu&apos;un
              d&apos;autre vérifie le même billet plus tard, puis indiquez si vous
              avez déjà acheté ou si vous vérifiez avant l&apos;achat.
            </>
          ) : (
            <>
              Indiquez si vous avez déjà acheté le billet ou si vous vérifiez avant
              l&apos;achat, puis choisissez la méthode.
            </>
          )}
        </p>

        <div className="animate-fade-up delay-2 mt-8">
          {!authReady ? (
            <div aria-hidden="true">
              <div className="mb-8 flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex flex-1 items-center gap-2">
                    <span className="h-8 w-8 animate-pulse rounded-full bg-[var(--bg-elevated)]" />
                    <span className="hidden h-4 flex-1 animate-pulse rounded bg-[var(--bg-elevated)] sm:inline-block" />
                    {i < 5 && (
                      <span className="mx-1 h-px flex-1 animate-pulse bg-[var(--border)]" />
                    )}
                  </div>
                ))}
              </div>
              <div className="card space-y-4 p-6">
                <span className="block h-4 w-32 animate-pulse rounded bg-[var(--bg-elevated)]" />
                <span className="block h-10 w-full animate-pulse rounded-[10px] bg-[var(--bg-elevated)]" />
                <span className="block h-4 w-48 animate-pulse rounded bg-[var(--bg-elevated)]" />
                <span className="block h-10 w-full animate-pulse rounded-[10px] bg-[var(--bg-elevated)]" />
              </div>
            </div>
          ) : (
            <>
              <Stepper phases={phases} phase={phase} />

              {phase === "account" && (
                <div className="card space-y-5 p-6">
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight">
                      Comment souhaitez-vous continuer ?
                    </h2>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                      Vous serez alerté par email si quelqu&apos;un d&apos;autre vérifie
                      le même billet pour le même événement.
                    </p>
                  </div>

                  <ul className="space-y-2">
                    <li>
                      <Link
                        href="/login?next=/check"
                        className="block w-full rounded-[10px] border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3.5 text-left transition hover:border-[var(--accent)]"
                      >
                        <span className="font-medium">Se connecter</span>
                        <span className="mt-0.5 block text-sm text-[var(--text-muted)]">
                          Utilisez votre compte pour recevoir les alertes sur votre email
                          enregistré.
                        </span>
                      </Link>
                    </li>
                  </ul>

                  <div className="relative py-1">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-[var(--border)]" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-[var(--bg-card)] px-3 text-xs text-[var(--text-muted)]">
                        ou
                      </span>
                    </div>
                  </div>

                  <form onSubmit={handleSubmitAlertEmail(onAccountEmailSubmit)} className="space-y-4">
                    <div>
                      <label className="label" htmlFor="alertEmail">
                        Email pour les alertes
                      </label>
                      <input
                        id="alertEmail"
                        type="email"
                        className="input"
                        placeholder="vous@exemple.com"
                        autoComplete="email"
                        {...registerAlertEmail("alertEmail")}
                      />
                      {alertEmailErrors.alertEmail && (
                        <p className="mt-1 text-sm text-[var(--danger)]">
                          {alertEmailErrors.alertEmail.message}
                        </p>
                      )}
                    </div>
                    <button type="submit" className="btn btn-primary w-full">
                      Continuer avec cet email
                    </button>
                  </form>

                  <p className="text-xs text-[var(--text-muted)]">
                    Sans compte, nous utilisons cet email uniquement pour vous prévenir
                    en cas de nouvelle vérification du même billet.
                  </p>
                </div>
              )}

              {phase === "event" && (
                <div className="card space-y-5 p-6">
                  {!user && alertEmail && (
                    <div className="flex items-start justify-between gap-3 rounded-[10px] border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3">
                      <div>
                        <p className="text-sm text-[var(--text-muted)]">Alertes par email</p>
                        <p className="font-medium">{alertEmail}</p>
                      </div>
                      <button
                        type="button"
                        className="text-sm text-[var(--text-muted)] underline hover:text-[var(--text)]"
                        onClick={() => setPhase("account")}
                      >
                        Modifier
                      </button>
                    </div>
                  )}

                  <div ref={boxRef} className="relative">
                    <label className="label" htmlFor="eventQuery">
                      Artiste / événement
                    </label>
                    <div className="relative">
                      <input
                        id="eventQuery"
                        className="input pr-10"
                        placeholder="Ex. BTS, Coldplay, Taylor Swift…"
                        value={query}
                        autoComplete="off"
                        role="combobox"
                        aria-expanded={showBox}
                        aria-controls="event-suggestions"
                        aria-autocomplete="list"
                        onChange={(e) => {
                          setQuery(e.target.value);
                          setOpenSuggest(true);
                          setSelectedAttraction(null);
                        }}
                        onFocus={() => {
                          if (query.trim().length >= 2) setOpenSuggest(true);
                        }}
                        onKeyDown={onQueryKeyDown}
                      />
                      {searching && (
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)]">
                          …
                        </span>
                      )}
                    </div>

                    {showBox && (
                      <ul
                        id="event-suggestions"
                        role="listbox"
                        className="absolute z-20 mt-1.5 max-h-72 w-full overflow-auto rounded-[10px] border border-[var(--border)] bg-[var(--bg-card)] shadow-[var(--shadow)]"
                      >
                        {searching && groups.length === 0 && !searchError && (
                          <li className="px-4 py-3 text-sm text-[var(--text-muted)]">
                            Recherche en cours…
                          </li>
                        )}
                        {searchError && groups.length === 0 && (
                          <li className="px-4 py-3 text-sm text-[var(--danger)]">{searchError}</li>
                        )}
                        {groups.map((g, i) => (
                          <li key={g.attraction} role="option" aria-selected={i === highlight}>
                            <button
                              type="button"
                              className={`w-full px-4 py-3 text-left transition ${
                                i === highlight
                                  ? "bg-[var(--accent-soft)]"
                                  : "hover:bg-[var(--bg-elevated)]"
                              }`}
                              onMouseEnter={() => setHighlight(i)}
                              onClick={() => pickAttraction(g)}
                            >
                              <span className="font-medium">{g.attraction}</span>
                              <span className="mt-0.5 block text-sm text-[var(--text-muted)]">
                                {g.occurrences.length} date
                                {g.occurrences.length > 1 ? "s" : ""}
                                {g.occurrences[0]?.city ? ` · ${g.occurrences[0].city}` : ""}
                                {g.occurrences[0]?.venue
                                  ? ` · ${g.occurrences[0].venue}`
                                  : ""}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div>
                    <label className="label" htmlFor="eventCity">
                      Ville (optionnel — affine les suggestions)
                    </label>
                    <input
                      id="eventCity"
                      className="input"
                      placeholder="Ex. Paris, Lyon, London…"
                      value={city}
                      onChange={(e) => {
                        setCity(e.target.value);
                        setOpenSuggest(true);
                      }}
                    />
                  </div>

                  {searchMeta?.demo && query.trim().length >= 2 && (
                    <Alert type="info">
                      Mode démo — ajoutez TICKETMASTER_API_KEY pour les vrais événements Europe.
                    </Alert>
                  )}

                  <p className="text-xs text-[var(--text-muted)]">
                    Les résultats se mettent à jour pendant que vous tapez. Cliquez une
                    suggestion pour continuer.
                  </p>
                </div>
              )}

              {phase === "date" && selectedAttraction && (
                <div className="card space-y-4 p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-[var(--text-muted)]">Événement</p>
                      <h2 className="text-xl font-semibold">{selectedAttraction.attraction}</h2>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary !py-1.5 !px-3 text-sm"
                      onClick={resetToSearch}
                    >
                      Changer
                    </button>
                  </div>

                  <p className="text-sm text-[var(--text-muted)]">
                    Sélectionnez la date et le lieu de votre billet :
                  </p>

                  <ul className="space-y-2">
                    {selectedAttraction.occurrences.map((ev) => (
                      <li key={ev.id}>
                        <button
                          type="button"
                          onClick={() => pickOccurrence(ev)}
                          className="w-full rounded-[10px] border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 text-left transition hover:border-[var(--accent)]"
                        >
                          <span className="font-medium">
                            {ev.dateLabel}
                            {ev.timeLabel ? ` · ${ev.timeLabel}` : ""}
                          </span>
                          <span className="mt-0.5 block text-sm text-[var(--text-muted)]">
                            {[ev.venue, ev.city, ev.country].filter(Boolean).join(" · ")}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {phase === "intent" && selectedEvent && (
                <div className="card space-y-5 p-6">
                  <div className="rounded-[10px] border border-[var(--border)] bg-[var(--accent-soft)] px-4 py-3">
                    <p className="font-medium text-[var(--accent)]">
                      {selectedEvent.attraction || selectedEvent.name}
                    </p>
                    <p className="mt-1 text-sm text-[var(--text)]">
                      {selectedEvent.dateLabel}
                      {selectedEvent.city ? ` à ${selectedEvent.city}` : ""}
                      {selectedEvent.venue ? ` · ${selectedEvent.venue}` : ""}
                    </p>
                    <button
                      type="button"
                      className="mt-2 text-sm text-[var(--text-muted)] underline hover:text-[var(--text)]"
                      onClick={() => setPhase("date")}
                    >
                      Changer la date
                    </button>
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold tracking-tight">
                      Quelle est votre situation ?
                    </h2>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                      Cela change les messages d&apos;alerte pour les prochaines
                      vérifications du même billet.
                    </p>
                  </div>

                  <ul className="space-y-2">
                    {INTENTS.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => pickIntent(item.id)}
                          className="w-full rounded-[10px] border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3.5 text-left transition hover:border-[var(--accent)]"
                        >
                          <span className="font-medium">{item.label}</span>
                          <span className="mt-0.5 block text-sm text-[var(--text-muted)]">
                            {item.description}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {phase === "method" && selectedEvent && intent && (
                <div className="card space-y-5 p-6">
                  <div className="rounded-[10px] border border-[var(--border)] bg-[var(--accent-soft)] px-4 py-3">
                    <p className="font-medium text-[var(--accent)]">
                      {selectedEvent.attraction || selectedEvent.name}
                    </p>
                    <p className="mt-1 text-sm text-[var(--text)]">
                      {selectedEvent.dateLabel}
                      {selectedEvent.city ? ` à ${selectedEvent.city}` : ""}
                      {selectedEvent.venue ? ` · ${selectedEvent.venue}` : ""}
                    </p>
                    <p className="mt-2 text-sm text-[var(--text-muted)]">
                      Contexte :{" "}
                      <span className="text-[var(--text)]">
                        {INTENTS.find((i) => i.id === intent)?.label}
                      </span>
                    </p>
                    <button
                      type="button"
                      className="mt-2 text-sm text-[var(--text-muted)] underline hover:text-[var(--text)]"
                      onClick={() => setPhase("intent")}
                    >
                      Changer le contexte
                    </button>
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold tracking-tight">
                      Comment voulez-vous vérifier ?
                    </h2>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                      Choisissez une méthode. Les informations à saisir s&apos;afficheront
                      ensuite.
                    </p>
                  </div>

                  <ul className="space-y-2">
                    {CHECK_TYPES.map((t) => (
                      <li key={t.id}>
                        <button
                          type="button"
                          onClick={() => pickCheckType(t.id)}
                          className="w-full rounded-[10px] border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3.5 text-left transition hover:border-[var(--accent)]"
                        >
                          <span className="font-medium">{t.label}</span>
                          <span className="mt-0.5 block text-sm text-[var(--text-muted)]">
                            {t.description}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {phase === "infos" && selectedEvent && intent && checkType && (
                <form
                  key={`${checkType}-${barcodeMode}`}
                  onSubmit={handleSubmit(onSubmit)}
                  className="card space-y-5 p-6"
                >
                  <div className="rounded-[10px] border border-[var(--border)] bg-[var(--accent-soft)] px-4 py-3">
                    <p className="font-medium text-[var(--accent)]">
                      {selectedEvent.attraction || selectedEvent.name}
                    </p>
                    <p className="mt-1 text-sm text-[var(--text)]">
                      {selectedEvent.dateLabel}
                      {selectedEvent.city ? ` à ${selectedEvent.city}` : ""}
                      {selectedEvent.venue ? ` · ${selectedEvent.venue}` : ""}
                    </p>
                    <p className="mt-2 text-sm text-[var(--text-muted)]">
                      {INTENTS.find((i) => i.id === intent)?.label}
                      {" · "}
                      {CHECK_TYPES.find((t) => t.id === checkType)?.label}
                    </p>
                    <button
                      type="button"
                      className="mt-2 text-sm text-[var(--text-muted)] underline hover:text-[var(--text)]"
                      onClick={() => {
                        setPhase("method");
                        setResult(null);
                        setServerError("");
                        setConfirmMessage("");
                        setFollowUpDone(false);
                      }}
                    >
                      Changer la méthode
                    </button>
                  </div>

                  {checkType === "name" && (
                    <div>
                      <Alert type="info">
                        Si ce nom a déjà été vu pour cet événement (même en ordre
                        inversé), une alerte s&apos;affiche selon qu&apos;il était
                        marqué comme acheté ou seulement consulté.
                      </Alert>
                      <div className="mt-4">
                        <label className="label" htmlFor="purchaserName">
                          Nom et prénom sur le billet
                        </label>
                        <input
                          id="purchaserName"
                          className="input"
                          placeholder="Ex. Marie Bru"
                          autoComplete="name"
                          {...register("purchaserName")}
                        />
                        {errors.purchaserName && (
                          <p className="mt-1 text-sm text-[var(--danger)]">
                            {errors.purchaserName.message}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {checkType === "seat" && (
                    <div className="space-y-4">
                      <Alert type="info">
                        Compare l&apos;emplacement déjà vérifié ou enregistré pour
                        ce même événement.
                      </Alert>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="label" htmlFor="block">
                            Bloc
                          </label>
                          <input id="block" className="input" placeholder="A" {...register("block")} />
                        </div>
                        <div>
                          <label className="label" htmlFor="row">
                            Rang
                          </label>
                          <input id="row" className="input" placeholder="12" {...register("row")} />
                        </div>
                        <div>
                          <label className="label" htmlFor="seat">
                            Siège
                          </label>
                          <input id="seat" className="input" placeholder="8" {...register("seat")} />
                        </div>
                      </div>
                      {errors.seat && (
                        <p className="text-sm text-[var(--danger)]">{errors.seat.message}</p>
                      )}
                    </div>
                  )}

                  {checkType === "barcode" && (
                    <div className="space-y-4">
                      <div>
                        <p className="label mb-2">Type de code</p>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setBarcodeMode("full")}
                            className={`rounded-[10px] border px-3 py-2.5 text-sm font-medium transition ${
                              barcodeMode === "full"
                                ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                                : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-hover)]"
                            }`}
                          >
                            Code complet
                          </button>
                          <button
                            type="button"
                            onClick={() => setBarcodeMode("last4")}
                            className={`rounded-[10px] border px-3 py-2.5 text-sm font-medium transition ${
                              barcodeMode === "last4"
                                ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                                : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-hover)]"
                            }`}
                          >
                            4 derniers caractères
                          </button>
                        </div>
                      </div>

                      {barcodeMode === "last4" && (
                        <Alert type="info">
                          Si le vendeur refuse le code entier, entrez les{" "}
                          <strong>4 derniers caractères</strong>. Un match indique un{" "}
                          <strong>doute</strong>, pas une certitude.
                        </Alert>
                      )}

                      <div>
                        <label className="label" htmlFor="barcodeValue">
                          {barcodeMode === "last4"
                            ? "4 derniers caractères du code"
                            : "Valeur du QR / code-barres"}
                        </label>
                        {barcodeMode === "last4" ? (
                          <input
                            id="barcodeValue"
                            className="input font-mono text-center text-lg tracking-[0.35em]"
                            maxLength={4}
                            placeholder="••••"
                            autoComplete="off"
                            {...register("barcodeValue")}
                          />
                        ) : (
                          <textarea
                            id="barcodeValue"
                            rows={3}
                            className="input font-mono text-sm"
                            placeholder="Collez ici la valeur scannée…"
                            {...register("barcodeValue")}
                          />
                        )}
                        {errors.barcodeValue && (
                          <p className="mt-1 text-sm text-[var(--danger)]">
                            {errors.barcodeValue.message}
                          </p>
                        )}
                      </div>

                      {barcodeMode === "full" && (
                        <BarcodeScanner
                          onScan={(text) =>
                            setValue("barcodeValue", text, { shouldValidate: true })
                          }
                        />
                      )}
                    </div>
                  )}

                  <TurnstileWidget onToken={onToken} />

                  {serverError && <Alert type="error">{serverError}</Alert>}

                  {result && (
                    <div className="space-y-3">
                      <Alert
                        type={
                          result.status === "clean"
                            ? "success"
                            : result.severity === "purchased" || result.status === "duplicate"
                              ? "error"
                              : "warning"
                        }
                      >
                        <p className="font-medium">{result.message}</p>
                        {result.hint && (
                          <p className="mt-1 opacity-90">{result.hint}</p>
                        )}
                        {result.saved && (
                          <p className="mt-1 text-xs opacity-75">
                            Enregistré pour cet événement (hashes uniquement).
                          </p>
                        )}
                      </Alert>

                      {result.askPurchaseFollowUp && result.sightingId && !followUpDone && (
                        <div className="rounded-[10px] border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
                          <p className="font-medium">
                            Avez-vous acheté / allez-vous prendre ce billet ?
                          </p>
                          <p className="mt-1 text-sm text-[var(--text-muted)]">
                            Oui = compté comme acheté. Non = gardé en mémoire comme
                            simple vérification avant achat.
                          </p>
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              className="btn btn-primary"
                              disabled={confirmLoading}
                              onClick={() => confirmPurchase(true)}
                            >
                              Oui
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              disabled={confirmLoading}
                              onClick={() => confirmPurchase(false)}
                            >
                              Non
                            </button>
                          </div>
                        </div>
                      )}

                      {confirmMessage && (
                        <Alert type={followUpDone ? "success" : "error"}>
                          {confirmMessage}
                        </Alert>
                      )}
                    </div>
                  )}

                  {verificationDone ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        className="btn btn-primary w-full"
                        onClick={resetForAnotherTicket}
                      >
                        Vérifier un autre billet
                      </button>
                      <Link href="/" className="btn btn-secondary w-full">
                        Retour à l&apos;accueil
                      </Link>
                    </div>
                  ) : !result ? (
                    <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                      {loading ? "Vérification…" : "Vérifier"}
                    </button>
                  ) : null}
                </form>
              )}
            </>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
