"use client";

export function RiskBadge({ level, label, emoji, duplicateCount }) {
  const cls =
    level === "high" ? "badge-high" : level === "medium" ? "badge-medium" : "badge-low";

  return (
    <span className={`badge ${cls}`}>
      <span aria-hidden>{emoji}</span>
      {label}
      {typeof duplicateCount === "number" && duplicateCount > 0 && (
        <span className="opacity-80">· {duplicateCount} doublon{duplicateCount > 1 ? "s" : ""}</span>
      )}
    </span>
  );
}

export function DuplicateAlert({ warning }) {
  if (!warning) return null;

  return (
    <div
      className="animate-fade-up rounded-[var(--radius)] border border-[var(--warning)]/40 bg-[var(--warning-soft)] p-4"
      role="alert"
    >
      <p className="font-semibold text-[var(--warning)]">⚠️ {warning.title}</p>
      <p className="mt-2 text-sm text-[var(--text)]">{warning.message}</p>
      {warning.firstRegistration && (
        <p className="mt-3 text-sm text-[var(--text-muted)]">
          Ce billet est déjà enregistré depuis le{" "}
          <strong className="text-[var(--text)]">{warning.firstRegistration.date}</strong>
          {warning.firstRegistration.platform && (
            <>
              {" "}
              (plateforme : {warning.firstRegistration.platform})
            </>
          )}
          {warning.firstRegistration.eventName && (
            <> — {warning.firstRegistration.eventName}</>
          )}
          .
        </p>
      )}
    </div>
  );
}

export function StatCard({ label, value, hint }) {
  return (
    <div className="card p-5 animate-fade-up">
      <p className="text-sm text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-[var(--text-muted)]">{hint}</p>}
    </div>
  );
}

export function Alert({ type = "info", children }) {
  const styles = {
    info: "border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text)]",
    error: "border-[var(--danger)]/40 bg-[var(--danger-soft)] text-[var(--danger)]",
    success: "border-[var(--success)]/40 bg-[var(--success-soft)] text-[var(--success)]",
    warning: "border-[var(--warning)]/40 bg-[var(--warning-soft)] text-[var(--warning)]",
  };
  return (
    <div className={`rounded-lg border px-3 py-2.5 text-sm ${styles[type] || styles.info}`} role="status">
      {children}
    </div>
  );
}
