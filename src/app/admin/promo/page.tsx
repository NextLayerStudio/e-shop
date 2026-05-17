import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDateTime, formatPrice } from "@/lib/format";
import { PromoDiscountType } from "@/generated/prisma/enums";
import { deactivateExpiredPromos } from "@/lib/deactivateExpiredPromos";
import { PromoActiveToggle } from "@/components/admin/PromoActiveToggle";
import { PromoDeleteButton } from "@/components/admin/PromoDeleteButton";
import { PromoLifecycleBadge } from "@/components/admin/PromoLifecycleBadge";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin – Promo kódy" };

function discountLabel(p: {
  discountType: PromoDiscountType;
  percentOff: number | null;
  amountOffCents: number | null;
}) {
  if (p.discountType === PromoDiscountType.PERCENT) {
    return `${p.percentOff ?? 0} %`;
  }
  return formatPrice(p.amountOffCents ?? 0);
}

export default async function AdminPromoPage() {
  await deactivateExpiredPromos();

  const promos = await prisma.promoCode.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Promo kódy</h1>
        <Link
          href="/admin/promo/novy"
          className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          + Nový kupón
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200">
        {promos.length === 0 ? (
          <div className="p-10 text-center text-sm text-neutral-500">
            Zatiaľ žiadne kupóny.{" "}
            <Link href="/admin/promo/novy" className="text-brand hover:underline">
              Vytvoriť prvý
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-neutral-50 text-xs font-semibold uppercase text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Kód</th>
                  <th className="px-4 py-3">Zľava</th>
                  <th className="hidden px-4 py-3 md:table-cell">Min. nákup</th>
                  <th className="px-4 py-3">Platnosť</th>
                  <th className="px-4 py-3">Stav</th>
                  <th className="px-4 py-3 text-right">Akcie</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {promos.map((p) => (
                  <tr key={p.id} className="text-neutral-800">
                    <td className="px-4 py-3 font-mono font-semibold">{p.code}</td>
                    <td className="px-4 py-3">{discountLabel(p)}</td>
                    <td className="hidden whitespace-nowrap px-4 py-3 text-neutral-600 md:table-cell">
                      {p.minOrderCents != null && p.minOrderCents > 0
                        ? formatPrice(p.minOrderCents)
                        : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-neutral-600">
                      {formatDateTime(p.startsAt)}
                      {" — "}
                      {p.endsAt ? formatDateTime(p.endsAt) : "bez konca"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-2">
                        <PromoLifecycleBadge
                          startsAt={p.startsAt}
                          endsAt={p.endsAt}
                          isActive={p.isActive}
                        />
                        <PromoActiveToggle id={p.id} isActive={p.isActive} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Link
                          href={`/admin/promo/${p.id}`}
                          className="rounded-md bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-800 hover:bg-neutral-200"
                        >
                          Upraviť
                        </Link>
                        <PromoDeleteButton promoId={p.id} code={p.code} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
