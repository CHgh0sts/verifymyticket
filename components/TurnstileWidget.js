"use client";

import { useEffect, useRef, useState } from "react";

export default function TurnstileWidget({ onToken }) {
  const ref = useRef(null);
  const widgetId = useRef(null);
  const [ready, setReady] = useState(false);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey) {
      onToken?.("dev-skip");
      return;
    }

    function render() {
      if (!window.turnstile || !ref.current) return;
      if (widgetId.current != null) return;
      widgetId.current = window.turnstile.render(ref.current, {
        sitekey: siteKey,
        theme: "dark",
        callback: (token) => onToken?.(token),
        "expired-callback": () => onToken?.(""),
        "error-callback": () => onToken?.(""),
      });
      setReady(true);
    }

    if (window.turnstile) {
      render();
      return;
    }

    const existing = document.querySelector('script[data-turnstile]');
    if (existing) {
      existing.addEventListener("load", render);
      return () => existing.removeEventListener("load", render);
    }

    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.dataset.turnstile = "1";
    script.onload = render;
    document.head.appendChild(script);

    return () => {
      if (widgetId.current != null && window.turnstile) {
        window.turnstile.remove(widgetId.current);
        widgetId.current = null;
      }
    };
  }, [siteKey, onToken]);

  if (!siteKey) {
    return (
      <p className="text-xs text-[var(--text-muted)]">
        CAPTCHA désactivé en développement (clés Turnstile non configurées).
      </p>
    );
  }

  return (
    <div>
      <div ref={ref} />
      {!ready && (
        <p className="text-xs text-[var(--text-muted)]">Chargement du CAPTCHA…</p>
      )}
    </div>
  );
}
