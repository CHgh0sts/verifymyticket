"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function HeaderActions({ showAuth = true }) {
  const router = useRouter();
  const [user, setUser] = useState(undefined); // undefined = loading

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

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/");
    router.refresh();
  }

  if (!showAuth) return null;

  // Évite un flash Connexion → Dashboard : skeleton discret pendant le chargement
  if (user === undefined) {
    return (
      <div className="flex items-center gap-2 sm:gap-3" aria-hidden="true">
        <span className="hidden h-8 w-20 animate-pulse rounded-lg bg-[var(--bg-elevated)] sm:inline-block" />
        <span className="h-8 w-24 animate-pulse rounded-lg bg-[var(--bg-elevated)]" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-2 sm:gap-3">
        <span className="hidden text-sm text-[var(--text-muted)] sm:inline">
          {user.username}
        </span>
        <Link href="/dashboard" className="btn btn-primary !py-1.5 !px-3 text-sm">
          Dashboard
        </Link>
        <button
          type="button"
          onClick={logout}
          className="btn btn-secondary !py-1.5 !px-3 text-sm"
        >
          Déconnexion
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <Link href="/login" className="btn btn-secondary !py-1.5 !px-3 text-sm">
        Connexion
      </Link>
      <Link
        href="/register"
        className="btn btn-primary !py-1.5 !px-3 text-sm hidden sm:inline-flex"
      >
        Inscription
      </Link>
    </div>
  );
}
