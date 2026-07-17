import { hashPersonNameKey } from "./hmac";

/**
 * Normalise un nom de personne pour comparaison floue :
 * - casse ignorée
 * - accents retirés
 * - ponctuation ignorée
 * - ordre des mots ignoré ("Marie Bru" === "BRU MARIE")
 */
export function normalizePersonName(raw) {
  if (raw == null) return "";
  const s = String(raw)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, " ")
    .trim();
  if (!s) return "";
  return s
    .split(/\s+/)
    .filter(Boolean)
    .sort()
    .join(" ");
}

/** HMAC du nom normalisé — matching sans stocker le nom brut sur les vérifs publiques. */
export function hashPersonName(raw) {
  const key = normalizePersonName(raw);
  if (!key) return null;
  return hashPersonNameKey(key);
}
