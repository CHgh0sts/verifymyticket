"use client";

import { useEffect } from "react";

/**
 * Animation de mouvement au scroll sur la landing (parallax léger).
 */
export default function LandingScrollMotion() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const root = document.documentElement;
    let ticking = false;

    function update() {
      const y = window.scrollY;
      const vh = window.innerHeight || 1;
      const p = Math.min(1, y / (vh * 0.85));

      root.style.setProperty("--scroll-y", String(y));
      root.style.setProperty("--scroll-p", String(p));
      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      root.style.removeProperty("--scroll-y");
      root.style.removeProperty("--scroll-p");
    };
  }, []);

  return null;
}
