"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { Alert } from "@/components/ui";

const schema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  async function onSubmit(values) {
    setLoading(true);
    setServerError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        setServerError(data.error || "Connexion impossible");
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setServerError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4 p-6">
      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input id="email" type="email" className="input" autoComplete="email" {...register("email")} />
        {errors.email && (
          <p className="mt-1 text-sm text-[var(--danger)]">{errors.email.message}</p>
        )}
      </div>
      <div>
        <label className="label" htmlFor="password">
          Mot de passe
        </label>
        <input
          id="password"
          type="password"
          className="input"
          autoComplete="current-password"
          {...register("password")}
        />
        {errors.password && (
          <p className="mt-1 text-sm text-[var(--danger)]">{errors.password.message}</p>
        )}
      </div>
      {serverError && <Alert type="error">{serverError}</Alert>}
      <button type="submit" className="btn btn-primary w-full" disabled={loading}>
        {loading ? "Connexion…" : "Se connecter"}
      </button>
      <p className="text-center text-sm text-[var(--text-muted)]">
        <Link href="/forgot-password" className="text-[var(--accent)] hover:underline">
          Mot de passe oublié ?
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader showAuth={false} />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight">Connexion</h1>
        <p className="mt-2 text-[var(--text-muted)]">
          Pas encore de compte ?{" "}
          <Link href="/register" className="text-[var(--accent)] hover:underline">
            S&apos;inscrire
          </Link>
        </p>
        <div className="mt-8">
          <Suspense fallback={<div className="card h-48 animate-pulse p-6" />}>
            <LoginForm />
          </Suspense>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
