"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearCart, getCart, type CartItem } from "@/lib/cart";
import { formatPrice } from "@/lib/format";

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

  useEffect(() => {
    setItems(getCart());
  }, []);

  useEffect(() => {
    const ids = items.map((i) => i.productId);
    if (ids.length === 0) {
      setProducts([]);
      return;
    }
    fetch(`/api/products/by-ids?ids=${ids.join(",")}`)
      .then((r) => r.json())
      .then((data: { products: CartProduct[] }) => setProducts(data.products))
      .catch(() => setProducts([]));
  }, [items]);

  const lineItems = items
    .map((it) => {
      const p = products.find((x) => x.id === it.productId);
      return p ? { ...it, product: p } : null;
    })
    .filter((x): x is CartItem & { product: CartProduct } => x !== null);

  const total = lineItems.reduce(
    (s, it) => s + it.product.priceCents * it.quantity,
    0
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const payload = {
      customerName: String(formData.get("customerName") ?? ""),
      customerEmail: String(formData.get("customerEmail") ?? ""),
      customerPhone: String(formData.get("customerPhone") ?? ""),
      address: String(formData.get("address") ?? ""),
      city: String(formData.get("city") ?? ""),
      postalCode: String(formData.get("postalCode") ?? ""),
      country: String(formData.get("country") ?? "Slovensko"),
      note: String(formData.get("note") ?? ""),
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

  if (items.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border-2 border-dashed border-neutral-200 bg-white p-10 text-center text-sm text-neutral-500">
        Tvoj košík je prázdny.
      </div>
    );
  }

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

      <aside className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200 h-fit">
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
        <div className="mt-4 flex items-center justify-between border-t border-neutral-200 pt-4">
          <span className="font-semibold">Celkom</span>
          <span className="text-xl font-bold text-brand">
            {formatPrice(total)}
          </span>
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
