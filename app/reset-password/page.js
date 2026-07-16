"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { PasswordInput } from "@/components/PasswordInput";
import { Alert } from "@/components/ui";

const schema = z.object({
  password: z
    .string()
    .min(8, "8 caractères minimum")
    .regex(/[A-Za-z]/, "Doit contenir une lettre")
    .regex(/[0-9]/, "Doit contenir un chiffre"),
});

function ResetForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  async function onSubmit(values) {
    if (!token) {
      setError("Lien invalide");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: values.password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur");
        return;
      }
      setSuccess(data.message);
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4 p-6">
      {!token && <Alert type="error">Token manquant dans l&apos;URL.</Alert>}
      <div>
        <label className="label" htmlFor="password">
          Nouveau mot de passe
        </label>
        <PasswordInput
          id="password"
          autoComplete="new-password"
          {...register("password")}
        />
        {errors.password && (
          <p className="mt-1 text-sm text-[var(--danger)]">{errors.password.message}</p>
        )}
      </div>
      {error && <Alert type="error">{error}</Alert>}
      {success && (
        <Alert type="success">
          {success}{" "}
          <Link href="/login" className="underline">
            Se connecter
          </Link>
        </Alert>
      )}
      <button type="submit" className="btn btn-primary w-full" disabled={loading || !token}>
        {loading ? "Mise à jour…" : "Réinitialiser"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader showAuth={false} />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight">Nouveau mot de passe</h1>
        <div className="mt-8">
          <Suspense fallback={<div className="card h-40 animate-pulse p-6" />}>
            <ResetForm />
          </Suspense>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
