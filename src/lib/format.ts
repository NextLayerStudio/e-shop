import { STORE_TIMEZONE } from "./storeTime";

/**
 * Format a price stored in cents as a Slovak EUR string, e.g. 1999 -> "19,99 €".
 */
export function formatPrice(cents: number): string {
  const euros = cents / 100;
  return new Intl.NumberFormat("sk-SK", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(euros);
}

/**
 * Format a Date as a Slovak short date string (e.g. "25. 4. 2026").
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("sk-SK", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).format(d);
}

/**
 * Format a Date with time, e.g. "25. 4. 2026 14:32" (Intl default TZ of runtime).
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("sk-SK", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export { STORE_TIMEZONE };

/**
 * Like {@link formatDateTime} but in {@link STORE_TIMEZONE} — Slovak shop clock for admins.
 */
export function formatDateTimeStoreTz(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("sk-SK", {
    timeZone: STORE_TIMEZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/**
 * Generate a URL-safe slug from a Slovak/diacritic string.
 */
export function slugify(text: string): string {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
