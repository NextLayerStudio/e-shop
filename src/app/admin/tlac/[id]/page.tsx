import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDateTime, formatPrice } from "@/lib/format";
import { CustomPrintStatusBadge } from "@/components/admin/CustomPrintStatusBadge";
import { CustomPrintAdminControls } from "@/components/admin/CustomPrintAdminControls";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin – Tlač na mieru" };

export default async function AdminCustomPrintDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const r = await prisma.customPrintRequest.findUnique({
    where: { id },
    select: {
      id: true,
      requestNumber: true,
      customerName: true,
      customerEmail: true,
      customerPhone: true,
      description: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      adminNote: true,
      quotedPriceCents: true,
      fileName: true,
      fileMimeType: true,
      fileSizeBytes: true,
    },
  });

  if (!r) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/tlac"
            className="text-sm text-neutral-500 hover:text-brand"
          >
            ← Späť na požiadavky
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-neutral-900">
            Požiadavka #{r.requestNumber}
          </h1>
        </div>
        <CustomPrintStatusBadge status={r.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="space-y-4 lg:col-span-2">
          <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200">
            <h2 className="text-base font-semibold">Popis projektu</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-neutral-700">
              {r.description}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200">
            <h2 className="text-base font-semibold">Príloha</h2>
            {r.fileName ? (
              <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                <div>
                  <div className="font-medium">{r.fileName}</div>
                  <div className="text-xs text-neutral-400">
                    {r.fileMimeType} •{" "}
                    {((r.fileSizeBytes ?? 0) / 1024).toFixed(1)} KB
                  </div>
                </div>
                <a
                  href={`/api/admin/custom-print/${r.id}/file`}
                  className="rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-brand-dark"
                >
                  Stiahnuť
                </a>
              </div>
            ) : (
              <p className="mt-3 text-sm text-neutral-500">Bez prílohy.</p>
            )}
          </div>

          <CustomPrintAdminControls
            requestId={r.id}
            status={r.status}
            adminNote={r.adminNote ?? ""}
            quotedPriceEuros={
              r.quotedPriceCents != null ? r.quotedPriceCents / 100 : null
            }
          />
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200">
            <h2 className="text-base font-semibold">Zákazník</h2>
            <dl className="mt-3 space-y-1 text-sm">
              <Row label="Meno" value={r.customerName} />
              <Row
                label="Email"
                value={
                  <a
                    href={`mailto:${r.customerEmail}`}
                    className="hover:text-brand"
                  >
                    {r.customerEmail}
                  </a>
                }
              />
              {r.customerPhone && (
                <Row
                  label="Telefón"
                  value={
                    <a
                      href={`tel:${r.customerPhone}`}
                      className="hover:text-brand"
                    >
                      {r.customerPhone}
                    </a>
                  }
                />
              )}
              <Row label="Vytvorené" value={formatDateTime(r.createdAt)} />
              {r.quotedPriceCents != null && (
                <Row
                  label="Ponuka"
                  value={
                    <span className="font-semibold">
                      {formatPrice(r.quotedPriceCents)}
                    </span>
                  }
                />
              )}
            </dl>
          </div>
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
