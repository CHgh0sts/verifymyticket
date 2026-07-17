"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { PasswordInput } from "@/components/PasswordInput";
import { Alert } from "@/components/ui";
import { useLocale } from "@/components/LocaleProvider";

const schema = z.object({
  username: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[a-zA-Z0-9_-]+$/),
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Za-z]/)
    .regex(/[0-9]/),
});

export default function RegisterPage() {
  const { t } = useLocale();
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  async function onSubmit(values) {
    setLoading(true);
    setServerError("");
    setSuccess("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        setServerError(data.error || t("common.error"));
        return;
      }
      setSuccess(data.message);
    } catch {
      setServerError(t("common.networkError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader showAuth={false} />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight">{t("auth.registerTitle")}</h1>
        <p className="mt-2 text-[var(--text-muted)]">
          {t("auth.registerHasAccount")}{" "}
          <Link href="/login" className="text-[var(--accent)] hover:underline">
            {t("auth.submitLogin")}
          </Link>
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="card mt-8 space-y-4 p-6">
          <div>
            <label className="label" htmlFor="username">
              {t("auth.username")}
            </label>
            <input id="username" className="input" autoComplete="username" {...register("username")} />
            {errors.username && (
              <p className="mt-1 text-sm text-[var(--danger)]">{errors.username.message}</p>
            )}
          </div>
          <div>
            <label className="label" htmlFor="email">
              {t("auth.email")}
            </label>
            <input id="email" type="email" className="input" autoComplete="email" {...register("email")} />
            {errors.email && (
              <p className="mt-1 text-sm text-[var(--danger)]">{errors.email.message}</p>
            )}
          </div>
          <div>
            <label className="label" htmlFor="password">
              {t("auth.password")}
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
          {serverError && <Alert type="error">{serverError}</Alert>}
          {success && <Alert type="success">{success}</Alert>}
          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? t("auth.creating") : t("auth.createAccount")}
          </button>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}
