"use client";

const STORAGE_KEY = "iknow3d_cart_v1";

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
        typeof i?.productId === "string" && typeof i?.quantity === "number"
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
