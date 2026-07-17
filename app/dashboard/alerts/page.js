import { Suspense } from "react";
import AlertsClient from "./AlertsClient";

export default function AlertsPage() {
  return (
    <Suspense fallback={<p className="text-[var(--text-muted)]">Chargement…</p>}>
      <AlertsClient />
    </Suspense>
  );
}
