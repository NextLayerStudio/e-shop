import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/ProductForm";
import { ProductImagesManager } from "@/components/admin/ProductImagesManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin – Upraviť produkt" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images: {
        orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
        select: { id: true, isPrimary: true, sortOrder: true, alt: true },
      },
    },
  });

  if (!product) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-neutral-900">{product.name}</h1>

      <ProductImagesManager
        productId={product.id}
        images={product.images}
      />

      <ProductForm
        mode="edit"
        product={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          shortDescription: product.shortDescription,
          priceCents: product.priceCents,
          stock: product.stock,
          category: product.category,
          isActive: product.isActive,
          isFeaturedHome: product.isFeaturedHome,
          isHitOfWeek: product.isHitOfWeek,
          homeSortOrder: product.homeSortOrder,
        }}
      />
    </div>
  );
}
