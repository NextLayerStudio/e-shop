/**
 * Allowed shipping methods — fees resolved on the server (never trust client).
 * Replace / tune when Packeta API is connected.
 */
export const SHIPPING_METHODS = [
  {
    id: "packeta-pickup",
    label: "Packeta – výdajné miesto (Z-Box / pobočka)",
    feeCents: 390,
    description: "Vyber si Z-Box alebo pobočku Packeta vo svojom okolí.",
  },
  {
    id: "packeta-home",
    label: "Packeta – doručenie na adresu",
    feeCents: 490,
    description: "Doručenie kuriérom priamo na tvoju adresu (1–2 pracovné dni).",
  },
] as const;

export type ShippingMethodId = (typeof SHIPPING_METHODS)[number]["id"];

export function getShippingMethodById(
  id: string
): (typeof SHIPPING_METHODS)[number] | undefined {
  return SHIPPING_METHODS.find((m) => m.id === id);
}

export function getShippingFeeCentsVerified(id: string): number | null {
  const m = getShippingMethodById(id);
  return m ? m.feeCents : null;
}
