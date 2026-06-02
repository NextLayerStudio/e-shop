import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductCard, type ProductCardData } from "@/components/ProductCard";
import {
  isValidProductCategory,
  PRODUCT_CATEGORY_FILTER_OPTIONS,
} from "@/lib/productCategories";

export const dynamic = "force-dynamic";

type Sort = "new" | "price-asc" | "price-desc" | "popular";
const SORT_OPTIONS: { value: Sort; label: string }[] = [
  { value: "new", label: "Najnovšie" },
  { value: "popular", label: "Najpopulárnejšie" },
  { value: "price-asc", label: "Cena (najnižšia)" },
  { value: "price-desc", label: "Cena (najvyššia)" },
];

export default async function ProduktyPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; sort?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const category = (sp.category ?? "").trim();
  const sort: Sort =
    sp.sort === "price-asc" ||
    sp.sort === "price-desc" ||
    sp.sort === "popular"
      ? sp.sort
      : "new";

  const where: Record<string, unknown> = { isActive: true };
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }
  if (category && isValidProductCategory(category)) {
    where.category = category;
  }

  const orderBy =
    sort === "price-asc"
      ? { priceCents: "asc" as const }
      : sort === "price-desc"
        ? { priceCents: "desc" as const }
        : sort === "popular"
          ? { salesCount: "desc" as const }
          : { createdAt: "desc" as const };

  let items: ProductCardData[] = [];
  let dbError = false;
  try {
    const products = await prisma.product.findMany({
      where,
      orderBy,
      include: {
        images: {
          orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
          take: 1,
          select: { id: true },
        },
      },
    });
    items = products.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      description: p.description,
      shortDescription: p.shortDescription,
      priceCents: p.priceCents,
      primaryImageId: p.images[0]?.id ?? null,
      hasVariants: p.hasVariants,
      figurkaPriceCents: p.figurkaPriceCents,
      klucenkaPriceCents: p.klucenkaPriceCents,
    }));
  } catch (err) {
    console.error("[produkty] findMany failed:", err);
    dbError = true;
  }

  function buildHref(overrides: Partial<{ category: string; sort: Sort }>) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    const c = overrides.category ?? category;
    if (c) params.set("category", c);
    const s = overrides.sort ?? sort;
    if (s !== "new") params.set("sort", s);
    const qs = params.toString();
    return qs ? `/produkty?${qs}` : "/produkty";
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <h1 className="text-2xl font-bold text-neutral-900">Produkty</h1>
      {q && (
        <p className="mt-1 text-sm text-neutral-500">
          Výsledky vyhľadávania pre: <span className="font-medium">{q}</span>
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <span className="text-sm font-semibold text-neutral-700">Kategória:</span>
        <div className="flex flex-wrap gap-2">
          {PRODUCT_CATEGORY_FILTER_OPTIONS.map((c) => {
            const active = (c.value || "") === category;
            return (
              <Link
                key={c.value}
                href={buildHref({ category: c.value })}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium ring-1 transition ${
                  active
                    ? "bg-brand text-white ring-brand"
                    : "bg-white text-neutral-700 ring-neutral-200 hover:ring-brand/40"
                }`}
              >
                {c.label}
              </Link>
            );
          })}
        </div>

        <span className="ml-auto text-sm font-semibold text-neutral-700">Zoradiť:</span>
        <div className="flex flex-wrap gap-2">
          {SORT_OPTIONS.map((s) => {
            const active = s.value === sort;
            return (
              <Link
                key={s.value}
                href={buildHref({ sort: s.value })}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium ring-1 transition ${
                  active
                    ? "bg-brand text-white ring-brand"
                    : "bg-white text-neutral-700 ring-neutral-200 hover:ring-brand/40"
                }`}
              >
                {s.label}
              </Link>
            );
          })}
        </div>
      </div>

      {dbError && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Databáza nie je dostupná. Skontroluj <code>DATABASE_URL</code> v <code>.env</code>.
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.length === 0 ? (
          <div className="col-span-full rounded-2xl border-2 border-dashed border-neutral-200 bg-white p-10 text-center text-sm text-neutral-500">
            Nenašli sa žiadne produkty.
          </div>
        ) : (
          items.map((p) => <ProductCard key={p.id} product={p} />)
        )}
      </div>
    </div>
  );
}
