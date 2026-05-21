import { notFound } from "next/navigation";
import Link from "next/link";
import type { ProductCardData } from "@/components/ProductCard";
import { RelatedProductsCarousel } from "@/components/RelatedProductsCarousel";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { categoryBadgeLabel, showPopularBadge } from "@/lib/productDisplay";
import { ProductImageGallery } from "@/components/ProductImageGallery";
import { AddToCartButton } from "@/components/AddToCartButton";
import { ProductDescriptionExpand } from "@/components/ProductDescriptionExpand";
import type { ProductCategory } from "@/generated/prisma/enums";

export const dynamic = "force-dynamic";

const cardSelect = {
  id: true,
  slug: true,
  name: true,
  shortDescription: true,
  description: true,
  priceCents: true,
  images: {
    orderBy: [{ isPrimary: "desc" as const }, { sortOrder: "asc" as const }],
    take: 1,
    select: { id: true },
  },
};

function mapToCardData(p: {
  id: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  description: string;
  priceCents: number;
  images: { id: string }[];
}): ProductCardData {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    shortDescription: p.shortDescription,
    description: p.description,
    priceCents: p.priceCents,
    primaryImageId: p.images[0]?.id ?? null,
  };
}

async function loadRelatedProducts(
  currentId: string,
  category: ProductCategory
): Promise<ProductCardData[]> {
  const sameCat = await prisma.product.findMany({
    where: {
      isActive: true,
      id: { not: currentId },
      category,
    },
    orderBy: [{ salesCount: "desc" }, { createdAt: "desc" }],
    take: 12,
    select: cardSelect,
  });

  let list = sameCat.map(mapToCardData);
  if (list.length >= 8) return list;

  const more = await prisma.product.findMany({
    where: {
      isActive: true,
      id: { not: currentId, notIn: list.map((p) => p.id) },
    },
    orderBy: [{ salesCount: "desc" }, { createdAt: "desc" }],
    take: 12 - list.length,
    select: cardSelect,
  });

  list = [...list, ...more.map(mapToCardData)];
  return list;
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      images: {
        orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
        select: { id: true, alt: true },
      },
    },
  });

  if (!product || !product.isActive) notFound();

  const relatedProducts = await loadRelatedProducts(product.id, product.category);

  const images = product.images;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <nav className="mb-6 text-sm text-neutral-500">
        <Link href="/" className="hover:text-brand">
          Domov
        </Link>{" "}
        /{" "}
        <Link href="/produkty" className="hover:text-brand">
          Produkty
        </Link>{" "}
        / <span className="text-neutral-700">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
        <div>
          <ProductImageGallery images={images} productName={product.name} />
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/12 px-3 py-1 text-xs font-semibold text-brand-dark ring-1 ring-brand/25">
              <span aria-hidden>{product.category === "HRACKY" ? "🪄" : "✨"}</span>
              {categoryBadgeLabel(product.category)}
            </span>
            {showPopularBadge(product) && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-800 ring-1 ring-orange-200/80">
                <span aria-hidden>🔥</span>
                Populárne
              </span>
            )}
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 md:text-4xl">
            {product.name}
          </h1>

          <ProductDescriptionExpand
            shortDescription={product.shortDescription}
            description={product.description}
          />

          <div className="flex items-center gap-2 text-sm">
            <span
              className={`inline-flex h-2.5 w-2.5 rounded-full ${
                product.stock > 0 ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span className="text-neutral-600">
              {product.stock > 0
                ? `Skladom: ${product.stock} ks`
                : "Vypredané"}
            </span>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
            <div className="flex items-center justify-center rounded-2xl bg-brand px-6 py-3 text-center shadow-inner ring-2 ring-brand/20 sm:min-w-[140px] sm:justify-center">
              <span className="text-2xl font-bold text-white tabular-nums">
                {formatPrice(product.priceCents)}
              </span>
            </div>
            <AddToCartButton
              productId={product.id}
              disabled={product.stock <= 0}
              className="sm:flex-1"
            />
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <section className="mt-16 border-t border-neutral-200 pt-12">
          <h2 className="text-xl font-bold text-neutral-900 md:text-2xl">
            Podobné produkty
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Ďalšie kúsky z rovnakej kategórie alebo podľa popularity.
          </p>
          <div className="mt-8">
            <RelatedProductsCarousel products={relatedProducts} />
          </div>
        </section>
      )}
    </div>
  );
}
