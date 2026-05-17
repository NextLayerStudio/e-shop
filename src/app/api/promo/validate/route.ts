import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import {
  computeDiscountCents,
  isPromoUsableNow,
  normalizePromoCodeInput,
  promoMeetsMinimumOrder,
} from "@/lib/promo";

export const runtime = "nodejs";

const bodySchema = z.object({
  code: z.string().min(1).max(40),
  subtotalCents: z.number().int().min(0).max(50_000_000),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Neplatné dáta." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Neplatné dáta." }, { status: 400 });
  }

  const codeNorm = normalizePromoCodeInput(parsed.data.code);
  if (!codeNorm) {
    return NextResponse.json(
      { error: "Zadaj kód kupónu.", ok: false },
      { status: 400 }
    );
  }

  const promo = await prisma.promoCode.findUnique({
    where: { code: codeNorm },
  });

  if (!promo) {
    return NextResponse.json({
      ok: false,
      error: "Tento kód neexistuje.",
    });
  }

  if (!isPromoUsableNow(promo)) {
    return NextResponse.json({
      ok: false,
      error: "Kupón nie je platný alebo už expiroval.",
    });
  }

  if (!promoMeetsMinimumOrder(promo, parsed.data.subtotalCents)) {
    const min = promo.minOrderCents ?? 0;
    return NextResponse.json({
      ok: false,
      error: `Minimálna hodnota objednávky pre tento kupón je ${formatPrice(min)}.`,
    });
  }

  const discountCents = computeDiscountCents(
    promo,
    parsed.data.subtotalCents
  );
  const totalCents = Math.max(
    0,
    parsed.data.subtotalCents - discountCents
  );

  return NextResponse.json({
    ok: true,
    code: promo.code,
    discountType: promo.discountType,
    discountCents,
    subtotalCents: parsed.data.subtotalCents,
    totalCents,
    percentOff: promo.percentOff,
    amountOffCents: promo.amountOffCents,
  });
}
