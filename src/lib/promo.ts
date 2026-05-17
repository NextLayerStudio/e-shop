import type { PromoCode } from "@/generated/prisma/client";
import { PromoDiscountType } from "@/generated/prisma/enums";

export function normalizePromoCodeInput(code: string): string {
  return code.trim().toUpperCase();
}

export function isPromoUsableNow(
  promo: Pick<PromoCode, "isActive" | "startsAt" | "endsAt">,
  now = new Date()
): boolean {
  if (!promo.isActive) return false;
  if (now < promo.startsAt) return false;
  if (promo.endsAt != null && now > promo.endsAt) return false;
  return true;
}

/** True if cart subtotal meets the promo minimum (when set). */
export function promoMeetsMinimumOrder(
  promo: Pick<PromoCode, "minOrderCents">,
  subtotalCents: number
): boolean {
  const min = promo.minOrderCents;
  if (min == null || min <= 0) return true;
  return subtotalCents >= min;
}

/**
 * Discount in cents, never greater than subtotal, never negative.
 */
export function computeDiscountCents(
  promo: Pick<
    PromoCode,
    "discountType" | "percentOff" | "amountOffCents"
  >,
  subtotalCents: number
): number {
  if (subtotalCents <= 0) return 0;
  if (promo.discountType === PromoDiscountType.PERCENT) {
    const p = promo.percentOff ?? 0;
    if (p <= 0) return 0;
    const capped = Math.min(100, p);
    return Math.min(
      subtotalCents,
      Math.floor((subtotalCents * capped) / 100)
    );
  }
  const fixed = promo.amountOffCents ?? 0;
  if (fixed <= 0) return 0;
  return Math.min(subtotalCents, fixed);
}
