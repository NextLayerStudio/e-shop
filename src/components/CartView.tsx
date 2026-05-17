"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  clearPromoCode,
  getCart,
  getPromoCode,
  removeFromCart,
  removeStaleCartItems,
  setPromoCode,
  setQuantity,
  type CartItem,
} from "@/lib/cart";
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
  const [promoInput, setPromoInput] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoBusy, setPromoBusy] = useState(false);
  const [promoRev, setPromoRev] = useState(0);
  const bumpPromo = useCallback(() => setPromoRev((x) => x + 1), []);

  useEffect(() => {
    const update = () => setItems(getCart());
    update();
    window.addEventListener("iknow3d:cart-changed", update);
    return () => window.removeEventListener("iknow3d:cart-changed", update);
  }, []);

  useEffect(() => {
    const c = getPromoCode();
    if (c) setPromoInput(c);
  }, []);

  useEffect(() => {
    const onPromo = () => bumpPromo();
    window.addEventListener("iknow3d:promo-changed", onPromo);
    return () => window.removeEventListener("iknow3d:promo-changed", onPromo);
  }, [bumpPromo]);

  useEffect(() => {
    const ids = items.map((i) => i.productId);
    if (ids.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/products/by-ids?ids=${ids.join(",")}`)
      .then((r) => {
        if (!r.ok) throw new Error("products fetch failed");
        return r.json();
      })
      .then((data: { products: CartProduct[] }) => {
        removeStaleCartItems(data.products.map((p) => p.id));
        setProducts(data.products);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [items]);

  const itemsWithProduct = items
    .map((it) => {
      const product = products.find((p) => p.id === it.productId);
      return product ? { ...it, product } : null;
    })
    .filter((x): x is CartItem & { product: CartProduct } => x !== null);

  const subtotal = useMemo(
    () =>
      itemsWithProduct.reduce(
        (sum, it) => sum + it.product.priceCents * it.quantity,
        0
      ),
    [itemsWithProduct]
  );

  useEffect(() => {
    if (itemsWithProduct.length === 0) {
      if (getPromoCode()) clearPromoCode();
      setPromoDiscount(0);
      setPromoError(null);
      return;
    }

    const code = getPromoCode();
    if (!code) {
      setPromoDiscount(0);
      setPromoError(null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/promo/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, subtotalCents: subtotal }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          discountCents?: number;
          error?: string;
        };
        if (cancelled) return;
        if (data.ok && typeof data.discountCents === "number") {
          setPromoDiscount(data.discountCents);
          setPromoError(null);
        } else {
          setPromoDiscount(0);
          setPromoError(data.error ?? "Kupón nie je platný.");
          clearPromoCode();
        }
      } catch {
        if (!cancelled) {
          setPromoDiscount(0);
          setPromoError("Nepodarilo sa overiť kupón.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [subtotal, itemsWithProduct.length, promoRev]);

  async function applyPromo(e: React.FormEvent) {
    e.preventDefault();
    const raw = promoInput.trim();
    setPromoError(null);
    if (!raw) {
      setPromoError("Zadaj kód kupónu.");
      return;
    }
    if (itemsWithProduct.length === 0) return;
    setPromoBusy(true);
    try {
      const res = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: raw, subtotalCents: subtotal }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        discountCents?: number;
        error?: string;
      };
      if (data.ok && typeof data.discountCents === "number") {
        setPromoCode(raw);
        setPromoDiscount(data.discountCents);
        setPromoError(null);
        bumpPromo();
      } else {
        setPromoError(data.error ?? "Kupón nie je platný.");
      }
    } catch {
      setPromoError("Nepodarilo sa overiť kupón.");
    } finally {
      setPromoBusy(false);
    }
  }

  function removePromo() {
    clearPromoCode();
    setPromoInput("");
    setPromoDiscount(0);
    setPromoError(null);
    bumpPromo();
  }

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

  const total = Math.max(0, subtotal - promoDiscount);
  const hasPromo = !!getPromoCode() && promoDiscount > 0;

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-3">
      <ul className="space-y-3 lg:col-span-2">
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
            <div className="inline-flex items-center rounded-full bg-white ring-1 ring-neutral-200">
              <button
                type="button"
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
                type="button"
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
              type="button"
              onClick={() => removeFromCart(it.productId)}
              className="text-neutral-400 hover:text-red-500"
              aria-label="Odstrániť"
            >
              ×
            </button>
          </li>
        ))}
      </ul>

      <aside className="h-fit rounded-2xl bg-white p-5 ring-1 ring-neutral-200">
        <h2 className="text-lg font-bold text-neutral-900">Súhrn</h2>

        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-neutral-600">Medzisúčet</span>
          <span className="font-semibold">{formatPrice(subtotal)}</span>
        </div>
        {hasPromo && (
          <div className="mt-1 flex items-center justify-between text-sm text-green-700">
            <span>Zľava (kupón)</span>
            <span className="font-semibold">
              −{formatPrice(promoDiscount)}
            </span>
          </div>
        )}

        <form onSubmit={applyPromo} className="mt-4 space-y-2 border-t border-neutral-200 pt-4">
          <label className="block text-xs font-medium text-neutral-600">
            Promo kód
          </label>
          <div className="flex gap-2">
            <input
              value={promoInput}
              onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
              placeholder="napr. LETO2026"
              maxLength={40}
              className="min-w-0 flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm uppercase placeholder:normal-case placeholder:text-neutral-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              disabled={promoBusy}
            />
            <button
              type="submit"
              disabled={promoBusy}
              className="flex-shrink-0 rounded-lg bg-neutral-900 px-3 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              Použiť
            </button>
          </div>
          {promoError && (
            <p className="text-xs text-red-600">{promoError}</p>
          )}
          {hasPromo && (
            <p className="flex items-center justify-between text-xs text-neutral-600">
              <span>
                Aktívny kód:{" "}
                <span className="font-semibold text-neutral-900">
                  {getPromoCode()}
                </span>
              </span>
              <button
                type="button"
                onClick={removePromo}
                className="font-medium text-brand hover:text-brand-dark"
              >
                Odstrániť
              </button>
            </p>
          )}
        </form>

        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-neutral-600">Doprava</span>
          <span className="text-right text-neutral-500">
            zobrazí sa po výbere v kroku Doprava
          </span>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-neutral-200 pt-4">
          <span className="font-semibold text-neutral-900">Celkom</span>
          <span className="text-xl font-bold text-brand">{formatPrice(total)}</span>
        </div>
        <p className="mt-1 text-xs text-neutral-400">
          Bez dopravy — po zadaní dopravy sa k medzisúčtu pripočíta poplatok.
        </p>
        <Link
          href="/pokladna/doprava"
          className="mt-5 block w-full rounded-full bg-brand py-3 text-center text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Pokračovať k doprave
        </Link>
      </aside>
    </div>
  );
}
