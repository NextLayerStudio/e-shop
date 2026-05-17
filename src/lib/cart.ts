"use client";

import { clearShippingMethodId } from "@/lib/shippingSelection";

const STORAGE_KEY = "iknow3d_cart_v1";
const PROMO_KEY = "iknow3d_promo_v1";

export type CartItem = {
  productId: string;
  quantity: number;
};

type CartChangeListener = (items: CartItem[]) => void;
const listeners = new Set<CartChangeListener>();

function read(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (i): i is CartItem =>
        typeof i?.productId === "string" &&
        typeof i?.quantity === "number" &&
        Number.isFinite(i.quantity) &&
        i.quantity > 0
    );
  } catch {
    return [];
  }
}

function write(items: CartItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  listeners.forEach((l) => l(items));
  window.dispatchEvent(new CustomEvent("iknow3d:cart-changed"));
}

export function getCart(): CartItem[] {
  return read();
}

export function addToCart(productId: string, quantity = 1): void {
  const items = read();
  const existing = items.find((i) => i.productId === productId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    items.push({ productId, quantity });
  }
  write(items);
}

export function setQuantity(productId: string, quantity: number): void {
  const items = read();
  const existing = items.find((i) => i.productId === productId);
  if (!existing) return;
  if (quantity <= 0) {
    write(items.filter((i) => i.productId !== productId));
  } else {
    existing.quantity = quantity;
    write(items);
  }
}

export function removeFromCart(productId: string): void {
  write(read().filter((i) => i.productId !== productId));
}

export function clearCart(): void {
  write([]);
  clearPromoCode();
  clearShippingMethodId();
}

/**
 * Drops cart lines whose products no longer exist (e.g. deleted in admin).
 * Call after a successful `GET /api/products/by-ids` so the badge and košík stay in sync.
 */
export function removeStaleCartItems(existingProductIds: Iterable<string>): void {
  const allowed = new Set(existingProductIds);
  const current = read();
  const next = current.filter((i) => allowed.has(i.productId));
  if (next.length !== current.length) write(next);
}

export function getPromoCode(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PROMO_KEY);
    if (!raw) return null;
    const s = raw.trim();
    return s ? normalizePromoStored(s) : null;
  } catch {
    return null;
  }
}

function normalizePromoStored(s: string): string {
  return s.trim().toUpperCase();
}

export function setPromoCode(code: string | null): void {
  if (typeof window === "undefined") return;
  if (!code) {
    window.localStorage.removeItem(PROMO_KEY);
  } else {
    window.localStorage.setItem(PROMO_KEY, normalizePromoStored(code));
  }
  window.dispatchEvent(new CustomEvent("iknow3d:promo-changed"));
}

export function clearPromoCode(): void {
  setPromoCode(null);
}

export function totalQuantity(): number {
  return read().reduce((s, i) => s + i.quantity, 0);
}

export function subscribe(listener: CartChangeListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
