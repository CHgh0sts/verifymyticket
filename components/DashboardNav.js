"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Vue d'ensemble", exact: true },
  { href: "/dashboard/tickets", label: "Mes billets", exact: true },
  { href: "/dashboard/tickets/new", label: "Ajouter" },
  { href: "/dashboard/duplicates", label: "Doublons" },
  { href: "/dashboard/profile", label: "Profil" },
];

export default function DashboardNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="border-b border-[var(--border)] lg:w-56 lg:shrink-0 lg:border-b-0 lg:border-r lg:pr-6">
      <div className="mb-6 hidden lg:block">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Verify<span className="text-[var(--accent)]">My</span>Ticket
        </Link>
      </div>
      <nav className="flex gap-1 overflow-x-auto pb-3 lg:flex-col lg:overflow-visible lg:pb-0">
        {links.map((link) => {
          const active = link.exact
            ? pathname === link.href
            : pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm transition ${
                active
                  ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text)]"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={logout}
          className="mt-auto whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--danger)] lg:mt-8"
        >
          Déconnexion
        </button>
      </nav>
    </aside>
  );
}
