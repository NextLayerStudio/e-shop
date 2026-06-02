"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  clearCart,
  getCart,
  getPromoCode,
  removeStaleCartItems,
  type CartItem,
} from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { getShippingMethodById } from "@/lib/shippingMethods";
import { getShippingMethodId } from "@/lib/shippingSelection";
import { getPacketaPoint } from "@/lib/packeta-selection";
import { priceForVariant, variantLabel } from "@/lib/productVariants";
import { cartLineKey } from "@/lib/cart";

// ---------------------------------------------------------------------------
// Typy
// ---------------------------------------------------------------------------

type Step = "form" | "payment";

interface FormValues {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  note: string;
}

/** Výsledok z POST /api/orders — potrebujeme ho na krok 2 */
interface OrderResult {
  orderNumber: string;
  qrCodeDataUrl: string | null;
  iban: string;
  variableSymbol: string;
  totalCents: number;
}

type CartProduct = {
  id: string;
  name: string;
  priceCents: number;
  hasVariants: boolean;
  figurkaPriceCents: number | null;
  klucenkaPriceCents: number | null;
};

// ---------------------------------------------------------------------------
// Komponent
// ---------------------------------------------------------------------------

export function CheckoutForm() {
  const router = useRouter();

  // Krok: "form" = vyplnenie údajov, "payment" = QR + platobné údaje
  const [step, setStep] = useState<Step>("form");

  // Formulárové hodnoty — controlled inputs (zachovajú sa pri prechode)
  const [formValues, setFormValues] = useState<FormValues>({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "Slovensko",
    note: "",
  });

  // Výsledok vytvorenej objednávky (krok 2)
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);

  // Košík a produkty
  const [items, setItems] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<CartProduct[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Zľava a doprava
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoRev, setPromoRev] = useState(0);
  const [shippingRev, setShippingRev] = useState(0);

  // Stavy odosielania
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bumpPromo = useCallback(() => setPromoRev((x) => x + 1), []);

  // ---------------------------------------------------------------------------
  // Inicializácia košíka
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const syncCart = () => setItems(getCart());
    syncCart();
    window.addEventListener("iknow3d:cart-changed", syncCart);
    return () => window.removeEventListener("iknow3d:cart-changed", syncCart);
  }, []);

  const cartKey = items
    .map((i) => `${cartLineKey(i)}:${i.quantity}`)
    .join(",");

  useEffect(() => {
    const ids = items.map((i) => i.productId);
    if (ids.length === 0) {
      setProducts([]);
      return;
    }
    let cancelled = false;
    fetch(`/api/products/by-ids?ids=${ids.join(",")}`)
      .then((r) => {
        if (!r.ok) throw new Error("products fetch failed");
        return r.json();
      })
      .then((data: { products: CartProduct[] }) => {
        if (cancelled) return;
        removeStaleCartItems(data.products.map((p) => p.id));
        setProducts(data.products);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      });
    return () => {
      cancelled = true;
    };
  }, [cartKey]);

  useEffect(() => {
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
    if (step !== "form") return; // platobný krok — nepresmerouvaj
    if (items.length === 0) return;
    if (!getShippingMethodId()) {
      router.replace("/pokladna/doprava");
    }
  }, [hydrated, step, items.length, router, shippingRev]);

  // ---------------------------------------------------------------------------
  // Výpočty
  // ---------------------------------------------------------------------------

  const lineItems = items
    .map((it) => {
      const p = products.find((x) => x.id === it.productId);
      return p ? { ...it, product: p } : null;
    })
    .filter((x): x is CartItem & { product: CartProduct } => x !== null);

  const subtotal = useMemo(
    () =>
      lineItems.reduce(
        (s, it) =>
          s + priceForVariant(it.product, it.variant ?? null) * it.quantity,
        0
      ),
    [lineItems]
  );

  useEffect(() => {
    if (lineItems.length === 0) { setPromoDiscount(0); return; }
    const code = getPromoCode();
    if (!code) { setPromoDiscount(0); return; }
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/promo/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, subtotalCents: subtotal }),
        });
        const data = (await res.json()) as { ok?: boolean; discountCents?: number };
        if (cancelled) return;
        setPromoDiscount(data.ok && typeof data.discountCents === "number" ? data.discountCents : 0);
      } catch {
        if (!cancelled) setPromoDiscount(0);
      }
    })();
    return () => { cancelled = true; };
  }, [subtotal, lineItems.length, promoRev]);

  const shippingId = getShippingMethodId();
  const shippingMethod = shippingId ? getShippingMethodById(shippingId) : undefined;
  const shippingCents = shippingMethod?.feeCents ?? 0;
  const total = Math.max(0, subtotal - promoDiscount + shippingCents);
  const appliedCode = getPromoCode();
  const showPromo = !!appliedCode && promoDiscount > 0;
  const isPacketaPickup = shippingId === "packeta-pickup";

  // ---------------------------------------------------------------------------
  // Krok 1 → Krok 2: vytvorí objednávku, zobrazí QR s VS
  // ---------------------------------------------------------------------------

  async function handleGoToPayment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;

    setError(null);
    setSubmitting(true);

    const fd = new FormData(e.currentTarget);
    const values: FormValues = {
      customerName: String(fd.get("customerName") ?? ""),
      customerEmail: String(fd.get("customerEmail") ?? ""),
      customerPhone: String(fd.get("customerPhone") ?? ""),
      address: String(fd.get("address") ?? ""),
      city: String(fd.get("city") ?? ""),
      postalCode: String(fd.get("postalCode") ?? ""),
      country: String(fd.get("country") ?? "Slovensko"),
      note: String(fd.get("note") ?? ""),
    };
    setFormValues(values);

    const shipId = getShippingMethodId();
    if (!shipId || !getShippingMethodById(shipId)) {
      setError("Vyber spôsob dopravy.");
      setSubmitting(false);
      return;
    }

    // Packeta výdajné miesto — odoslať ak bolo vybrané
    const packetaPoint = getPacketaPoint();
    const isPacketaPickup = shipId === "packeta-pickup";

    if (isPacketaPickup && !packetaPoint) {
      setError("Vyber výdajné miesto Packeta na stránke dopravy.");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: values.customerName,
          customerEmail: values.customerEmail,
          customerPhone: values.customerPhone,
          address: values.address,
          city: values.city,
          postalCode: values.postalCode,
          country: values.country,
          note: values.note,
          promoCode: getPromoCode() ?? "",
          shippingMethodId: shipId,
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            variant: i.variant ?? null,
          })),
          // Packeta polia — voliteľné
          packetaPointId: packetaPoint?.pointId ?? null,
          packetaPointName: packetaPoint?.pointName ?? null,
          packetaPointAddress: packetaPoint?.pointAddress ?? null,
          packetaIsoCountry: packetaPoint?.isoCountry ?? null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Nepodarilo sa vytvoriť objednávku.");
        setSubmitting(false);
        return;
      }

      // Objednávka vznikla — vyčistíme košík a zobrazíme krok 2
      clearCart();
      setOrderResult({
        orderNumber: data.orderNumber,
        qrCodeDataUrl: data.qrCodeDataUrl ?? null,
        iban: data.iban ?? "",
        variableSymbol: data.variableSymbol ?? "",
        totalCents: data.totalCents ?? total,
      });
      setStep("payment");
    } catch {
      setError("Pri odosielaní nastala chyba. Skús to prosím znovu.");
    } finally {
      setSubmitting(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Krok 2: dokončenie — presmerovanie na potvrdenie
  // ---------------------------------------------------------------------------

  function handleFinish() {
    if (orderResult) {
      router.push(`/objednavka/${orderResult.orderNumber}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Render — ochranné stavy
  // ---------------------------------------------------------------------------

  if (!hydrated) {
    return <p className="mt-6 text-sm text-neutral-500">Načítavam…</p>;
  }

  if (items.length === 0 && step === "form") {
    return (
      <div className="mt-6 rounded-2xl border-2 border-dashed border-neutral-200 bg-white p-10 text-center text-sm text-neutral-500">
        Tvoj košík je prázdny.
      </div>
    );
  }

  if (hydrated && !shippingMethod && step === "form") {
    return (
      <div className="mt-6 rounded-2xl bg-white p-6 text-center ring-1 ring-neutral-200">
        <p className="text-sm text-neutral-600">Presmerovávam na výber dopravy…</p>
        <Link
          href="/pokladna/doprava"
          className="mt-4 inline-block text-sm font-semibold text-brand hover:text-brand-dark"
        >
          Ak sa nič nestane, klikni sem
        </Link>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render — Krok 1: Formulár
  // ---------------------------------------------------------------------------

  if (step === "form") {
    return (
      <form onSubmit={handleGoToPayment} className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200">
            <h2 className="text-base font-semibold text-neutral-900">Kontaktné údaje</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field
                name="customerName"
                label="Meno a priezvisko"
                required
                value={formValues.customerName}
                onChange={(v) => setFormValues((f) => ({ ...f, customerName: v }))}
              />
              <Field
                name="customerEmail"
                label="Email"
                type="email"
                required
                value={formValues.customerEmail}
                onChange={(v) => setFormValues((f) => ({ ...f, customerEmail: v }))}
              />
              <Field
                name="customerPhone"
                label="Telefón"
                type="tel"
                value={formValues.customerPhone}
                onChange={(v) => setFormValues((f) => ({ ...f, customerPhone: v }))}
              />
            </div>
          </div>

          {isPacketaPickup ? (
            /* Packeta pickup — zobraz zvolené výdajné miesto, žiadna adresa */
            <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200">
              <h2 className="text-base font-semibold text-neutral-900">Výdajné miesto</h2>
              {(() => {
                const pp = getPacketaPoint();
                if (!pp) return (
                  <p className="mt-3 text-sm text-red-600">
                    Výdajné miesto Packeta nie je zvolené.{" "}
                    <a href="/pokladna/doprava" className="underline">Vyber ho späť.</a>
                  </p>
                );
                return (
                  <div className="mt-3 rounded-lg bg-violet-50 p-3 ring-1 ring-violet-200 text-sm">
                    <p className="font-semibold text-violet-900">✓ {pp.pointName}</p>
                    {pp.pointAddress && <p className="mt-0.5 text-neutral-600">{pp.pointAddress}</p>}
                  </div>
                );
              })()}
              {/* Hidden fields — Packeta point data passes server validation */}
              <input type="hidden" name="address" value={getPacketaPoint()?.pointAddress || getPacketaPoint()?.pointName || "Packeta"} />
              <input type="hidden" name="city" value={getPacketaPoint()?.pointName || "Packeta"} />
              <input type="hidden" name="postalCode" value="000 00" />
              <input type="hidden" name="country" value={getPacketaPoint()?.isoCountry || "SK"} />
            </div>
          ) : (
            <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200">
              <h2 className="text-base font-semibold text-neutral-900">Doručovacia adresa</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field
                  name="address"
                  label="Ulica a číslo"
                  required
                  value={formValues.address}
                  onChange={(v) => setFormValues((f) => ({ ...f, address: v }))}
                />
                <Field
                  name="city"
                  label="Mesto"
                  required
                  value={formValues.city}
                  onChange={(v) => setFormValues((f) => ({ ...f, city: v }))}
                />
                <Field
                  name="postalCode"
                  label="PSČ"
                  required
                  value={formValues.postalCode}
                  onChange={(v) => setFormValues((f) => ({ ...f, postalCode: v }))}
                />
                <Field
                  name="country"
                  label="Krajina"
                  required
                  value={formValues.country}
                  onChange={(v) => setFormValues((f) => ({ ...f, country: v }))}
                />
              </div>
            </div>
          )}

          <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200">
            <h2 className="text-base font-semibold text-neutral-900">Poznámka</h2>
            <textarea
              name="note"
              rows={3}
              value={formValues.note}
              onChange={(e) => setFormValues((f) => ({ ...f, note: e.target.value }))}
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

        {/* Bočný panel */}
        <aside className="h-fit rounded-2xl bg-white p-5 ring-1 ring-neutral-200">
          <h2 className="text-lg font-bold text-neutral-900">Tvoja objednávka</h2>
          <OrderSummary
            lineItems={lineItems}
            subtotal={subtotal}
            promoDiscount={showPromo ? promoDiscount : 0}
            appliedCode={showPromo ? appliedCode : null}
            shippingMethod={shippingMethod ?? null}
            shippingCents={shippingCents}
            total={total}
          />
          <button
            type="submit"
            disabled={submitting || lineItems.length === 0}
            className="mt-5 block w-full rounded-full bg-brand py-3 text-center text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
          >
            {submitting ? "Vytvárám objednávku…" : "Pokračovať k platbe →"}
          </button>
        </aside>
      </form>
    );
  }

  // ---------------------------------------------------------------------------
  // Render — Krok 2: Platba (objednávka už existuje v DB)
  // ---------------------------------------------------------------------------

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">

        {/* Rekapitulácia kontaktu */}
        <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200">
          <h2 className="mb-3 text-base font-semibold text-neutral-900">Kontaktné údaje</h2>
          <div className="space-y-1 text-sm text-neutral-600">
            <p>{formValues.customerName}</p>
            <p>
              {formValues.customerEmail}
              {formValues.customerPhone ? ` · ${formValues.customerPhone}` : ""}
            </p>
            {/* Ak packeta-pickup: zobraz výdajné miesto; inak klasická adresa */}
            {(() => {
              const pp = getPacketaPoint();
              if (shippingMethod?.id === "packeta-pickup" && pp) {
                return (
                  <p className="pt-1">
                    <span className="font-medium text-neutral-800">{pp.pointName}</span>
                    {pp.pointAddress && (
                      <><br /><span className="text-neutral-500">{pp.pointAddress}</span></>
                    )}
                  </p>
                );
              }
              return (
                <p>
                  {formValues.address}, {formValues.postalCode} {formValues.city},{" "}
                  {formValues.country}
                </p>
              );
            })()}
          </div>
        </div>

        {/* QR platba */}
        <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200">
          <h2 className="mb-4 text-base font-semibold text-neutral-900">Platba prevodom</h2>

          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-8">

            {/* QR kód */}
            {orderResult?.qrCodeDataUrl ? (
              <div className="flex flex-col items-center gap-2 flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={orderResult.qrCodeDataUrl}
                  alt="Pay by Square QR kód"
                  width={180}
                  height={180}
                  className="rounded-lg border border-neutral-200 bg-white p-2"
                />
                <p className="max-w-[180px] text-center text-xs leading-relaxed text-neutral-400">
                  Naskenujte vo svojej bankovej aplikácii
                </p>
              </div>
            ) : null}

            {/* Platobné údaje */}
            <div className="space-y-3 text-sm min-w-0 flex-1">
              {orderResult?.iban && (
                <PayRow label="IBAN" value={orderResult.iban} mono />
              )}
              <PayRow label="Suma" value={formatPrice(orderResult?.totalCents ?? 0)} bold />
              {orderResult?.variableSymbol && (
                <PayRow label="VS" value={orderResult.variableSymbol} mono />
              )}
              {orderResult?.orderNumber && (
                <PayRow label="Správa" value={`Objednávka ${orderResult.orderNumber}`} />
              )}
              <p className="pt-1 text-xs text-neutral-400 leading-relaxed">
                Platbu môžete vykonať teraz alebo kedykoľvek neskôr.
                Platobné údaje vám pošleme aj na email.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200">
            {error}
          </div>
        )}
      </div>

      {/* Bočný panel — krok 2 zobrazuje sumy z potvrdenej objednávky */}
      <aside className="h-fit rounded-2xl bg-white p-5 ring-1 ring-neutral-200">
        <h2 className="text-lg font-bold text-neutral-900">Tvoja objednávka</h2>
        <div className="mt-4 border-t border-neutral-200 pt-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-neutral-700">Celkom na úhradu</span>
            <span className="text-xl font-bold text-brand">
              {formatPrice(orderResult?.totalCents ?? 0)}
            </span>
          </div>
          <p className="mt-1 text-xs text-neutral-400">
            vrátane dopravy a všetkých poplatkov
          </p>
        </div>
        <button
          type="button"
          onClick={handleFinish}
          className="mt-5 block w-full rounded-full bg-brand py-3 text-center text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Dokončiť objednávku →
        </button>
        <p className="mt-2 text-center text-xs text-neutral-400">
          Objednávka č. {orderResult?.orderNumber}
        </p>
      </aside>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pomocné komponenty
// ---------------------------------------------------------------------------

function Field({
  name,
  label,
  type = "text",
  required,
  value,
  onChange,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
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
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
      />
    </label>
  );
}

function PayRow({
  label,
  value,
  mono = false,
  bold = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  bold?: boolean;
}) {
  return (
    <div className="flex gap-3 items-start">
      <span className="w-14 flex-shrink-0 text-neutral-400 pt-px">{label}</span>
      <span
        className={`break-all ${mono ? "font-mono" : ""} ${bold ? "font-semibold text-brand" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

function OrderSummary({
  lineItems,
  subtotal,
  promoDiscount,
  appliedCode,
  shippingMethod,
  shippingCents,
  total,
}: {
  lineItems: Array<CartItem & { product: CartProduct }>;
  subtotal: number;
  promoDiscount: number;
  appliedCode: string | null;
  shippingMethod: { label: string; feeCents: number } | null;
  shippingCents: number;
  total: number;
}) {
  return (
    <>
      <ul className="mt-4 divide-y divide-neutral-100">
        {lineItems.map((it) => {
          const label = it.product.hasVariants
            ? variantLabel(it.variant)
            : null;
          const unit = priceForVariant(it.product, it.variant ?? null);
          return (
            <li
              key={cartLineKey(it)}
              className="flex items-center justify-between gap-2 py-2 text-sm"
            >
              <span className="truncate">
                {it.product.name}
                {label ? (
                  <span className="text-neutral-500"> · {label}</span>
                ) : null}{" "}
                <span className="text-neutral-400">× {it.quantity}</span>
              </span>
              <span className="font-semibold">
                {formatPrice(unit * it.quantity)}
              </span>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 space-y-1 border-t border-neutral-200 pt-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-neutral-600">Medzisúčet</span>
          <span className="font-semibold">{formatPrice(subtotal)}</span>
        </div>
        {promoDiscount > 0 && appliedCode && (
          <div className="flex items-center justify-between text-green-700">
            <span>Zľava ({appliedCode})</span>
            <span className="font-semibold">−{formatPrice(promoDiscount)}</span>
          </div>
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
    </>
  );
}
