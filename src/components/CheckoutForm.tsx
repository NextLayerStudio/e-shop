"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { clearCart, getCart, getPromoCode, removeStaleCartItems, type CartItem } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { getShippingMethodById } from "@/lib/shippingMethods";
import { getShippingMethodId } from "@/lib/shippingSelection";

type CartProduct = {
  id: string;
  name: string;
  priceCents: number;
};

export function CheckoutForm() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<CartProduct[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoRev, setPromoRev] = useState(0);
  const [shippingRev, setShippingRev] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  const bumpPromo = useCallback(() => setPromoRev((x) => x + 1), []);

  useEffect(() => {
    setItems(getCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    const onPromo = () => bumpPromo();
    window.addEventListener("iknow3d:promo-changed", onPromo);
    return () => window.removeEventListener("iknow3d:promo-changed", onPromo);
  }, [bumpPromo]);

  useEffect(() => {
    const onShip = () => setShippingRev((x) => x + 1);
    window.addEventListener("iknow3d:shipping-changed", onShip);
    return () => window.removeEventListener("iknow3d:shipping-changed", onShip);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (items.length === 0) return;
    if (!getShippingMethodId()) {
      router.replace("/pokladna/doprava");
    }
  }, [hydrated, items.length, router, shippingRev]);

  useEffect(() => {
    const ids = items.map((i) => i.productId);
    if (ids.length === 0) {
      setProducts([]);
      return;
    }
    fetch(`/api/products/by-ids?ids=${ids.join(",")}`)
      .then((r) => {
        if (!r.ok) throw new Error("products fetch failed");
        return r.json();
      })
      .then((data: { products: CartProduct[] }) => {
        removeStaleCartItems(data.products.map((p) => p.id));
        setItems(getCart());
        setProducts(data.products);
      })
      .catch(() => setProducts([]));
  }, [items]);

  const lineItems = items
    .map((it) => {
      const p = products.find((x) => x.id === it.productId);
      return p ? { ...it, product: p } : null;
    })
    .filter((x): x is CartItem & { product: CartProduct } => x !== null);

  const subtotal = useMemo(
    () =>
      lineItems.reduce(
        (s, it) => s + it.product.priceCents * it.quantity,
        0
      ),
    [lineItems]
  );

  useEffect(() => {
    if (lineItems.length === 0) {
      setPromoDiscount(0);
      return;
    }
    const code = getPromoCode();
    if (!code) {
      setPromoDiscount(0);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/promo/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, subtotalCents: subtotal }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          discountCents?: number;
        };
        if (cancelled) return;
        if (data.ok && typeof data.discountCents === "number") {
          setPromoDiscount(data.discountCents);
        } else {
          setPromoDiscount(0);
        }
      } catch {
        if (!cancelled) setPromoDiscount(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [subtotal, lineItems.length, promoRev]);

  const shippingId = getShippingMethodId();
  const shippingMethod = shippingId
    ? getShippingMethodById(shippingId)
    : undefined;
  const shippingCents = shippingMethod?.feeCents ?? 0;
  const total = Math.max(0, subtotal - promoDiscount + shippingCents);
  const appliedCode = getPromoCode();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const shipId = getShippingMethodId();
    if (!shipId || !getShippingMethodById(shipId)) {
      setError("Vyber spôsob dopravy.");
      setSubmitting(false);
      return;
    }

    const payload = {
      customerName: String(formData.get("customerName") ?? ""),
      customerEmail: String(formData.get("customerEmail") ?? ""),
      customerPhone: String(formData.get("customerPhone") ?? ""),
      address: String(formData.get("address") ?? ""),
      city: String(formData.get("city") ?? ""),
      postalCode: String(formData.get("postalCode") ?? ""),
      country: String(formData.get("country") ?? "Slovensko"),
      note: String(formData.get("note") ?? ""),
      promoCode: getPromoCode() ?? "",
      shippingMethodId: shipId,
      items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Nepodarilo sa odoslať objednávku.");
        setSubmitting(false);
        return;
      }
      clearCart();
      router.push(`/objednavka/${data.orderNumber}`);
    } catch {
      setError("Pri odosielaní nastala chyba. Skús to prosím znovu.");
      setSubmitting(false);
    }
  }

  if (!hydrated) {
    return (
      <p className="mt-6 text-sm text-neutral-500">Načítavam…</p>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border-2 border-dashed border-neutral-200 bg-white p-10 text-center text-sm text-neutral-500">
        Tvoj košík je prázdny.
      </div>
    );
  }

  if (hydrated && !shippingMethod) {
    return (
      <div className="mt-6 rounded-2xl bg-white p-6 text-center ring-1 ring-neutral-200">
        <p className="text-sm text-neutral-600">
          Presmerovávam na výber dopravy…
        </p>
        <Link
          href="/pokladna/doprava"
          className="mt-4 inline-block text-sm font-semibold text-brand hover:text-brand-dark"
        >
          Ak sa nič nestane, klikni sem
        </Link>
      </div>
    );
  }

  const showPromo = appliedCode && promoDiscount > 0;

  return (
    <form onSubmit={onSubmit} className="mt-6 grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200">
          <h2 className="text-base font-semibold text-neutral-900">Kontaktné údaje</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field name="customerName" label="Meno a priezvisko" required />
            <Field name="customerEmail" label="Email" type="email" required />
            <Field name="customerPhone" label="Telefón" type="tel" />
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200">
          <h2 className="text-base font-semibold text-neutral-900">Doručovacia adresa</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field name="address" label="Ulica a číslo" required />
            <Field name="city" label="Mesto" required />
            <Field name="postalCode" label="PSČ" required />
            <Field name="country" label="Krajina" defaultValue="Slovensko" required />
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200">
          <h2 className="text-base font-semibold text-neutral-900">Poznámka</h2>
          <textarea
            name="note"
            rows={3}
            className="mt-3 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            placeholder="Voliteľná poznámka pre kuriéra alebo predávajúceho…"
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200">
            {error}
          </div>
        )}
      </div>

      <aside className="h-fit rounded-2xl bg-white p-5 ring-1 ring-neutral-200">
        <h2 className="text-lg font-bold text-neutral-900">Tvoja objednávka</h2>
        <ul className="mt-4 divide-y divide-neutral-100">
          {lineItems.map((it) => (
            <li
              key={it.productId}
              className="flex items-center justify-between gap-2 py-2 text-sm"
            >
              <span className="truncate">
                {it.product.name}{" "}
                <span className="text-neutral-400">× {it.quantity}</span>
              </span>
              <span className="font-semibold">
                {formatPrice(it.product.priceCents * it.quantity)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 space-y-1 border-t border-neutral-200 pt-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-neutral-600">Medzisúčet</span>
            <span className="font-semibold">{formatPrice(subtotal)}</span>
          </div>
          {showPromo && (
            <>
              <div className="flex items-center justify-between text-green-700">
                <span>
                  Zľava ({appliedCode})
                </span>
                <span className="font-semibold">
                  −{formatPrice(promoDiscount)}
                </span>
              </div>
            </>
          )}
          {shippingMethod && (
            <div className="flex items-center justify-between text-neutral-700">
              <span className="max-w-[65%] leading-snug">
                Doprava — {shippingMethod.label}
              </span>
              <span className="flex-shrink-0 font-semibold">
                {shippingCents === 0 ? "Zdarma" : formatPrice(shippingCents)}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between border-t border-neutral-200 pt-3">
            <span className="font-semibold">Celkom</span>
            <span className="text-xl font-bold text-brand">{formatPrice(total)}</span>
          </div>
        </div>
        <button
          type="submit"
          disabled={submitting || lineItems.length === 0}
          className="mt-5 block w-full rounded-full bg-brand py-3 text-center text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {submitting ? "Odosielam…" : "Odoslať objednávku"}
        </button>
      </aside>
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  required,
  defaultValue,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-neutral-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
      />
    </label>
  );
}
