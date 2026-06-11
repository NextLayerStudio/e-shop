import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatPrice, formatDateTime } from "@/lib/format";
import { OrderStatusSelect } from "@/components/admin/OrderStatusSelect";
import { InvoiceResendButton } from "@/components/admin/InvoiceSendModal";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { PacketaPanel } from "@/components/admin/PacketaPanel";
import { getPacketaConfig } from "@/lib/packeta/client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin – Objednávka" };

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!order) notFound();

  const itemsSubtotal = order.items.reduce(
    (s, it) => s + it.unitPriceCents * it.quantity,
    0
  );

  const packetaConfigured = getPacketaConfig().configured;
  const isPacketaShipping =
    order.shippingMethodId === "packeta-pickup" ||
    order.shippingMethodId === "packeta-home";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/objednavky"
            className="text-sm text-neutral-500 hover:text-brand"
          >
            ← Späť na objednávky
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-neutral-900">
            Objednávka #{order.orderNumber}
          </h1>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200 lg:col-span-2">
          <h2 className="mb-3 text-base font-semibold">Položky</h2>
          <ul className="divide-y divide-neutral-100 text-sm">
            {order.items.map((it) => (
              <li
                key={it.id}
                className="flex items-center justify-between gap-3 py-2"
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
          <div className="mt-3 space-y-1 text-sm">
            <div className="flex items-center justify-between text-neutral-600">
              <span>Medzisúčet položiek</span>
              <span>{formatPrice(itemsSubtotal)}</span>
            </div>
            {(order.discountCents ?? 0) > 0 && (
              <div className="flex items-center justify-between text-green-700">
                <span>
                  Zľava — kupón{" "}
                  {order.promoSnapshot && (
                    <span className="font-medium text-neutral-800">
                      {order.promoSnapshot}
                    </span>
                  )}
                </span>
                <span>−{formatPrice(order.discountCents)}</span>
              </div>
            )}
            {order.shippingLabel && (
              <div className="flex items-center justify-between text-neutral-700">
                <span>Doprava — {order.shippingLabel}</span>
                <span className="font-semibold">
                  {(order.shippingCents ?? 0) === 0
                    ? "Zdarma"
                    : formatPrice(order.shippingCents ?? 0)}
                </span>
              </div>
            )}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-neutral-200 pt-3">
            <span className="font-semibold">Celkom</span>
            <span className="text-xl font-bold text-brand">
              {formatPrice(order.totalCents)}
            </span>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200">
            <h2 className="text-base font-semibold">Stav objednávky</h2>
            <div className="mt-3">
              <OrderStatusSelect
                orderId={order.id}
                status={order.status}
                customerEmail={order.customerEmail}
              />
              {order.status === "PAID" && (
                <InvoiceResendButton
                  orderId={order.id}
                  customerEmail={order.customerEmail}
                />
              )}
            </div>
            <p className="mt-3 text-xs text-neutral-400">
              Vytvorené: {formatDateTime(order.createdAt)}
            </p>
            {order.updatedAt.getTime() !== order.createdAt.getTime() && (
              <p className="text-xs text-neutral-400">
                Upravené: {formatDateTime(order.updatedAt)}
              </p>
            )}
          </div>

          <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200">
            <h2 className="text-base font-semibold">Zákazník</h2>
            <dl className="mt-3 space-y-1 text-sm">
              <Row label="Meno" value={order.customerName} />
              <Row
                label="Email"
                value={
                  <a
                    href={`mailto:${order.customerEmail}`}
                    className="hover:text-brand"
                  >
                    {order.customerEmail}
                  </a>
                }
              />
              {order.customerPhone && (
                <Row
                  label="Telefón"
                  value={
                    <a
                      href={`tel:${order.customerPhone}`}
                      className="hover:text-brand"
                    >
                      {order.customerPhone}
                    </a>
                  }
                />
              )}
            </dl>
          </div>

          <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200">
            <h2 className="text-base font-semibold">Doručenie</h2>
            {order.shippingLabel && (
              <p className="mt-1 text-xs font-medium text-neutral-500">
                {order.shippingLabel}
              </p>
            )}
            {order.packetaPointName ? (
              <div className="mt-3 text-sm leading-relaxed">
                <p className="font-medium">{order.packetaPointName}</p>
                {order.packetaPointAddress && (
                  <p className="text-neutral-500">{order.packetaPointAddress}</p>
                )}
              </div>
            ) : (
              <p className="mt-3 text-sm leading-relaxed">
                {order.address}
                <br />
                {order.postalCode} {order.city}
                <br />
                {order.country}
              </p>
            )}
          </div>

          {/* Packeta panel — zobrazí sa len pre Packeta dopravu */}
          {isPacketaShipping && (
            <PacketaPanel
              orderId={order.id}
              orderNumber={order.orderNumber}
              orderStatus={order.status}
              hasPickupPoint={!!order.packetaPointId}
              pickupPointName={order.packetaPointName ?? null}
              pickupPointAddress={order.packetaPointAddress ?? null}
              packetaConfigured={packetaConfigured}
              packetaPacketId={order.packetaPacketId ?? null}
              packetaTrackingNumber={order.packetaTrackingNumber ?? null}
              packetaStatus={order.packetaStatus ?? null}
              packetaError={order.packetaError ?? null}
            />
          )}

          {order.note && (
            <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200">
              <h2 className="text-base font-semibold">Poznámka zákazníka</h2>
              <p className="mt-3 whitespace-pre-line text-sm text-neutral-700">
                {order.note}
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="text-right text-neutral-900">{value}</dd>
    </div>
  );
}
