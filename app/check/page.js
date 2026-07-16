"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { Alert } from "@/components/ui";
import TurnstileWidget from "@/components/TurnstileWidget";
import BarcodeScanner from "@/components/BarcodeScanner";

const fullSchema = z.object({
  barcodeValue: z.string().min(4, "Collez la valeur du code (min. 4 caractères)"),
});

const last4Schema = z.object({
  barcodeValue: z
    .string()
    .length(4, "Exactement 4 caractères")
    .regex(/^\S{4}$/, "4 caractères sans espace"),
});

const STEPS = [
  { id: 1, label: "Événement" },
  { id: 2, label: "Date & lieu" },
  { id: 3, label: "Code" },
];

function Stepper({ step }) {
  return (
    <ol className="mb-8 flex items-center gap-2">
      {STEPS.map((s, i) => (
        <li key={s.id} className="flex flex-1 items-center gap-2">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
              step >= s.id
                ? "bg-[var(--accent)] text-[#042f2e]"
                : "bg-[var(--bg-elevated)] text-[var(--text-muted)]"
            }`}
          >
            {s.id}
          </div>
          <span
            className={`hidden text-sm sm:inline ${
              step >= s.id ? "text-[var(--text)]" : "text-[var(--text-muted)]"
            }`}
          >
            {s.label}
          </span>
          {i < STEPS.length - 1 && (
            <div
              className={`mx-1 h-px flex-1 ${
                step > s.id ? "bg-[var(--accent)]" : "bg-[var(--border)]"
              }`}
            />
          )}
        </li>
      ))}
    </ol>
  );
}

export default function CheckPage() {
  const [step, setStep] = useState(1);
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
  const [checkMode, setCheckMode] = useState("full"); // full | last4
  const [captchaToken, setCaptchaToken] = useState("");
  const [result, setResult] = useState(null);
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const boxRef = useRef(null);
  const abortRef = useRef(null);
  const requestIdRef = useRef(0);

  const activeSchema = checkMode === "last4" ? last4Schema : fullSchema;

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(activeSchema),
    defaultValues: { barcodeValue: "" },
  });

  useEffect(() => {
    reset({ barcodeValue: "" });
    setResult(null);
    setServerError("");
  }, [checkMode, reset]);

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
    if (step !== 1) return;
    const t = setTimeout(() => runSearch(query, city), 280);
    return () => clearTimeout(t);
  }, [query, city, step, runSearch]);

  useEffect(() => {
    function onDocClick(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) {
        setOpenSuggest(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function pickAttraction(group) {
    setQuery(group.attraction);
    setSelectedAttraction(group);
    setSelectedEvent(null);
    setOpenSuggest(false);
    setStep(2);
  }

  function pickOccurrence(ev) {
    setSelectedEvent(ev);
    setStep(3);
    setResult(null);
    setServerError("");
  }

  function resetToSearch() {
    setStep(1);
    setSelectedAttraction(null);
    setSelectedEvent(null);
    setResult(null);
    setServerError("");
    setOpenSuggest(query.trim().length >= 2);
  }

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
    if (!selectedEvent) {
      setServerError("Sélectionnez d'abord un événement");
      return;
    }
    setLoading(true);
    setServerError("");
    setResult(null);
    try {
      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: checkMode,
          barcodeValue: values.barcodeValue,
          captchaToken,
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

  const showBox =
    openSuggest && query.trim().length >= 2 && (searching || groups.length > 0 || searchError);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-12 sm:px-6">
        <h1 className="animate-fade-up text-3xl font-semibold tracking-tight">
          Vérifier un billet
        </h1>
        <p className="animate-fade-up delay-1 mt-2 text-[var(--text-muted)]">
          Tapez le nom de l&apos;artiste ou de l&apos;événement : les suggestions
          s&apos;affichent automatiquement. Puis choisissez la date et le code.
        </p>

        <div className="animate-fade-up delay-2 mt-8">
          <Stepper step={step} />

          {step === 1 && (
            <div className="card space-y-5 p-6">
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

          {step === 2 && selectedAttraction && (
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

          {step === 3 && selectedEvent && (
            <form
              key={checkMode}
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
                <button
                  type="button"
                  className="mt-2 text-sm text-[var(--text-muted)] underline hover:text-[var(--text)]"
                  onClick={() => setStep(2)}
                >
                  Changer la date
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCheckMode("full")}
                  className={`rounded-[10px] border px-3 py-2.5 text-sm font-medium transition ${
                    checkMode === "full"
                      ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                      : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-hover)]"
                  }`}
                >
                  Code complet
                </button>
                <button
                  type="button"
                  onClick={() => setCheckMode("last4")}
                  className={`rounded-[10px] border px-3 py-2.5 text-sm font-medium transition ${
                    checkMode === "last4"
                      ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                      : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-hover)]"
                  }`}
                >
                  4 derniers caractères
                </button>
              </div>

              {checkMode === "last4" && (
                <Alert type="info">
                  Si le vendeur refuse de donner le code entier, entrez uniquement les{" "}
                  <strong>4 derniers caractères</strong>. On compare seulement les billets du{" "}
                  <strong>même événement, même date et même lieu</strong>. Un match indique un{" "}
                  <strong>doute</strong> de double revente, pas une certitude.
                </Alert>
              )}

              <div>
                <label className="label" htmlFor="barcodeValue">
                  {checkMode === "last4"
                    ? "4 derniers caractères du code"
                    : "Valeur du QR / code-barres"}
                </label>
                {checkMode === "last4" ? (
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

              {checkMode === "full" && (
                <BarcodeScanner
                  onScan={(text) => setValue("barcodeValue", text, { shouldValidate: true })}
                />
              )}

              <TurnstileWidget onToken={onToken} />

              {serverError && <Alert type="error">{serverError}</Alert>}

              {result && (
                <Alert
                  type={
                    result.status === "clean"
                      ? "success"
                      : result.status === "doubt"
                        ? "warning"
                        : "error"
                  }
                >
                  <p className="font-medium">{result.message}</p>
                  {result.hint && (
                    <p className="mt-1 opacity-90">{result.hint}</p>
                  )}
                  {result.saved && (
                    <p className="mt-1 text-xs opacity-75">
                      Enregistré pour cet événement (hash uniquement).
                    </p>
                  )}
                </Alert>
              )}

              <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                {loading
                  ? "Vérification…"
                  : checkMode === "last4"
                    ? "Vérifier les 4 caractères"
                    : "Vérifier le billet"}
              </button>
            </form>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
