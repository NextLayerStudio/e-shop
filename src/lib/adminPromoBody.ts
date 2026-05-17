import { z } from "zod";
import { PromoDiscountType } from "@/generated/prisma/enums";
import { normalizePromoCodeInput } from "@/lib/promo";

export const adminPromoBodySchema = z.object({
  code: z.string().min(2).max(40),
  note: z.string().max(500).optional().or(z.literal("")),
  discountType: z.enum(["PERCENT", "FIXED"]),
  percentOff: z.number().int().min(1).max(100).optional().nullable(),
  amountOffCents: z.number().int().min(1).max(1_000_000).optional().nullable(),
  startsAt: z.string().optional(),
  endsAt: z.union([z.string(), z.null()]).optional(),
  isActive: z.boolean().optional(),
  minOrderCents: z.number().int().min(0).max(10_000_000).optional().nullable(),
});

export type AdminPromoPrismaData = {
  code: string;
  note: string | null;
  discountType: PromoDiscountType;
  percentOff: number | null;
  amountOffCents: number | null;
  startsAt: Date;
  endsAt: Date | null;
  isActive: boolean;
  minOrderCents: number | null;
};

export type AdminPromoValidationError = { message: string; status: number };

export function validateAdminPromoPayload(
  json: unknown
):
  | { ok: true; data: AdminPromoPrismaData }
  | { ok: false; error: AdminPromoValidationError } {
  const parsed = adminPromoBodySchema.safeParse(json);
  if (!parsed.success) {
    return {
      ok: false,
      error: { message: "Skontroluj údaje formulára.", status: 400 },
    };
  }

  const code = normalizePromoCodeInput(parsed.data.code);
  if (code.length < 2) {
    return {
      ok: false,
      error: { message: "Kód je príliš krátky.", status: 400 },
    };
  }

  const discountTypeEnum =
    parsed.data.discountType === "PERCENT"
      ? PromoDiscountType.PERCENT
      : PromoDiscountType.FIXED;

  if (discountTypeEnum === PromoDiscountType.PERCENT) {
    const p = parsed.data.percentOff;
    if (p == null) {
      return {
        ok: false,
        error: { message: "Zadaj percentá zľavy.", status: 400 },
      };
    }
  } else {
    const a = parsed.data.amountOffCents;
    if (a == null) {
      return {
        ok: false,
        error: { message: "Zadaj sumu zľavy v centoch.", status: 400 },
      };
    }
  }

  // startsAt/endsAt must be full ISO strings (admin form sends UTC via datetimeLocalInputToIsoUtc).
  const startsAt =
    parsed.data.startsAt && String(parsed.data.startsAt).trim().length > 0
      ? new Date(parsed.data.startsAt)
      : new Date();
  let endsAt: Date | null = null;
  // Expect ISO UTC strings from the admin UI (datetime-local converted in browser).
  if (parsed.data.endsAt === undefined) {
    endsAt = null;
  } else if (
    parsed.data.endsAt === null ||
    String(parsed.data.endsAt).trim() === ""
  ) {
    endsAt = null;
  } else {
    endsAt = new Date(parsed.data.endsAt as string);
  }

  if (Number.isNaN(startsAt.getTime())) {
    return {
      ok: false,
      error: {
        message: "Neplatný dátum začiatku platnosti.",
        status: 400,
      },
    };
  }
  if (endsAt && Number.isNaN(endsAt.getTime())) {
    return {
      ok: false,
      error: { message: "Neplatný dátum konca platnosti.", status: 400 },
    };
  }
  if (endsAt && endsAt <= startsAt) {
    return {
      ok: false,
      error: {
        message: "Koniec platnosti musí byť po začiatku.",
        status: 400,
      },
    };
  }

  let minOrderCents: number | null = null;
  if (
    parsed.data.minOrderCents != null &&
    parsed.data.minOrderCents > 0
  ) {
    minOrderCents = parsed.data.minOrderCents;
  }

  return {
    ok: true,
    data: {
      code,
      note: parsed.data.note?.trim() || null,
      discountType: discountTypeEnum,
      percentOff:
        discountTypeEnum === PromoDiscountType.PERCENT
          ? parsed.data.percentOff!
          : null,
      amountOffCents:
        discountTypeEnum === PromoDiscountType.FIXED
          ? parsed.data.amountOffCents!
          : null,
      startsAt,
      endsAt,
      isActive: parsed.data.isActive ?? true,
      minOrderCents,
    },
  };
}
