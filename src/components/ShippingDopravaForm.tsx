"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getCart, removeStaleCartItems } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import {
  SHIPPING_METHODS,
  getShippingMethodById,
} from "@/lib/shippingMethods";
import {
  getShippingMethodId,
  setShippingMethodId,
} from "@/lib/shippingSelection";
import {
  getPacketaPoint,
  setPacketaPoint,
  clearPacketaPoint,
  type PacketaPoint,
} from "@/lib/packeta-selection";

// ---------------------------------------------------------------------------
// Typy
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPoint = Record<string, any>;

declare global {
  interface Window {
    Packeta?: {
      Widget: {
        // Správne poradie: pick(apiKey, callback, opts, inElement?)
        pick: (
          apiKey: string,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          callback: (point: any) => void,
          opts: Record<string, unknown>,
          inElement?: HTMLElement | null
        ) => void;
      };
    };
  }
}

const PACKETA_WIDGET_URL = "https://widget.packeta.com/v6/www/js/library.js";
const PACKETA_API_KEY =
  process.env.NEXT_PUBLIC_PACKETA_API_KEY ?? "b584c396e3f18916";

// ---------------------------------------------------------------------------
// Načítanie skriptu
// ---------------------------------------------------------------------------

function loadPacketaScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Packeta?.Widget?.pick) { resolve(); return; }
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${PACKETA_WIDGET_URL}"]`
    );
    if (existing) {
      if (window.Packeta?.Widget?.pick) { resolve(); return; }
      existing.addEventListener("load", () => setTimeout(resolve, 50));
      existing.addEventListener("error", reject);
      return;
    }
    const script = document.createElement("script");
    script.src = PACKETA_WIDGET_URL;
    script.async = true;
    script.onload = () => setTimeout(resolve, 50);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// ---------------------------------------------------------------------------
// Komponent
// ---------------------------------------------------------------------------

