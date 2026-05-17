import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { ProductImage } from "./ProductImage";

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  description: string;
  priceCents: number;
  primaryImageId: string | null;
};

export function ProductCard({
  product,
  ctaLabel = "Pozrieť bližšie",
}: {
  product: ProductCardData;
  ctaLabel?: string;
}) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200/60 transition hover:shadow-md">
      <Link
        href={`/produkty/${product.slug}`}
        className="relative block aspect-[4/3] w-full overflow-hidden bg-neutral-100"
      >
        <ProductImage
          imageId={product.primaryImageId}
          alt={product.name}
          className="transition-transform duration-300 group-hover:scale-105"
        />
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="text-base font-semibold text-neutral-900">
            <Link href={`/produkty/${product.slug}`} className="hover:text-brand">
              {product.name}
            </Link>
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-neutral-500">
            {product.shortDescription ?? product.description}
          </p>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <span className="text-lg font-bold text-neutral-900">
            {formatPrice(product.priceCents)}
          </span>
          <Link
            href={`/produkty/${product.slug}`}
            className="rounded-full bg-brand px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-dark"
          >
            {ctaLabel}
          </Link>
        </div>
      </div>
    </article>
  );
}
