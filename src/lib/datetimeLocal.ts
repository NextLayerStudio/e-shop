/** Value for HTML `datetime-local` in the runtime’s local timezone. */
export function dateToDatetimeLocalValue(d: Date): string {
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
}
