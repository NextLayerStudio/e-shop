import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice, formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin – Prehľad" };

export default async function AdminDashboardPage() {
  let productsCount = 0;
  let activeProducts = 0;
  let lowStockCount = 0;
  let newOrders = 0;
  let totalOrders = 0;
  let revenue = 0;
  let pendingPrintRequests = 0;
  let recentOrders: Awaited<ReturnType<typeof prisma.order.findMany>> = [];
  let recentRequests: Awaited<
    ReturnType<typeof prisma.customPrintRequest.findMany>
  > = [];
  let dbError: string | null = null;

  try {
    [
      productsCount,
      activeProducts,
      lowStockCount,
      newOrders,
      totalOrders,
      pendingPrintRequests,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.count({ where: { isActive: true, stock: { lte: 3 } } }),
      prisma.order.count({ where: { status: "NEW" } }),
      prisma.order.count(),
      prisma.customPrintRequest.count({
        where: { status: { in: ["NEW", "IN_REVIEW"] } },
      }),
    ]);

    const revenueAgg = await prisma.order.aggregate({
      _sum: { totalCents: true },
      where: { status: { in: ["PAID", "SHIPPED", "COMPLETED"] } },
    });
    revenue = revenueAgg._sum.totalCents ?? 0;

    recentOrders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    });
    recentRequests = await prisma.customPrintRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    });
  } catch (err) {
    console.error("[admin] dashboard query failed:", err);
    dbError =
      "Databáza nie je dostupná. Skontroluj DATABASE_URL v .env a spusti `npm run db:push`.";
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-neutral-900">Prehľad</h1>

      {dbError && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {dbError}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Produkty (aktívne)" value={`${activeProducts}/${productsCount}`} />
        <Stat label="Nízky sklad (≤3)" value={lowStockCount} accent={lowStockCount > 0 ? "warn" : undefined} />
        <Stat label="Nové objednávky" value={newOrders} accent={newOrders > 0 ? "info" : undefined} />
        <Stat label="Tržby" value={formatPrice(revenue)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Najnovšie objednávky" linkHref="/admin/objednavky" linkLabel="Všetky">
          {recentOrders.length === 0 ? (
            <Empty text="Zatiaľ žiadne objednávky." />
          ) : (
            <ul className="divide-y divide-neutral-100">
              {recentOrders.map((o) => (
                <li key={o.id} className="flex items-center justify-between py-2 text-sm">
                  <Link
                    href={`/admin/objednavky/${o.id}`}
                    className="min-w-0 flex-1 truncate hover:text-brand"
                  >
                    <span className="font-semibold">#{o.orderNumber}</span>{" "}
                    <span className="text-neutral-500">— {o.customerName}</span>
                  </Link>
                  <span className="ml-3 whitespace-nowrap text-neutral-500">
                    {formatDateTime(o.createdAt)}
                  </span>
                  <span className="ml-3 font-semibold">{formatPrice(o.totalCents)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Tlač na mieru"
          linkHref="/admin/tlac"
          linkLabel="Všetky"
          badge={pendingPrintRequests > 0 ? `${pendingPrintRequests} čakajúce` : undefined}
        >
          {recentRequests.length === 0 ? (
            <Empty text="Zatiaľ žiadne požiadavky." />
          ) : (
            <ul className="divide-y divide-neutral-100">
              {recentRequests.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                  <Link
                    href={`/admin/tlac/${r.id}`}
                    className="min-w-0 flex-1 truncate hover:text-brand"
                  >
                    <span className="font-semibold">#{r.requestNumber}</span>{" "}
                    <span className="text-neutral-500">— {r.customerName}</span>
                  </Link>
                  <span className="ml-3 whitespace-nowrap text-neutral-500">
                    {formatDateTime(r.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <p className="text-xs text-neutral-400">
        Spolu objednávok: {totalOrders}. Spravuj produkty na hlavnej stránke v sekcii{" "}
        <Link href="/admin/produkty" className="text-brand hover:underline">
          Produkty
        </Link>{" "}
        – prepínač „Na hlavnej stránke".
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: "warn" | "info";
}) {
  const accentClass =
    accent === "warn"
      ? "text-orange-600"
      : accent === "info"
        ? "text-brand"
        : "text-neutral-900";
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200">
      <div className="text-xs uppercase tracking-wide text-neutral-400">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${accentClass}`}>{value}</div>
    </div>
  );
}

function Panel({
  title,
  children,
  linkHref,
  linkLabel,
  badge,
}: {
  title: string;
  children: React.ReactNode;
  linkHref?: string;
  linkLabel?: string;
  badge?: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-neutral-900">
          {title}
          {badge && (
            <span className="ml-2 inline-flex items-center rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
              {badge}
            </span>
          )}
        </h2>
        {linkHref && (
          <Link href={linkHref} className="text-sm text-brand hover:underline">
            {linkLabel ?? "Otvoriť"}
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <p className="rounded-lg bg-neutral-50 p-6 text-center text-sm text-neutral-500">
      {text}
    </p>
  );
}
