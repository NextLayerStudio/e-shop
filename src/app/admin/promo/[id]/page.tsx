import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PromoDiscountType } from "@/generated/prisma/enums";
import { dateToDatetimeLocalValue } from "@/lib/datetimeLocal";
import { deactivateExpiredPromos } from "@/lib/deactivateExpiredPromos";
import { PromoForm, type PromoFormInitial } from "@/components/admin/PromoForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin – Upraviť promo kód" };

export default async function AdminEditPromoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await deactivateExpiredPromos();

  const { id } = await params;
  const promo = await prisma.promoCode.findUnique({ where: { id } });
  if (!promo) notFound();

  const initial: PromoFormInitial = {
    code: promo.code,
    note: promo.note,
    discountType:
      promo.discountType === PromoDiscountType.PERCENT ? "PERCENT" : "FIXED",
    percentOff: promo.percentOff,
    amountOffCents: promo.amountOffCents,
    startsAtLocal: dateToDatetimeLocalValue(new Date(promo.startsAt)),
    endsAtLocal: promo.endsAt
      ? dateToDatetimeLocalValue(new Date(promo.endsAt))
      : "",
    isActive: promo.isActive,
    minOrderCents: promo.minOrderCents ?? null,
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/promo"
          className="text-sm text-neutral-500 hover:text-brand"
        >
          ← Späť na promo kódy
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-neutral-900">
          Upraviť kupón{" "}
          <span className="font-mono text-brand">{promo.code}</span>
        </h1>
      </div>
      <PromoForm mode="edit" promoId={promo.id} initial={initial} />
    </div>
  );
}
