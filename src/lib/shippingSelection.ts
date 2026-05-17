"use client";

const KEY = "iknow3d_shipping_v1";

export type StoredShippingMethod = {
  methodId: string;
};

export function getShippingMethodId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { methodId?: string };
    return typeof parsed.methodId === "string" ? parsed.methodId : null;
  } catch {
    return null;
  }
}

export function setShippingMethodId(methodId: string): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(KEY, JSON.stringify({ methodId }));
  window.dispatchEvent(new CustomEvent("iknow3d:shipping-changed"));
}

export function clearShippingMethodId(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(KEY);
  window.dispatchEvent(new CustomEvent("iknow3d:shipping-changed"));
}
