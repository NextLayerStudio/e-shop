import type { ProductCategory } from "@/generated/prisma/enums";

/** Labels shown as badges on product detail (aligned with shop tone). */
export function categoryBadgeLabel(category: ProductCategory): string {
  switch (category) {
    case "PRAKTICKE":
      return "Praktické";
    case "DEKORATIVNE":
      return "Dekoratívne";
    case "HRACKY":
      return "Zábava";
    case "DOPLNKY":
      return "Doplnky";
    case "INE":
    default:
      return "Iné";
  }
}

export function showPopularBadge(product: {
  isHitOfWeek: boolean;
  salesCount: number;
}): boolean {
  return product.isHitOfWeek || product.salesCount >= 5;
}
