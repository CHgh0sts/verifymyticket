"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { Alert } from "@/components/ui";

function VerifyContent() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const error = searchParams.get("error");

  return (
    <div className="card space-y-4 p-6">
      {success && (
        <Alert type="success">
          Email vérifié avec succès. Vous pouvez maintenant vous connecter.
        </Alert>
      )}
      {error === "missing" && <Alert type="error">Token manquant.</Alert>}
      {error === "invalid" && (
        <Alert type="error">Lien invalide ou expiré. Demandez une nouvelle vérification.</Alert>
      )}
      {!success && !error && (
        <Alert type="info">
          Ouvrez le lien reçu par email pour activer votre compte. En développement, le
          lien est affiché dans la console du serveur.
        </Alert>
      )}
      <Link href="/login" className="btn btn-primary w-full">
        Aller à la connexion
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader showAuth={false} />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight">Vérification email</h1>
        <div className="mt-8">
          <Suspense fallback={<div className="card h-32 animate-pulse p-6" />}>
            <VerifyContent />
          </Suspense>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
