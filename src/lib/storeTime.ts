import { DateTime } from "luxon";

/** All promo validity windows & admin `datetime-local` values use this zone. */
export const STORE_TIMEZONE = "Europe/Bratislava";

/**
 * Parse admin/API datetime input into a UTC `Date` for Prisma.
 *
 * - Strings with `Z` or numeric offset (`+02:00`) → absolute instant (legacy / ISO).
 * - Naive `YYYY-MM-DDTHH:mm` → wall clock in {@link STORE_TIMEZONE} (Slovakia, DST-aware).
 */
export function parsePromoDateInputToUtcDate(input: string): Date | null {
  const t = input.trim();
  if (!t) return null;

  if (/Z$/i.test(t)) {
    const dt = DateTime.fromISO(t, { zone: "utc" });
    return dt.isValid ? dt.toJSDate() : null;
  }

  // Offset form e.g. +02:00 or +0200 at end (not naive local)
  if (/[+-]\d{2}:?\d{2}$/.test(t)) {
    const dt = DateTime.fromISO(t, { setZone: true });
    return dt.isValid ? dt.toJSDate() : null;
  }

  const wall = DateTime.fromISO(t, { zone: STORE_TIMEZONE });
  return wall.isValid ? wall.toUTC().toJSDate() : null;
}

/** Format a UTC instant for HTML `datetime-local` in Slovak store time. */
export function utcDateToSKDatetimeLocalValue(d: Date): string {
  const dt = DateTime.fromJSDate(d, { zone: "utc" }).setZone(STORE_TIMEZONE);
  if (!dt.isValid) return "";
  return dt.toFormat("yyyy-MM-dd'T'HH:mm");
}
