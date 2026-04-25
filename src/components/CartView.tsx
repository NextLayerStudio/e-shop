"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCart, removeFromCart, setQuantity, type CartItem } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { ProductImage } from "./ProductImage";

type CartProduct = {
  id: string;
  slug: string;
  name: string;
  priceCents: number;
  stock: number;
  primaryImageId: string | null;
};

export function CartView() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<CartProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const update = () => setItems(getCart());
    update();
    window.addEventListener("iknow3d:cart-changed", update);
    return () => window.removeEventListener("iknow3d:cart-changed", update);
  }, []);

  useEffect(() => {
    const ids = items.map((i) => i.productId);
    if (ids.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/products/by-ids?ids=${ids.join(",")}`)
      .then((r) => r.json())
      .then((data: { products: CartProduct[] }) => setProducts(data.products))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [items]);

  const itemsWithProduct = items
    .map((it) => {
      const product = products.find((p) => p.id === it.productId);
      return product ? { ...it, product } : null;
    })
    .filter((x): x is CartItem & { product: CartProduct } => x !== null);

  const subtotal = itemsWithProduct.reduce(
    (sum, it) => sum + it.product.priceCents * it.quantity,
    0
  );

  if (loading && items.length > 0) {
    return <p className="mt-6 text-sm text-neutral-500">Načítavam košík…</p>;
  }

  if (itemsWithProduct.length === 0) {
    return (
      <div className="mt-8 rounded-2xl border-2 border-dashed border-neutral-200 bg-white p-10 text-center">
        <p className="text-neutral-600">Tvoj košík je prázdny.</p>
        <Link
          href="/produkty"
          className="mt-4 inline-block rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Pozrieť produkty
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-3">
      <ul className="lg:col-span-2 space-y-3">
        {itemsWithProduct.map((it) => (
          <li
            key={it.productId}
            className="flex items-center gap-4 rounded-2xl bg-white p-3 ring-1 ring-neutral-200"
          >
            <Link
              href={`/produkty/${it.product.slug}`}
              className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-neutral-100"
            >
              <ProductImage
                imageId={it.product.primaryImageId}
                alt={it.product.name}
              />
            </Link>
            <div className="min-w-0 flex-1">
              <Link
                href={`/produkty/${it.product.slug}`}
                className="block truncate font-semibold text-neutral-900 hover:text-brand"
              >
                {it.product.name}
              </Link>
              <p className="text-sm text-neutral-500">
                {formatPrice(it.product.priceCents)} / ks
              </p>
            </div>
            <div className="inline-flex items-center rounded-full ring-1 ring-neutral-200 bg-white">
              <button
                onClick={() => setQuantity(it.productId, it.quantity - 1)}
                className="h-8 w-8 text-neutral-600"
                aria-label="Znížiť"
              >
                −
              </button>
              <span className="w-8 text-center text-sm font-semibold">
                {it.quantity}
              </span>
              <button
                onClick={() => setQuantity(it.productId, it.quantity + 1)}
                className="h-8 w-8 text-neutral-600"
                aria-label="Zvýšiť"
              >
                +
              </button>
            </div>
            <p className="w-24 text-right font-bold text-neutral-900">
              {formatPrice(it.product.priceCents * it.quantity)}
            </p>
            <button
              onClick={() => removeFromCart(it.productId)}
              className="text-neutral-400 hover:text-red-500"
              aria-label="Odstrániť"
            >
              ×
            </button>
          </li>
        ))}
      </ul>

      <aside className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200 h-fit">
        <h2 className="text-lg font-bold text-neutral-900">Súhrn</h2>
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-neutral-600">Medzisúčet</span>
          <span className="font-semibold">{formatPrice(subtotal)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-sm">
          <span className="text-neutral-600">Doprava</span>
          <span className="text-neutral-500">vypočíta sa pri pokladni</span>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-neutral-200 pt-4">
          <span className="font-semibold text-neutral-900">Celkom</span>
          <span className="text-xl font-bold text-brand">
            {formatPrice(subtotal)}
          </span>
        </div>
        <Link
          href="/pokladna"
          className="mt-5 block w-full rounded-full bg-brand py-3 text-center text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Pokračovať k pokladni
        </Link>
      </aside>
    </div>
  );
}
