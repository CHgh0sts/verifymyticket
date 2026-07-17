"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { PasswordInput } from "@/components/PasswordInput";
import { Alert } from "@/components/ui";
import { useLocale } from "@/components/LocaleProvider";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  totpCode: z.string().optional(),
});

function LoginForm() {
  const { t } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const oauthError = searchParams.get("error");
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [needs2fa, setNeeds2fa] = useState(false);

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
      if (res.ok && data.requires2fa) {
        setNeeds2fa(true);
        return;
      }
      if (!res.ok) {
        setServerError(data.error || t("common.error"));
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setServerError(t("common.networkError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <a href="/api/auth/google" className="btn btn-secondary flex w-full justify-center">
        {t("auth.google")}
      </a>
      <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
        <span className="h-px flex-1 bg-[var(--border)]" />
        {t("common.or")}
        <span className="h-px flex-1 bg-[var(--border)]" />
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4 p-6">
        {(oauthError || serverError) && (
          <Alert type="error">
            {serverError ||
              (oauthError === "google_not_configured"
                ? t("auth.googleNotConfigured")
                : t("auth.googleFailed"))}
          </Alert>
        )}
        <div>
          <label className="label" htmlFor="email">
            {t("auth.email")}
          </label>
          <input
            id="email"
            type="email"
            className="input"
            autoComplete="email"
            {...register("email")}
          />
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
            autoComplete="current-password"
            {...register("password")}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-[var(--danger)]">{errors.password.message}</p>
          )}
        </div>
        {needs2fa && (
          <div>
            <label className="label" htmlFor="totpCode">
              {t("auth.totp")}
            </label>
            <input
              id="totpCode"
              className="input"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder={t("auth.totpPlaceholder")}
              {...register("totpCode")}
            />
          </div>
        )}
        <button type="submit" className="btn btn-primary w-full" disabled={loading}>
          {loading
            ? t("auth.submittingLogin")
            : needs2fa
              ? t("auth.validateCode")
              : t("auth.submitLogin")}
        </button>
        <p className="text-center text-sm text-[var(--text-muted)]">
          <Link href="/forgot-password" className="text-[var(--accent)] hover:underline">
            {t("auth.forgot")}
          </Link>
        </p>
      </form>
    </div>
  );
}

export default function LoginPage() {
  const { t } = useLocale();
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader showAuth={false} />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight">{t("auth.loginTitle")}</h1>
        <p className="mt-2 text-[var(--text-muted)]">
          {t("auth.loginNoAccount")}{" "}
          <Link href="/register" className="text-[var(--accent)] hover:underline">
            {t("auth.signUp")}
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
