import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatPrice, formatDateTime } from "@/lib/format";
import { OrderStatusSelect } from "@/components/admin/OrderStatusSelect";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";

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
              <OrderStatusSelect orderId={order.id} status={order.status} />
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
            <p className="mt-3 text-sm leading-relaxed">
              {order.address}
              <br />
              {order.postalCode} {order.city}
              <br />
              {order.country}
            </p>
          </div>

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
