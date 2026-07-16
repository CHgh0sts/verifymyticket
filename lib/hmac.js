import { createHmac } from "crypto";

/**
 * HMAC-SHA256 of a barcode/QR value.
 * The raw value must never be stored — only this hash.
 */
export function hashBarcode(rawValue) {
  const secret = process.env.BARCODE_HMAC_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("BARCODE_HMAC_SECRET manquant ou trop court (min 32 caractères)");
  }
  const normalized = String(rawValue).trim();
  return createHmac("sha256", secret).update(normalized, "utf8").digest("hex");
}

/** Extract last n characters (normalized). */
export function extractLastDigits(rawValue, n = 4) {
  const s = String(rawValue).trim();
  if (s.length < n) return s;
  return s.slice(-n);
}

/**
 * HMAC of the last 4 characters only.
 * Domain-separated from full hash (`suffix:4:…`).
 */
export function hashBarcodeSuffix(rawValue, n = 4) {
  const suffix = extractLastDigits(rawValue, n);
  return hashBarcode(`suffix:${n}:${suffix}`);
}

/** Mask all but the last n characters for display only. */
export function maskLastDigits(rawValue, n = 4) {
  const s = String(rawValue).trim();
  if (s.length <= n) return "*".repeat(s.length);
  return "*".repeat(s.length - n) + s.slice(-n);
}

/** Map duplicate count to a risk level. */
export function getRiskLevel(duplicateCount) {
  if (duplicateCount <= 0) {
    return { level: "low", label: "Risque faible", emoji: "🟢" };
  }
  if (duplicateCount === 1) {
    return { level: "medium", label: "Prudence", emoji: "🟠" };
  }
  return { level: "high", label: "Risque élevé", emoji: "🔴" };
}

/** Same calendar day UTC range for event matching. */
export function sameDayRange(isoOrDate) {
  if (!isoOrDate) return null;
  const d = new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return null;
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}
