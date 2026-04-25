import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice, formatDateTime } from "@/lib/format";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin – Objednávky" };

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { items: true } } },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-neutral-900">Objednávky</h1>

      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200">
        {orders.length === 0 ? (
          <div className="p-10 text-center text-sm text-neutral-500">
            Zatiaľ žiadne objednávky.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">Č. objednávky</th>
                <th className="px-4 py-3">Zákazník</th>
                <th className="px-4 py-3">Položiek</th>
                <th className="px-4 py-3">Suma</th>
                <th className="px-4 py-3">Stav</th>
                <th className="px-4 py-3">Vytvorené</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="px-4 py-3 font-semibold">
                    <Link
                      href={`/admin/objednavky/${o.id}`}
                      className="hover:text-brand"
                    >
                      #{o.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div>{o.customerName}</div>
                    <div className="text-xs text-neutral-400">{o.customerEmail}</div>
                  </td>
                  <td className="px-4 py-3">{o._count.items}</td>
                  <td className="px-4 py-3 font-semibold">
                    {formatPrice(o.totalCents)}
                  </td>
                  <td className="px-4 py-3">
                    <OrderStatusBadge status={o.status} />
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {formatDateTime(o.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
