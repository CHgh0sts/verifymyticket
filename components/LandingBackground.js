"use client";

import { useEffect, useRef } from "react";

function midMask(x1, y1, x2, y2, x3, y3) {
  return [
    `radial-gradient(ellipse 55% 50% at ${x1}% ${y1}%, #000 0%, transparent 72%)`,
    `radial-gradient(ellipse 48% 42% at ${x2}% ${y2}%, #000 0%, transparent 70%)`,
    `radial-gradient(ellipse 40% 38% at ${x3}% ${y3}%, #000 0%, transparent 68%)`,
  ].join(", ");
}

function brightMask(x1, y1, x2, y2, x3, y3) {
  return [
    `radial-gradient(ellipse 38% 34% at ${x1}% ${y1}%, #000 0%, transparent 68%)`,
    `radial-gradient(ellipse 32% 36% at ${x2}% ${y2}%, #000 0%, transparent 65%)`,
    `radial-gradient(ellipse 28% 30% at ${x3}% ${y3}%, #000 0%, transparent 62%)`,
  ].join(", ");
}

function applyMask(el, value) {
  el.style.webkitMaskImage = value;
  el.style.maskImage = value;
  el.style.webkitMaskComposite = "source-over";
  el.style.maskComposite = "add";
}

/**
 * Damier de points + zones lumineuses animées dynamiquement sur la page.
 */
export default function LandingBackground() {
  const midRef = useRef(null);
  const brightRef = useRef(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mid = midRef.current;
    const bright = brightRef.current;
    if (!mid || !bright) return;

    if (reduce) {
      applyMask(mid, midMask(22, 32, 78, 58, 48, 88));
      applyMask(bright, brightMask(30, 28, 72, 52, 55, 78));
      return;
    }

    const t0 = performance.now();

    function frame(now) {
      const t = (now - t0) / 1000;
      const clamp = (n) => Math.min(100, Math.max(0, n));

      const m1x = clamp(22 + Math.sin(t * 0.23) * 28 + Math.cos(t * 0.11) * 8);
      const m1y = clamp(30 + Math.cos(t * 0.19) * 22 + Math.sin(t * 0.09) * 10);
      const m2x = clamp(72 + Math.cos(t * 0.17) * 22 + Math.sin(t * 0.13) * 12);
      const m2y = clamp(58 + Math.sin(t * 0.21) * 24 + Math.cos(t * 0.08) * 8);
      const m3x = clamp(48 + Math.sin(t * 0.15 + 1.2) * 30);
      const m3y = clamp(78 + Math.cos(t * 0.18 + 0.6) * 16);

      const b1x = clamp(32 + Math.sin(t * 0.31 + 0.4) * 34);
      const b1y = clamp(28 + Math.cos(t * 0.27 + 0.8) * 26);
      const b2x = clamp(70 + Math.cos(t * 0.25 + 1.1) * 28);
      const b2y = clamp(55 + Math.sin(t * 0.29 + 0.3) * 30);
      const b3x = clamp(50 + Math.sin(t * 0.22 + 2.1) * 32);
      const b3y = clamp(72 + Math.cos(t * 0.26 + 1.5) * 20);

      applyMask(mid, midMask(m1x, m1y, m2x, m2y, m3x, m3y));
      applyMask(bright, brightMask(b1x, b1y, b2x, b2y, b3x, b3y));

      rafRef.current = requestAnimationFrame(frame);
    }

    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div className="landing-bg" aria-hidden="true">
      <div className="landing-bg__base" />
      <div className="landing-bg__dots landing-bg__dots--dim" />
      <div ref={midRef} className="landing-bg__dots landing-bg__dots--mid" />
      <div ref={brightRef} className="landing-bg__dots landing-bg__dots--bright" />
      <div className="landing-bg__vignette" />
    </div>
  );
}
