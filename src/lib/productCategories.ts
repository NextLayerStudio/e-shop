/**
 * Jednotný zoznam kategórií produktov (DB enum + UI).
 */
export const PRODUCT_CATEGORIES = [
  { value: "PRIVESKY_MAGNETKY", label: "Figúrky, prívesky, magnetky" },
  { value: "SPOLOCENSKE_HRY", label: "Spoločenské hry" },
  { value: "SKLADACKY_HLAVOLAMY", label: "Skladačky a hlavolamy" },
  { value: "INTERAKTIVNE_HRACKY", label: "Interaktívne hračky" },
  { value: "NA_ORGANIZOVANIE", label: "Na organizovanie" },
  { value: "OSTATNE", label: "Ostatné" },
] as const;

export type ProductCategoryValue = (typeof PRODUCT_CATEGORIES)[number]["value"];

export const PRODUCT_CATEGORY_VALUES: ProductCategoryValue[] =
  PRODUCT_CATEGORIES.map((c) => c.value);

export const DEFAULT_PRODUCT_CATEGORY: ProductCategoryValue = "OSTATNE";

export function isValidProductCategory(
  value: string
): value is ProductCategoryValue {
  return (PRODUCT_CATEGORY_VALUES as readonly string[]).includes(value);
}

export function categoryLabel(category: string): string {
  const found = PRODUCT_CATEGORIES.find((c) => c.value === category);
  return found?.label ?? "Ostatné";
}

/** Filter chips on /produkty (includes „Všetky“). */
export const PRODUCT_CATEGORY_FILTER_OPTIONS = [
  { value: "", label: "Všetky" },
  ...PRODUCT_CATEGORIES,
] as const;
