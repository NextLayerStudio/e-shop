import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminGuard";
import { PromoDiscountType } from "@/generated/prisma/enums";
import { validateAdminPromoPayload } from "@/lib/adminPromoBody";

export const runtime = "nodejs";

const toggleSchema = z
  .object({
    isActive: z.boolean(),
  })
  .strict();

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const { id } = await ctx.params;
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Neplatné dáta." }, { status: 400 });
  }
  const parsed = toggleSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Neplatné dáta." }, { status: 400 });
  }

  try {
    await prisma.promoCode.update({
      where: { id },
      data: { isActive: parsed.data.isActive },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Kód sa nepodarilo upraviť." },
      { status: 404 }
    );
  }
}

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const { id } = await ctx.params;
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
    await prisma.promoCode.update({
      where: { id },
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
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "Kód s týmto názvom už existuje." },
        { status: 409 }
      );
    }
    console.error("[admin/promo PUT]", e);
    return NextResponse.json(
      { error: "Kód sa nepodarilo uložiť." },
      { status: 404 }
    );
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const { id } = await ctx.params;

  try {
    await prisma.promoCode.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Kód sa nepodarilo odstrániť." },
      { status: 404 }
    );
  }
}
