import { hashBarcode } from "./hmac";

/**
 * Normalise un champ d'emplacement (bloc / rang / siège).
 */
export function normalizeSeatPart(raw) {
  if (raw == null) return "";
  return String(raw)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, "")
    .trim();
}

/**
 * Clé canonique d'emplacement : block|row|seat (parties vides omises côté hash via placeholders).
 * Ex. bloc A, rang 12, siège 8 → "a|12|8"
 */
export function normalizeSeatKey({ block, row, seat } = {}) {
  const b = normalizeSeatPart(block);
  const r = normalizeSeatPart(row);
  const s = normalizeSeatPart(seat);
  if (!b && !r && !s) return "";
  return `${b}|${r}|${s}`;
}

/** HMAC de l'emplacement normalisé (domaine `seat:`). */
export function hashSeatKey(parts) {
  const key = normalizeSeatKey(parts);
  if (!key || key === "||") return null;
  return hashBarcode(`seat:${key}`);
}
