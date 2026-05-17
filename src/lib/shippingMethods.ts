/**
 * Allowed shipping methods — fees resolved on the server (never trust client).
 * Replace / tune when Packeta API is connected.
 */
export const SHIPPING_METHODS = [
  {
    id: "packeta-pickup",
    label: "Packeta – výdajné miesto (Z-Box / pobočka)",
    feeCents: 390,
    description:
      "Po pripojení Packeta API zákazník vyberie presné miesto; cena môže byť upravená.",
  },
  {
    id: "packeta-home",
    label: "Packeta – doručenie na adresu",
    feeCents: 490,
    description: "Placeholder cena do integrácie s Packeta.",
  },
  {
    id: "personal",
    label: "Osobný odber",
    feeCents: 0,
    description: "Dohodnúť po objednaní.",
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
