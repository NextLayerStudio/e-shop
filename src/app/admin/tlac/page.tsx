import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";
import { CustomPrintStatusBadge } from "@/components/admin/CustomPrintStatusBadge";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin – Tlač na mieru" };

export default async function AdminCustomPrintListPage() {
  const requests = await prisma.customPrintRequest.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      requestNumber: true,
      customerName: true,
      customerEmail: true,
      status: true,
      createdAt: true,
      fileName: true,
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-neutral-900">Tlač na mieru</h1>

      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200">
        {requests.length === 0 ? (
          <div className="p-10 text-center text-sm text-neutral-500">
            Zatiaľ žiadne požiadavky.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">Č. požiadavky</th>
                <th className="px-4 py-3">Zákazník</th>
                <th className="px-4 py-3">Súbor</th>
                <th className="px-4 py-3">Stav</th>
                <th className="px-4 py-3">Vytvorené</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {requests.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 font-semibold">
                    <Link
                      href={`/admin/tlac/${r.id}`}
                      className="hover:text-brand"
                    >
                      #{r.requestNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div>{r.customerName}</div>
                    <div className="text-xs text-neutral-400">{r.customerEmail}</div>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {r.fileName ?? <span className="text-neutral-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <CustomPrintStatusBadge status={r.status} />
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {formatDateTime(r.createdAt)}
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
