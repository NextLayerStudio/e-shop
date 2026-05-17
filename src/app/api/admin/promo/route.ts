import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminGuard";
import { PromoDiscountType } from "@/generated/prisma/enums";
import { validateAdminPromoPayload } from "@/lib/adminPromoBody";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Neplatné dáta." }, { status: 400 });
  }

  const result = validateAdminPromoPayload(json);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error.message },
      { status: result.error.status }
    );
  }

  const d = result.data;

  try {
    const created = await prisma.promoCode.create({
      data: {
        code: d.code,
        note: d.note,
        discountType: d.discountType,
        percentOff:
          d.discountType === PromoDiscountType.PERCENT ? d.percentOff : null,
        amountOffCents:
          d.discountType === PromoDiscountType.FIXED ? d.amountOffCents : null,
        startsAt: d.startsAt,
        endsAt: d.endsAt,
        isActive: d.isActive,
        minOrderCents: d.minOrderCents,
      },
    });
    return NextResponse.json({ id: created.id });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "Kód s týmto názvom už existuje." },
        { status: 409 }
      );
    }
    console.error("[admin/promo POST]", e);
    return NextResponse.json(
      { error: "Nepodarilo sa vytvoriť kód." },
      { status: 500 }
    );
  }
}
