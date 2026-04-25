import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { ProductImage } from "@/components/ProductImage";
import { AddToCartButton } from "@/components/AddToCartButton";

export const dynamic = "force-dynamic";

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

  const images = product.images;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <nav className="mb-6 text-sm text-neutral-500">
        <Link href="/" className="hover:text-brand">
          Domov
        </Link>{" "}
        / {" "}
        <Link href="/produkty" className="hover:text-brand">
          Produkty
        </Link>{" "}
        / <span className="text-neutral-700">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200">
            <ProductImage
              imageId={images[0]?.id ?? null}
              alt={product.name}
              priority
            />
          </div>
          {images.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="relative aspect-square overflow-hidden rounded-lg bg-white ring-1 ring-neutral-200"
                >
                  <ProductImage imageId={img.id} alt={img.alt ?? product.name} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <h1 className="text-3xl font-bold text-neutral-900">{product.name}</h1>
          <p className="text-2xl font-bold text-brand">
            {formatPrice(product.priceCents)}
          </p>

          {product.shortDescription && (
            <p className="text-neutral-700">{product.shortDescription}</p>
          )}

          <div className="prose prose-sm max-w-none whitespace-pre-line text-neutral-700">
            {product.description}
          </div>

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

          <AddToCartButton productId={product.id} disabled={product.stock <= 0} />
        </div>
      </div>
    </div>
  );
}
