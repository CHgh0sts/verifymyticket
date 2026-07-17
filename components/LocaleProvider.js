"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getDictionary, normalizeLocale, translate } from "@/lib/i18n";

const LocaleContext = createContext({
  locale: "fr",
  dict: getDictionary("fr"),
  t: (key, vars) => translate(getDictionary("fr"), key, vars),
  setLocale: () => {},
});

export function LocaleProvider({ children }) {
  const [locale, setLocaleState] = useState("fr");

  useEffect(() => {
    const fromStorage = localStorage.getItem("vmt_locale");
    const fromCookie = document.cookie.match(/vmt_locale=([^;]+)/)?.[1];
    const saved = normalizeLocale(fromStorage || fromCookie);
    setLocaleState(saved);
    document.documentElement.lang = saved;
  }, []);

  const setLocale = useCallback((next) => {
    const loc = normalizeLocale(next);
    setLocaleState(loc);
    localStorage.setItem("vmt_locale", loc);
    document.cookie = `vmt_locale=${loc};path=/;max-age=31536000;SameSite=Lax`;
    document.documentElement.lang = loc;
  }, []);

  const dict = useMemo(() => getDictionary(locale), [locale]);

  const t = useCallback(
    (key, vars) => translate(dict, key, vars),
    [dict]
  );

  const value = useMemo(
    () => ({ locale, dict, t, setLocale }),
    [locale, dict, t, setLocale]
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}

export function LocaleSwitcher({ className = "" }) {
  const { locale, setLocale, t } = useLocale();
  return (
    <label className={`inline-flex items-center gap-2 text-sm ${className}`}>
      <span className="sr-only">{t("lang")}</span>
      <select
        className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1 text-sm"
        value={locale}
        onChange={(e) => setLocale(e.target.value)}
        aria-label={t("lang")}
      >
        <option value="fr">FR</option>
        <option value="en">EN</option>
      </select>
    </label>
  );
}
