"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

function useAuthUser() {
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

  return [user, setUser];
}

export default function SiteHeaderClient({ showAuth = true }) {
  const router = useRouter();
  const [user, setUser] = useAuthUser();
  const [open, setOpen] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 12);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;

    const scrollY = window.scrollY;
    const prev = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
    };

    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev.overflow;
      document.body.style.position = prev.position;
      document.body.style.top = prev.top;
      document.body.style.width = prev.width;
      window.scrollTo(0, scrollY);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    function onResize() {
      if (window.innerWidth >= 768) setOpen(false);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  function close() {
    setOpen(false);
  }

  const mobileMenu =
    portalReady &&
    createPortal(
      <>
        <div
          className={`mobile-nav-overlay md:hidden ${open ? "mobile-nav-overlay--open" : ""}`}
          onClick={close}
          aria-hidden={!open}
        />
        <aside
          className={`mobile-nav-drawer md:hidden ${open ? "mobile-nav-drawer--open" : ""}`}
          aria-hidden={!open}
        >
          <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
            <span className="font-semibold tracking-tight">
              Verify<span className="text-[var(--accent)]">My</span>Ticket
            </span>
            <button type="button" className="burger-btn" aria-label="Fermer" onClick={close}>
              <span className="burger-line burger-line--a" />
              <span className="burger-line burger-line--b" />
              <span className="burger-line burger-line--c" />
            </button>
          </div>

          <nav className="flex flex-col gap-1 overflow-y-auto p-4">
            {user && (
              <p className="mb-2 px-3 text-sm text-[var(--text-muted)]">
                Connecté · <span className="text-[var(--text)]">{user.username}</span>
              </p>
            )}
            <Link href="/check" className="mobile-nav-link" onClick={close}>
              Vérifier un billet
            </Link>
            {showAuth && user && (
              <>
                <Link href="/dashboard" className="mobile-nav-link" onClick={close}>
                  Dashboard
                </Link>
                <Link href="/dashboard/tickets" className="mobile-nav-link" onClick={close}>
                  Mes billets
                </Link>
                <Link href="/dashboard/profile" className="mobile-nav-link" onClick={close}>
                  Profil
                </Link>
                <button
                  type="button"
                  className="mobile-nav-link mobile-nav-link--danger text-left"
                  onClick={logout}
                >
                  Déconnexion
                </button>
              </>
            )}
            {showAuth && user === null && (
              <>
                <Link href="/login" className="mobile-nav-link" onClick={close}>
                  Connexion
                </Link>
                <Link href="/register" className="mobile-nav-link mobile-nav-link--accent" onClick={close}>
                  Inscription
                </Link>
              </>
            )}
            <div className="my-3 border-t border-[var(--border)]" />
            <Link
              href="/mentions-legales"
              className="mobile-nav-link text-[var(--text-muted)]"
              onClick={close}
            >
              Mentions légales
            </Link>
            <Link href="/cgu" className="mobile-nav-link text-[var(--text-muted)]" onClick={close}>
              CGU
            </Link>
            <Link
              href="/confidentialite"
              className="mobile-nav-link text-[var(--text-muted)]"
              onClick={close}
            >
              Confidentialité
            </Link>
            <Link href="/cookies" className="mobile-nav-link text-[var(--text-muted)]" onClick={close}>
              Cookies
            </Link>
          </nav>
        </aside>
      </>,
      document.body
    );

  return (
    <>
      <header
        className={`site-header ${scrolled ? "site-header--scrolled" : ""}`}
      >
        <div className="site-header__inner">
          <Link href="/" className="site-header__brand">
            Verify<span className="text-[var(--accent)]">My</span>Ticket
          </Link>

          <nav className="hidden items-center gap-3 md:flex">
            <Link
              href="/check"
              className="text-sm text-[var(--text-muted)] transition hover:text-[var(--text)]"
            >
              Vérifier
            </Link>
            {showAuth && user === undefined && (
              <span className="h-8 w-24 animate-pulse rounded-lg bg-[var(--bg-elevated)]" />
            )}
            {showAuth && user && (
              <>
                <span className="text-sm text-[var(--text-muted)]">{user.username}</span>
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
              </>
            )}
            {showAuth && user === null && (
              <>
                <Link href="/login" className="btn btn-secondary !py-1.5 !px-3 text-sm">
                  Connexion
                </Link>
                <Link href="/register" className="btn btn-primary !py-1.5 !px-3 text-sm">
                  Inscription
                </Link>
              </>
            )}
          </nav>

          <button
            type="button"
            className="burger-btn"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span className={`burger-line ${open ? "burger-line--a" : ""}`} />
            <span className={`burger-line ${open ? "burger-line--b" : ""}`} />
            <span className={`burger-line ${open ? "burger-line--c" : ""}`} />
          </button>
        </div>
      </header>
      <div className="site-header-spacer" aria-hidden="true" />
      {mobileMenu}
    </>
  );
}
