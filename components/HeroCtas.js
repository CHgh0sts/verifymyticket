"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";

export default function HeroCtas() {
  const { t } = useLocale();
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setUser(data.authenticated ? data.user : null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (user === undefined) {
    return (
      <div className="mt-8 flex flex-wrap gap-3">
        <span className="h-10 w-36 animate-pulse rounded-[10px] bg-[var(--bg-elevated)]" />
        <span className="h-10 w-36 animate-pulse rounded-[10px] bg-[var(--bg-elevated)]" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/check" className="btn btn-primary">
          {t("hero.ctaCheck")}
        </Link>
        <Link href="/dashboard" className="btn btn-secondary">
          {t("hero.ctaDashboard")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-wrap gap-3">
      <Link href="/check" className="btn btn-primary">
        {t("hero.ctaCheck")}
      </Link>
      <Link href="/register" className="btn btn-secondary">
        {t("hero.ctaRegister")}
      </Link>
    </div>
  );
}
