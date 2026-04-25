import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { ProductImage } from "@/components/ProductImage";
import { FeaturedToggle } from "@/components/admin/FeaturedToggle";
import { DeleteProductButton } from "@/components/admin/DeleteProductButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin – Produkty" };

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      images: {
        orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
        take: 1,
        select: { id: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Produkty</h1>
        <Link
          href="/admin/produkty/novy"
          className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          + Nový produkt
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200">
        {products.length === 0 ? (
          <div className="p-10 text-center text-sm text-neutral-500">
            Zatiaľ žiadne produkty.{" "}
            <Link href="/admin/produkty/novy" className="text-brand hover:underline">
              Pridať prvý
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">Produkt</th>
                <th className="px-4 py-3">Cena</th>
                <th className="px-4 py-3">Sklad</th>
                <th className="px-4 py-3">Kategória</th>
                <th className="px-4 py-3">Hlavná str.</th>
                <th className="px-4 py-3">Hit týždňa</th>
                <th className="px-4 py-3">Aktívny</th>
                <th className="px-4 py-3 text-right">Akcie</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                        <ProductImage
                          imageId={p.images[0]?.id ?? null}
                          alt={p.name}
                        />
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/admin/produkty/${p.id}`}
                          className="block truncate font-semibold hover:text-brand"
                        >
                          {p.name}
                        </Link>
                        <div className="text-xs text-neutral-400">/{p.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    {formatPrice(p.priceCents)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.stock <= 0
                          ? "bg-red-100 text-red-700"
                          : p.stock <= 3
                            ? "bg-orange-100 text-orange-700"
                            : "bg-green-100 text-green-700"
                      }`}
                    >
                      {p.stock} ks
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{p.category}</td>
                  <td className="px-4 py-3">
                    <FeaturedToggle
                      productId={p.id}
                      field="isFeaturedHome"
                      value={p.isFeaturedHome}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <FeaturedToggle
                      productId={p.id}
                      field="isHitOfWeek"
                      value={p.isHitOfWeek}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <FeaturedToggle
                      productId={p.id}
                      field="isActive"
                      value={p.isActive}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <Link
                        href={`/admin/produkty/${p.id}`}
                        className="rounded-md bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-200"
                      >
                        Upraviť
                      </Link>
                      <DeleteProductButton productId={p.id} productName={p.name} />
                    </div>
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
