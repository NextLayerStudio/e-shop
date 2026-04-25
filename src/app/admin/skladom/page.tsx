import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductImage } from "@/components/ProductImage";
import { StockEditor } from "@/components/admin/StockEditor";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin – Sklad" };

export default async function AdminStockPage() {
  const products = await prisma.product.findMany({
    orderBy: [{ stock: "asc" }, { name: "asc" }],
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
      <h1 className="text-2xl font-bold text-neutral-900">Sklad</h1>
      <p className="text-sm text-neutral-500">
        Sklad je prepojený s kartami produktov. Zmeny sa hneď prejavia v
        e-shope. Hodnota sa automaticky znižuje pri vytvorení objednávky.
      </p>

      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200">
        {products.length === 0 ? (
          <div className="p-10 text-center text-sm text-neutral-500">
            Nie sú žiadne produkty.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">Produkt</th>
                <th className="px-4 py-3">Aktuálny sklad</th>
                <th className="px-4 py-3">Stav</th>
                <th className="px-4 py-3 text-right">Upraviť</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-neutral-100">
                        <ProductImage imageId={p.images[0]?.id ?? null} alt={p.name} />
                      </div>
                      <Link
                        href={`/admin/produkty/${p.id}`}
                        className="font-medium hover:text-brand"
                      >
                        {p.name}
                      </Link>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold">{p.stock} ks</td>
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
                      {p.stock <= 0
                        ? "Vypredané"
                        : p.stock <= 3
                          ? "Nízky stav"
                          : "Skladom"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <StockEditor productId={p.id} stock={p.stock} />
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
