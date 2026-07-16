"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { Alert } from "@/components/ui";

function Content() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const error = searchParams.get("error");

  return (
    <div className="card space-y-4 p-6">
      {success && (
        <Alert type="success">
          Votre nouveau mot de passe est actif. Utilisez-le lors de votre prochaine
          connexion.
        </Alert>
      )}
      {error === "missing" && <Alert type="error">Token manquant.</Alert>}
      {error === "invalid" && (
        <Alert type="error">Lien invalide ou expiré. Refaites la demande depuis votre profil.</Alert>
      )}
      {!success && !error && (
        <Alert type="info">
          Ouvrez le lien reçu par email pour activer votre nouveau mot de passe.
        </Alert>
      )}
      <Link href="/dashboard/profile" className="btn btn-primary w-full">
        Retour au profil
      </Link>
      <Link href="/login" className="btn btn-secondary w-full">
        Se connecter
      </Link>
    </div>
  );
}

export default function ConfirmPasswordChangePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader showAuth={false} />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight">
          Changement de mot de passe
        </h1>
        <div className="mt-8">
          <Suspense fallback={<div className="card h-32 animate-pulse p-6" />}>
            <Content />
          </Suspense>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
