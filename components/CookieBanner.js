"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";

const STORAGE_KEY = "vmt_cookie_consent";

export default function CookieBanner() {
  const { t } = useLocale();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  function save(value) {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ choice: value, at: new Date().toISOString() })
      );
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="cookie-banner" role="dialog" aria-label={t("footer.cookies")}>
      <div className="cookie-banner__inner">
        <p className="text-sm leading-relaxed text-[var(--text-muted)]">
          {t("cookies.text")}{" "}
          <Link href="/cookies" className="text-[var(--accent)] hover:underline">
            {t("footer.cookies")}
          </Link>
          {" · "}
          <Link href="/confidentialite" className="text-[var(--accent)] hover:underline">
            {t("footer.privacy")}
          </Link>
          .
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-primary !py-1.5 !px-3 text-sm"
            onClick={() => save("accepted")}
          >
            {t("cookies.accept")}
          </button>
          <Link href="/cookies" className="btn btn-secondary !py-1.5 !px-3 text-sm">
            {t("cookies.details")}
          </Link>
        </div>
      </div>
    </div>
  );
}
