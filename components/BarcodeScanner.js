"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";

export default function BarcodeScanner({ onScan, onError }) {
  const { t } = useLocale();
  const videoRef = useRef(null);
  const controlsRef = useRef(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    return () => {
      if (controlsRef.current) {
        controlsRef.current.stop();
        controlsRef.current = null;
      }
    };
  }, []);

  async function start() {
    setError(null);
    try {
      const { BrowserMultiFormatReader } = await import("@zxing/browser");
      const reader = new BrowserMultiFormatReader();
      setActive(true);

      const controls = await reader.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (result, err, controls) => {
          if (result) {
            onScan?.(result.getText());
            controls.stop();
            controlsRef.current = null;
            setActive(false);
          }
        }
      );
      controlsRef.current = controls;
    } catch (err) {
      const msg =
        err?.name === "NotAllowedError"
          ? t("scanner.denied")
          : t("common.error");
      setError(msg);
      setActive(false);
      onError?.(msg);
    }
  }

  function stop() {
    if (controlsRef.current) {
      controlsRef.current.stop();
      controlsRef.current = null;
    }
    setActive(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {!active ? (
          <button type="button" className="btn btn-secondary text-sm" onClick={start}>
            {t("scanner.start")}
          </button>
        ) : (
          <button type="button" className="btn btn-secondary text-sm" onClick={stop}>
            {t("scanner.stop")}
          </button>
        )}
      </div>
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      <div
        className={`overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-black ${
          active ? "block" : "hidden"
        }`}
      >
        <video ref={videoRef} className="w-full max-h-64 object-cover" muted playsInline />
      </div>
    </div>
  );
}
