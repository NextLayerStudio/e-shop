import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductCard, type ProductCardData } from "@/components/ProductCard";
import { ProductImage } from "@/components/ProductImage";
import { HomeFilters } from "@/components/HomeFilters";
import { HomeHeroCarousel } from "@/components/HomeHeroCarousel";

export const dynamic = "force-dynamic";

type SortKey = "popular" | "practical" | "price";

async function getFeaturedProducts(sort: SortKey): Promise<ProductCardData[]> {
  const where = { isActive: true, isFeaturedHome: true } as const;

  let orderBy:
    | { homeSortOrder: "asc" }
    | { salesCount: "desc" }
    | { priceCents: "asc" } = { homeSortOrder: "asc" };
  let extraWhere: Record<string, unknown> = {};

  if (sort === "popular") orderBy = { salesCount: "desc" };
  else if (sort === "price") orderBy = { priceCents: "asc" };
  else if (sort === "practical") extraWhere = { category: "PRAKTICKE" };

  try {
    const products = await prisma.product.findMany({
      where: { ...where, ...extraWhere },
      orderBy,
      take: 6,
      include: {
        images: {
          orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
          take: 1,
          select: { id: true },
        },
      },
    });

    return products.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      description: p.description,
      shortDescription: p.shortDescription,
      priceCents: p.priceCents,
      primaryImageId: p.images[0]?.id ?? null,
    }));
  } catch (err) {
    console.error("[home] getFeaturedProducts failed:", err);
    return [];
  }
}

async function getHitOfWeek() {
  try {
    return await prisma.product.findFirst({
      where: { isActive: true, isHitOfWeek: true },
      include: {
        images: {
          orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
          take: 1,
          select: { id: true },
        },
      },
    });
  } catch (err) {
    console.error("[home] getHitOfWeek failed:", err);
    return null;
  }
}

async function getBottomGrid(): Promise<ProductCardData[]> {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        images: {
          orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
          take: 1,
          select: { id: true },
        },
      },
    });
    return products.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      description: p.description,
      shortDescription: p.shortDescription,
      priceCents: p.priceCents,
      primaryImageId: p.images[0]?.id ?? null,
    }));
  } catch (err) {
    console.error("[home] getBottomGrid failed:", err);
    return [];
  }
}

async function isDbReachable(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const params = await searchParams;
  const sort: SortKey =
    params.sort === "popular" ||
    params.sort === "practical" ||
    params.sort === "price"
      ? params.sort
      : "popular";

  const [dbOk, featured, hit, bottomGrid] = await Promise.all([
    isDbReachable(),
    getFeaturedProducts(sort),
    getHitOfWeek(),
    getBottomGrid(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      {!dbOk && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-semibold">Databáza nie je dostupná.</p>
          <p className="mt-1">
            Pridaj <code className="rounded bg-white px-1 py-0.5">DATABASE_URL</code> do{" "}
            <code className="rounded bg-white px-1 py-0.5">.env</code> (Neon connection
            string) a spusti{" "}
            <code className="rounded bg-white px-1 py-0.5">npm run db:push</code>. Bez DB
            vidíš len prázdny layout.
          </p>
        </div>
      )}

      <HomeHeroCarousel />

      {/* FILTERS */}
      <section className="mt-10">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-sm font-semibold text-neutral-700">Zoradiť podľa:</h2>
          <HomeFilters sort={sort} />
          <Link
            href="/produkty"
            className="ml-auto text-sm font-medium text-brand hover:text-brand-dark"
          >
            Pozrieť všetky
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.length === 0 ? (
            <EmptyState message="Zatiaľ tu nie sú žiadne produkty. Pridajte produkty v admin paneli a označte ich ako 'Na hlavnej stránke'." />
          ) : (
            featured.map((p) => <ProductCard key={p.id} product={p} />)
          )}
        </div>
      </section>

      {/* HIT OF THE WEEK */}
      <section className="mt-12">
        <div className="grid gap-0 overflow-hidden rounded-2xl bg-neutral-900 text-white shadow-sm md:grid-cols-2">
          <div className="flex flex-col justify-center gap-4 p-6 md:p-10">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Hit týždňa
            </span>
            <h2 className="text-2xl font-bold leading-tight md:text-3xl">
              <span className="text-accent">najpopulárnejší výtlačok</span>{" "}
              <span className="block text-white">od zákazníka</span>
            </h2>
            <p className="text-sm leading-relaxed text-neutral-300">
              {hit?.shortDescription ??
                "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent vehicula urna nec semper porta."}
            </p>
            <div>
              <Link
                href={hit ? `/produkty/${hit.slug}` : "/produkty"}
                className="inline-flex items-center rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
              >
                Pozrieť viac
              </Link>
            </div>
          </div>

          <div className="relative aspect-[5/4] w-full bg-neutral-800 md:aspect-auto md:min-h-[320px]">
            <ProductImage
              imageId={hit?.images[0]?.id ?? null}
              alt={hit?.name ?? "Hit týždňa"}
              fallbackClassName="bg-neutral-800 text-neutral-700"
            />
          </div>
        </div>
      </section>

      {/* BOTTOM GRID */}
      <section className="mt-12">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {bottomGrid.length === 0 ? (
            <EmptyState message="Zatiaľ tu nie sú žiadne produkty." />
          ) : (
            bottomGrid.map((p) => <ProductCard key={p.id} product={p} />)
          )}
        </div>

        <div className="mt-8 flex justify-center">
          <Link
            href="/produkty"
            className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
          >
            Všetky produkty
          </Link>
        </div>
      </section>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="col-span-full rounded-2xl border-2 border-dashed border-neutral-200 bg-white p-10 text-center text-sm text-neutral-500">
      {message}
    </div>
  );
}
