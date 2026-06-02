/**
 * Varianty produktu — zákazník si pri niektorých produktoch volí medzi
 * „Figúrkou" a „Kľúčenkou", pričom každá môže mať inú cenu.
 *
 * Produkt môže mať varianty zapnuté (`hasVariants`). V takom prípade je
 * `priceCents` len orientačná („od") cena = minimum z dvoch variantov.
 */

export type VariantId = "FIGURKA" | "KLUCENKA";

export const PRODUCT_VARIANTS: { id: VariantId; label: string }[] = [
  { id: "FIGURKA", label: "Figúrka" },
  { id: "KLUCENKA", label: "Kľúčenka" },
];

export function isValidVariant(value: string): value is VariantId {
  return PRODUCT_VARIANTS.some((v) => v.id === value);
}

export function variantLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  return PRODUCT_VARIANTS.find((v) => v.id === value)?.label ?? null;
}

export type VariantPricing = {
  hasVariants: boolean;
  priceCents: number;
  figurkaPriceCents: number | null;
  klucenkaPriceCents: number | null;
};

/** Cena za konkrétny zvolený variant (alebo základná cena pri produkte bez variantov). */
export function priceForVariant(
  p: VariantPricing,
  variant: VariantId | null | undefined
): number {
  if (!p.hasVariants) return p.priceCents;
  if (variant === "FIGURKA" && typeof p.figurkaPriceCents === "number") {
    return p.figurkaPriceCents;
  }
  if (variant === "KLUCENKA" && typeof p.klucenkaPriceCents === "number") {
    return p.klucenkaPriceCents;
  }
  return fromPriceCents(p);
}

/** „Od" cena — najnižšia z dostupných variantov (na kartách/zoradenie). */
export function fromPriceCents(p: VariantPricing): number {
  if (!p.hasVariants) return p.priceCents;
  const prices = [p.figurkaPriceCents, p.klucenkaPriceCents].filter(
    (n): n is number => typeof n === "number" && Number.isFinite(n)
  );
  return prices.length > 0 ? Math.min(...prices) : p.priceCents;
}

type ParsedVariantFields =
  | { hasVariants: boolean; figurkaPriceCents: number | null; klucenkaPriceCents: number | null }
  | { error: string };

/** Spracuje pole formulára z admin produktu (server-side). */
export function parseVariantFields(form: FormData): ParsedVariantFields {
  const hasVariants = form.get("hasVariants") === "true";
  if (!hasVariants) {
    return { hasVariants: false, figurkaPriceCents: null, klucenkaPriceCents: null };
  }
  const fig = Number(form.get("figurkaPriceCents") ?? NaN);
  const kluc = Number(form.get("klucenkaPriceCents") ?? NaN);
  if (!Number.isFinite(fig) || fig <= 0 || !Number.isFinite(kluc) || kluc <= 0) {
    return { error: "Pri variantoch zadaj platnú cenu pre figúrku aj kľúčenku." };
  }
  return {
    hasVariants: true,
    figurkaPriceCents: Math.round(fig),
    klucenkaPriceCents: Math.round(kluc),
  };
}
