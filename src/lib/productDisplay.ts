import type { ProductCategory } from "@/generated/prisma/enums";
import { categoryLabel } from "@/lib/productCategories";

/** Labels shown as badges on product detail (aligned with shop tone). */
export function categoryBadgeLabel(category: ProductCategory): string {
  return categoryLabel(category);
}

export function showPopularBadge(product: {
  isHitOfWeek: boolean;
  salesCount: number;
}): boolean {
  return product.isHitOfWeek || product.salesCount >= 5;
}