export function ShippingDopravaForm() {
  const router = useRouter();
  const [cartEmpty, setCartEmpty] = useState<boolean | null>(null);
  const [methodId, setMethodId] = useState("");

  const [packetaPoint, setLocalPacketaPoint] = useState<PacketaPoint | null>(null);
  const [widgetLoading, setWidgetLoading] = useState(false);
  const [widgetError, setWidgetError] = useState<string | null>(null);

  // Stable ref — callback vždy vidí najnovší setState bez stale closure
  const onPointRef = useRef<(point: AnyPoint | null) => void>(() => {});

  onPointRef.current = (point: AnyPoint | null) => {
    if (!point) return; // widget zavretý bez výberu

    const streetPart = (point.street ?? point.place ?? "") as string;
    const cityPart = [point.zip, point.city].filter(Boolean).join(" ");
    const address = [streetPart, cityPart].filter(Boolean).join(", ");

    const name: string = (
      point.name ?? point.nameStreet ?? point.displayName ?? `Packeta bod ${point.id}`
    ) as string;

    const saved: PacketaPoint = {
      pointId: String(point.id ?? ""),
      pointName: name,
      pointAddress: address,
      isoCountry: ((point.country as string | undefined) ?? "SK").toUpperCase(),
    };

    setPacketaPoint(saved);
    setLocalPacketaPoint(saved);
  };

  // ---------------------------------------------------------------------------
  // Packeta point — inicializácia z sessionStorage + event listener
  // ---------------------------------------------------------------------------

  useEffect(() => {
    setLocalPacketaPoint(getPacketaPoint());
    const onChanged = () => setLocalPacketaPoint(getPacketaPoint());
    window.addEventListener("iknow3d:packeta-point-changed", onChanged);
    return () => window.removeEventListener("iknow3d:packeta-point-changed", onChanged);
  }, []);

  // ---------------------------------------------------------------------------
  // Shipping — sync zo sessionStorage
  // ---------------------------------------------------------------------------

  const syncShipping = useCallback(() => {
    const id = getShippingMethodId();
    setMethodId(id && getShippingMethodById(id) ? id : "");
  }, []);

  useEffect(() => {
    const items = getCart();
    if (items.length === 0) {
      setCartEmpty(true);
      syncShipping();
      return;
    }
    const ids = items.map((i) => i.productId);
    fetch(`/api/products/by-ids?ids=${ids.join(",")}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { products: { id: string }[] }) => {
        removeStaleCartItems(data.products.map((p) => p.id));
        setCartEmpty(getCart().length === 0);
        syncShipping();
      })
      .catch(() => { setCartEmpty(false); syncShipping(); });
  }, [syncShipping]);

  const selected = useMemo(
    () => (methodId ? getShippingMethodById(methodId) : undefined),
    [methodId]
  );

  function handleMethodChange(id: string) {
    setMethodId(id);
    if (id !== "packeta-pickup") {
      clearPacketaPoint();
      setLocalPacketaPoint(null);
    }
  }

  // ---------------------------------------------------------------------------
  // Otvorenie widgetu — popup overlay cez body (správne poradie parametrov!)
  // Packeta.Widget.pick(apiKey, callback, opts, inElement?)
  // ---------------------------------------------------------------------------

  async function openPacketaWidget() {
    setWidgetLoading(true);
    setWidgetError(null);

    try {
      await loadPacketaScript();
    } catch {
      setWidgetError("Nepodarilo sa načítať Packeta widget.");
      setWidgetLoading(false);
      return;
    }

    if (!window.Packeta?.Widget?.pick) {
      setWidgetError("Packeta widget nie je dostupný.");
      setWidgetLoading(false);
      return;
    }

    setWidgetLoading(false);

    // SPRÁVNE poradie: pick(apiKey, callback, opts)
    // — callback je 2. parameter, opts sú 3. parameter
    window.Packeta.Widget.pick(
      PACKETA_API_KEY,
      (point) => onPointRef.current(point),
      { country: "sk,cz", language: "sk" }
    );
  }

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  function continueToCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (!methodId || !selected) return;

    const confirmed = packetaPoint ?? getPacketaPoint();
    if (methodId === "packeta-pickup" && !confirmed) {
      setWidgetError("Najprv vyberte výdajné miesto.");
      return;
    }

    setShippingMethodId(methodId);
    router.push("/pokladna");
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (cartEmpty === null)
    return <p className="mt-6 text-sm text-neutral-500">Načítavam košík…</p>;

  if (cartEmpty)
    return (
      <div className="mt-6 rounded-2xl border-2 border-dashed border-neutral-200 bg-white p-10 text-center">
        <p className="text-neutral-600">Tvoj košík je prázdny.</p>
        <Link href="/produkty" className="mt-4 inline-block rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
          Pozrieť produkty
        </Link>
      </div>
    );

  const isPacketaPickup = methodId === "packeta-pickup";
  const confirmedPoint = packetaPoint ?? getPacketaPoint();

  return (
    <form onSubmit={continueToCheckout} className="mt-6 space-y-6">
      <fieldset className="space-y-3">
        <legend className="text-base font-semibold text-neutral-900">
          Spôsob dopravy
        </legend>
        {SHIPPING_METHODS.map((m) => (
          <label
            key={m.id}
            className={`flex cursor-pointer gap-3 rounded-2xl bg-white p-4 ring-1 transition hover:ring-brand/30 ${
              methodId === m.id ? "ring-2 ring-brand" : "ring-neutral-200"
            }`}
          >
            <input
              type="radio"
              name="shipping"
              value={m.id}
              checked={methodId === m.id}
              onChange={() => handleMethodChange(m.id)}
              className="mt-1"
            />
            <span className="min-w-0 flex-1">
              <span className="block font-medium text-neutral-900">{m.label}</span>
              <span className="mt-0.5 block text-sm text-neutral-500">{m.description}</span>
            </span>
            <span className="flex-shrink-0 font-semibold text-neutral-900">
              {formatPrice(m.feeCents)}
            </span>
          </label>
        ))}
      </fieldset>

      {/* Packeta sekcia */}
      {isPacketaPickup && (
        <div className="rounded-2xl bg-violet-50 p-5 ring-1 ring-violet-200">
          <h3 className="mb-3 text-sm font-semibold text-violet-900">
            Výber výdajného miesta
          </h3>

          {confirmedPoint ? (
            <div className="mb-3 rounded-lg bg-white p-3 ring-1 ring-green-200 text-sm">
              <p className="font-medium text-green-800">✓ {confirmedPoint.pointName}</p>
              {confirmedPoint.pointAddress && (
                <p className="mt-0.5 text-neutral-500">{confirmedPoint.pointAddress}</p>
              )}
            </div>
          ) : (
            <p className="mb-3 text-sm text-violet-700">
              Žiadne výdajné miesto nie je vybrané.
            </p>
          )}

          {widgetError && (
            <div className="mb-3 rounded-lg bg-red-50 p-2 text-xs text-red-700 ring-1 ring-red-200">
              {widgetError}
            </div>
          )}

          <button
            type="button"
            onClick={openPacketaWidget}
            disabled={widgetLoading}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {widgetLoading
              ? "Načítavam…"
              : confirmedPoint
              ? "Zmeniť výdajné miesto"
              : "Vybrať výdajné miesto"}
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Link
          href="/kosik"
          className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold text-neutral-700 ring-1 ring-neutral-200 hover:bg-neutral-50"
        >
          ← Späť do košíka
        </Link>
        <button
          type="submit"
          disabled={!methodId || (isPacketaPickup && !confirmedPoint)}
          className="inline-flex flex-1 items-center justify-center rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
        >
          Pokračovať k pokladni
        </button>
      </div>
    </form>
  );
}
