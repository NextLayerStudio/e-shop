import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductCard, type ProductCardData } from "@/components/ProductCard";
import { ProductImage } from "@/components/ProductImage";
import { HomeFilters } from "@/components/HomeFilters";
import { HomeHeroCarousel } from "@/components/HomeHeroCarousel";

export const dynamic = "force-dynamic";

type SortKey = "popular" | "organizing" | "price";

async function getFeaturedProducts(sort: SortKey): Promise<ProductCardData[]> {
  const where = { isActive: true, isFeaturedHome: true } as const;

  let orderBy:
    | { homeSortOrder: "asc" }
    | { salesCount: "desc" }
    | { priceCents: "asc" } = { homeSortOrder: "asc" };
  let extraWhere: Record<string, unknown> = {};

  if (sort === "popular") orderBy = { salesCount: "desc" };
  else if (sort === "price") orderBy = { priceCents: "asc" };
  else if (sort === "organizing") extraWhere = { category: "NA_ORGANIZOVANIE" };

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
      hasVariants: p.hasVariants,
      figurkaPriceCents: p.figurkaPriceCents,
      klucenkaPriceCents: p.klucenkaPriceCents,
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

async function getMuchaProduct() {
  try {
    return await prisma.product.findUnique({
      where: { slug: "pohybliva-mucha" },
      select: {
        slug: true,
        name: true,
        shortDescription: true,
        images: {
          orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
          take: 1,
          select: { id: true },
        },
      },
    });
  } catch (err) {
    console.error("[home] getMuchaProduct failed:", err);
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
      hasVariants: p.hasVariants,
      figurkaPriceCents: p.figurkaPriceCents,
      klucenkaPriceCents: p.klucenkaPriceCents,
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
    params.sort === "organizing" ||
    params.sort === "price"
      ? params.sort
      : "popular";

  const [dbOk, featured, hit, bottomGrid, mucha] = await Promise.all([
    isDbReachable(),
    getFeaturedProducts(sort),
    getHitOfWeek(),
    getBottomGrid(),
    getMuchaProduct(),
  ]);

  const carouselImageIds = featured
    .map((p) => p.primaryImageId)
    .filter((id): id is string => id !== null)
    .slice(0, 3);

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

      <HomeHeroCarousel imageIds={carouselImageIds} />

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
        <div className="grid gap-0 overflow-hidden rounded-2xl shadow-sm md:grid-cols-[2fr_3fr]">
          {/* Ľavý tmavý panel — rovnaký štýl ako carousel */}
          <div className="flex min-h-[220px] flex-col justify-center gap-4 bg-neutral-900 p-7 text-white md:min-h-[300px] md:p-10">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Hit týždňa
            </span>
            <h2 className="text-2xl font-bold leading-tight md:text-3xl">
              {hit ? (
                hit.name
              ) : (
                <>
                  <span className="text-accent">Najpopulárnejší</span>{" "}
                  <span className="block">výtlačok</span>
                </>
              )}
            </h2>
            <p className="text-sm leading-relaxed text-neutral-300">
              {hit?.shortDescription ??
                "Objavte náš najobľúbenejší produkt. Kvalitná 3D tlač, rýchle dodanie."}
            </p>
            <div>
              <Link
                href={mucha ? `/produkty/${mucha.slug}` : hit ? `/produkty/${hit.slug}` : "/produkty"}
                className="inline-flex items-center rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
              >
                Pozrieť produkt
              </Link>
            </div>
          </div>

          {/* Pravý svetlý panel s obrázkom produktu — rovnaký štýl ako carousel */}
          <div className="relative min-h-[220px] overflow-hidden bg-neutral-100 md:min-h-[300px]">
            <ProductImage
              imageId={mucha?.images[0]?.id ?? hit?.images[0]?.id ?? featured[0]?.primaryImageId ?? null}
              alt={mucha?.name ?? hit?.name ?? "Hit týždňa"}
              className="object-cover"
              fallbackClassName="bg-neutral-100 text-neutral-300"
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
