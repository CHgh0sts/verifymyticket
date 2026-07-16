"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { Alert } from "@/components/ui";

const schema = z.object({
  email: z.string().email("Email invalide"),
});

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  async function onSubmit(values) {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur");
        return;
      }
      setMessage(data.message);
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader showAuth={false} />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight">Mot de passe oublié</h1>
        <p className="mt-2 text-[var(--text-muted)]">
          <Link href="/login" className="text-[var(--accent)] hover:underline">
            Retour à la connexion
          </Link>
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="card mt-8 space-y-4 p-6">
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input id="email" type="email" className="input" {...register("email")} />
            {errors.email && (
              <p className="mt-1 text-sm text-[var(--danger)]">{errors.email.message}</p>
            )}
          </div>
          {error && <Alert type="error">{error}</Alert>}
          {message && <Alert type="success">{message}</Alert>}
          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? "Envoi…" : "Envoyer le lien"}
          </button>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}
