"use client";

import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { useLocale } from "@/components/LocaleProvider";

export default function FaqPageClient() {
  const { t, dict } = useLocale();
  const items = dict.faq?.items || [];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
        <p className="text-sm font-medium text-[var(--accent)]">{t("faq.eyebrow")}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("faq.title")}
        </h1>
        <p className="mt-3 max-w-2xl text-[var(--text-muted)]">{t("faq.intro")}</p>

        <div className="mt-10 space-y-3">
          {items.map((item) => (
            <details
              key={item.q}
              className="group rounded-[12px] border border-[var(--border)] bg-[var(--bg-card)] px-5 py-4"
            >
              <summary className="cursor-pointer list-none font-medium marker:content-none [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-3">
                  {item.q}
                  <span className="text-[var(--accent)] transition group-open:rotate-45">
                    +
                  </span>
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
                {item.a}
              </p>
            </details>
          ))}
        </div>

        <p className="mt-10 text-sm text-[var(--text-muted)]">
          {t("faq.more")}{" "}
          <Link href="/comment-ca-marche" className="text-[var(--accent)] hover:underline">
            {t("faq.how")}
          </Link>{" "}
          ·{" "}
          <Link href="/confidentialite" className="text-[var(--accent)] hover:underline">
            {t("faq.privacy")}
          </Link>
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
