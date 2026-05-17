/** Value for HTML `datetime-local` in the runtime’s local timezone. */
export function dateToDatetimeLocalValue(d: Date): string {
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
}

/**
 * Browser only: converts a `datetime-local` value into a UTC ISO string for the API.
 * `datetime-local` has no TZ; `new Date(value)` interprets it in the user’s browser
 * timezone — `toISOString()` then sends an unambiguous instant (fixes Vercel UTC vs SK).
 */
export function datetimeLocalInputToIsoUtc(value: string): string | null {
  const t = value.trim();
  if (!t) return null;
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}
