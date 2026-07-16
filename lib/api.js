import { NextResponse } from "next/server";
import { formatZodError } from "./validations";

export function jsonOk(data, status = 200) {
  return NextResponse.json(data, { status });
}

export function jsonError(message, status = 400, extra = {}) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export function jsonZodError(zodError) {
  return NextResponse.json(
    { error: "Données invalides", details: formatZodError(zodError) },
    { status: 400 }
  );
}

export function emptyToNull(value) {
  if (value === undefined || value === null || value === "") return null;
  return value;
}

export function parseOptionalDate(value) {
  if (!value || value === "") return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export function parseOptionalPrice(value) {
  if (value === undefined || value === null || value === "") return null;
  const n = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  if (Number.isNaN(n) || n < 0) return null;
  return n;
}

export function formatDateFr(date) {
  if (!date) return null;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}
