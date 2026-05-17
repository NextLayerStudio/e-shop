import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatPrice, formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true },
  });

  if (!order) notFound();

  const itemsSubtotal = order.items.reduce(
    (s, it) => s + it.unitPriceCents * it.quantity,
    0
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <div className="rounded-2xl bg-white p-8 ring-1 ring-neutral-200">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
            ✓
          </span>
          <h1 className="text-2xl font-bold text-neutral-900">
            Ďakujeme za objednávku!
          </h1>
        </div>
        <p className="mt-2 text-neutral-600">
          Tvoja objednávka <span className="font-semibold">#{order.orderNumber}</span>{" "}
          bola prijatá. Potvrdzujúci email pošleme na{" "}
          <span className="font-semibold">{order.customerEmail}</span>.
        </p>

        <div className="mt-6 space-y-1 text-sm text-neutral-600">
          <p>
            <span className="text-neutral-400">Vytvorené: </span>
            {formatDateTime(order.createdAt)}
          </p>
          <p>
            <span className="text-neutral-400">Doručenie: </span>
            {order.address}, {order.postalCode} {order.city}, {order.country}
          </p>
        </div>

        <ul className="mt-6 divide-y divide-neutral-100">
          {order.items.map((it) => (
            <li
              key={it.id}
              className="flex items-center justify-between py-2 text-sm"
            >
              <span>
                {it.productName}{" "}
                <span className="text-neutral-400">× {it.quantity}</span>
              </span>
              <span className="font-semibold">
                {formatPrice(it.unitPriceCents * it.quantity)}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-4 space-y-1 text-sm text-neutral-600">
          <div className="flex items-center justify-between">
            <span>Medzisúčet</span>
            <span>{formatPrice(itemsSubtotal)}</span>
          </div>
          {(order.discountCents ?? 0) > 0 && (
            <div className="flex items-center justify-between text-green-700">
              <span>
                Zľava
                {order.promoSnapshot ? (
                  <span className="text-neutral-500"> ({order.promoSnapshot})</span>
                ) : null}
              </span>
              <span>−{formatPrice(order.discountCents)}</span>
            </div>
          )}
          {order.shippingLabel && (
            <div className="flex items-center justify-between">
              <span>Doprava — {order.shippingLabel}</span>
              <span className="font-semibold text-neutral-800">
                {(order.shippingCents ?? 0) === 0
                  ? "Zdarma"
                  : formatPrice(order.shippingCents ?? 0)}
              </span>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-neutral-200 pt-4">
          <span className="font-semibold">Celkom</span>
          <span className="text-xl font-bold text-brand">
            {formatPrice(order.totalCents)}
          </span>
        </div>

        <Link
          href="/produkty"
          className="mt-6 inline-block rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Pokračovať v nákupe
        </Link>
      </div>
    </div>
  );
}
