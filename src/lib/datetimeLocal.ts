import { utcDateToSKDatetimeLocalValue } from "./storeTime";

/** `datetime-local` value for the promo form — always Europe/Bratislava wall time. */
export function dateToDatetimeLocalValue(d: Date): string {
  return utcDateToSKDatetimeLocalValue(d);
}
