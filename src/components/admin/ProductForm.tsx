"use client";

import { compressImagesForUpload, UPLOAD_MAX_EDGE_PX } from "@/lib/compressImagesForUpload";
import {
  DEFAULT_PRODUCT_CATEGORY,
  PRODUCT_CATEGORIES,
} from "@/lib/productCategories";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";

/** Homepage grid order presets (stored as `homeSortOrder`; nižší = vyšší v zozname pri zoradení podľa vlastného poradia). */
const HOME_ORDER_SLOTS = [
  { value: 0, label: "Úplný začiatok — medzi prvými" },
  { value: 100, label: "Blízko začiatku" },
  { value: 500, label: "Stred zoznamu (odporúčané)" },
  { value: 2500, label: "Niečo vzadu v zozname" },
  { value: 10000, label: "Na samý koniec" },
] as const;

/** Pick closest preset so edit form má zmysluplný default po starých hodnotách */
function nearestHomeOrderPreset(stored: number | undefined): string {
  const n = typeof stored === "number" && Number.isFinite(stored) ? stored : 500;
  let best = HOME_ORDER_SLOTS[0]!.value.toString();
  let bestDelta = Infinity;
  for (const slot of HOME_ORDER_SLOTS) {
    const d = Math.abs(n - slot.value);
    if (d < bestDelta) {
      bestDelta = d;
      best = String(slot.value);
    }
  }
  return best;
}

type ProductInput = {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  priceCents: number;
  stock: number;
  category: string;
  isActive: boolean;
  isFeaturedHome: boolean;
  isHitOfWeek: boolean;
  homeSortOrder: number;
  hasVariants: boolean;
  figurkaPriceCents: number | null;
  klucenkaPriceCents: number | null;
};

type Props =
  | { mode: "create"; product?: undefined }
  | { mode: "edit"; product: ProductInput };

export function ProductForm(props: Props) {
  const router = useRouter();
  const isEdit = props.mode === "edit";
  const initial = isEdit ? props.product : undefined;

  const [submitting, setSubmitting] = useState(false);
  const [uploadPhase, setUploadPhase] = useState<
    "compress" | "product" | "images" | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  const [featuredHome, setFeaturedHome] = useState(
    initial?.isFeaturedHome ?? false
  );
  const [hasVariants, setHasVariants] = useState(initial?.hasVariants ?? false);
  const [homeSortSlot, setHomeSortSlot] = useState(nearestHomeOrderPreset(initial?.homeSortOrder));

  const homeHintId = useId();

  // For "create" we let the user pick initial images here;
  // on "edit" images are managed by the separate ProductImagesManager.
  const [imageList, setImageList] = useState<string[]>([]);

  /** Hosting (napr. Vercel) má typicky ~4,5 MB limit na jeden HTTP request — jedna väčšia fotka z mobilu tým pádom neprejde. */
  const HOSTING_MAX_BYTES = 4.5 * 1024 * 1024;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    setUploadPhase(null);

    const formEl = e.currentTarget;
    const imageInput = formEl.querySelector<HTMLInputElement>('input[name="images"]');
    const imageFiles =
      !isEdit && imageInput?.files?.length
        ? Array.from(imageInput.files)
        : [];

    let preparedImageFiles: File[] = [];
    if (!isEdit && imageFiles.length > 0) {
      setUploadPhase("compress");
      try {
        preparedImageFiles = await compressImagesForUpload(imageFiles);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Optimalizácia obrázkov zlyhala.");
        setSubmitting(false);
        setUploadPhase(null);
        return;
      }
      for (const f of preparedImageFiles) {
        if (f.size > HOSTING_MAX_BYTES) {
          setError(
            `Po optimalizácii je „${f.name}“ stále väčší ako ~4,5 MB. Skús iný súbor alebo manuálne zmenšiť rozmer.`
          );
          setSubmitting(false);
          setUploadPhase(null);
          return;
        }
      }
    }

    setUploadPhase("product");

    const formData = new FormData(formEl);

    // Varianty (figúrka / kľúčenka) alebo jedna cena
    formData.set("hasVariants", hasVariants ? "true" : "false");
    if (hasVariants) {
      const figEuros = Number(formData.get("figurkaEuros") ?? 0);
      const klucEuros = Number(formData.get("klucenkaEuros") ?? 0);
      formData.delete("figurkaEuros");
      formData.delete("klucenkaEuros");
      if (!(figEuros > 0) || !(klucEuros > 0)) {
        setError("Pri variantoch zadaj cenu pre figúrku aj kľúčenku.");
        setSubmitting(false);
        setUploadPhase(null);
        return;
      }
      const figCents = Math.round(figEuros * 100);
      const klucCents = Math.round(klucEuros * 100);
      formData.set("figurkaPriceCents", String(figCents));
      formData.set("klucenkaPriceCents", String(klucCents));
      // základná („od") cena = minimum z variantov
      formData.set("priceCents", String(Math.min(figCents, klucCents)));
    } else {
      const priceEuros = Number(formData.get("priceEuros") ?? 0);
      formData.set("priceCents", String(Math.round(priceEuros * 100)));
    }
    formData.delete("priceEuros");

    // Pri vytváraní posielame obrázky samostatnými requestami (celkový objem viacerých MB v jednom POST by na Verceli zlyhal).
    while (formData.has("images")) {
      formData.delete("images");
    }

    // booleans (checkbox values are present only when checked)
    for (const key of ["isActive", "isFeaturedHome", "isHitOfWeek"]) {
      formData.set(key, formData.get(key) === "on" ? "true" : "false");
    }

    const url = isEdit
      ? `/api/admin/products/${initial!.id}`
      : "/api/admin/products";
    const method = isEdit ? "PATCH" : "POST";

    try {
      const res = await fetch(url, { method, body: formData });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? "Nepodarilo sa uložiť produkt.");
        return;
      }

      const productId = data.id ?? initial!.id;

      if (!isEdit && preparedImageFiles.length > 0) {
        setUploadPhase("images");
        for (let i = 0; i < preparedImageFiles.length; i++) {
          const fd = new FormData();
          fd.append("images", preparedImageFiles[i]!);
          const imgRes = await fetch(`/api/admin/products/${productId}/images`, {
            method: "POST",
            body: fd,
          });
          if (!imgRes.ok) {
            const err = await imgRes.json().catch(() => ({}));
            setError(
              typeof err.error === "string"
                ? `${err.error} (produkt už existuje — môžeš doplniť obrázky v úprave.)`
                : `Produkt bol vytvorený, ale obrázok ${i + 1}/${preparedImageFiles.length} sa nepodarilo nahrať. Skús ho pridať v úprave produktu.`
            );
            router.push(`/admin/produkty/${productId}`);
            router.refresh();
            return;
          }
        }
      }

      router.push(`/admin/produkty/${productId}`);
      router.refresh();
    } catch {
      setError("Nepodarilo sa odoslať formulár (sieť alebo server). Skús znova.");
    } finally {
      setSubmitting(false);
      setUploadPhase(null);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      encType="multipart/form-data"
      className="grid gap-6 lg:grid-cols-3"
    >
      <div className="space-y-4 lg:col-span-2">
        <Card title="Základné informácie">
          <Field
            name="name"
            label="Názov"
            required
            defaultValue={initial?.name}
          />
          <Field
            name="slug"
            label="Slug (URL)"
            placeholder="napr. wall-hook (necháte prázdne na automatické vygenerovanie)"
            defaultValue={initial?.slug}
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              Krátky popis
            </label>
            <textarea
              name="shortDescription"
              rows={2}
              defaultValue={initial?.shortDescription ?? ""}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              Popis <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              required
              rows={6}
              defaultValue={initial?.description}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>
        </Card>

        {!isEdit && (
          <Card title="Obrázky">
            <input
              name="images"
              type="file"
              multiple
              accept="image/*,.heic,.heif"
              onChange={(e) => {
                const list = e.target.files;
                setImageList(
                  list ? Array.from(list, (f) => f.name) : []
                );
              }}
              className="block w-full text-sm text-neutral-700 file:mr-3 file:rounded-full file:border-0 file:bg-brand file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-dark"
            />
            {imageList.length > 0 ? (
              <ol className="mt-3 list-decimal space-y-0.5 pl-5 text-xs text-neutral-600">
                {imageList.map((name, i) => (
                  <li key={`${i}-${name}`}>{name}</li>
                ))}
              </ol>
            ) : (
              <p className="mt-2 text-xs text-neutral-400">
                Zatiaľ žiadne súbory — voliteľné pri vytváraní, môžeš aj neskôr.
              </p>
            )}
            <p className="mt-2 text-xs text-neutral-500">
              <strong>Viaceré fotky:</strong> pri výbere podrž{" "}
              <kbd className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-[10px]">
                Ctrl
              </kbd>{" "}
              (Windows) alebo{" "}
              <kbd className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-[10px]">
                Cmd
              </kbd>{" "}
              (Mac) a klikni na jednotlivé súbory. Prvý v zozname = hlavný
              obrázok. Pred odoslaním sa v prehliadači automaticky zmenšia na max.{" "}
              {UPLOAD_MAX_EDGE_PX}
              px a WebP/JPEG, aby nahrávanie na hosting prešlo. Surové 40+ MP fotky
              sú zbytočné na e-shop.
            </p>
          </Card>
        )}
      </div>

      <div className="space-y-4">
        <Card title="Cena & sklad">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-200 bg-neutral-50/70 p-3 text-sm">
            <input
              type="checkbox"
              checked={hasVariants}
              onChange={(e) => setHasVariants(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[var(--brand)]"
            />
            <span>
              <span className="block font-medium text-neutral-800">
                Ponúkať varianty (figúrka / kľúčenka)
              </span>
              <span className="block text-xs text-neutral-500">
                Zákazník si pri tomto produkte zvolí prevedenie a každé môže mať
                inú cenu.
              </span>
            </span>
          </label>

          {hasVariants ? (
            <div className="grid grid-cols-2 gap-3">
              <Field
                name="figurkaEuros"
                label="Cena figúrky (€)"
                type="number"
                step="0.01"
                min="0"
                required
                defaultValue={
                  initial?.figurkaPriceCents != null
                    ? (initial.figurkaPriceCents / 100).toFixed(2)
                    : undefined
                }
              />
              <Field
                name="klucenkaEuros"
                label="Cena kľúčenky (€)"
                type="number"
                step="0.01"
                min="0"
                required
                defaultValue={
                  initial?.klucenkaPriceCents != null
                    ? (initial.klucenkaPriceCents / 100).toFixed(2)
                    : undefined
                }
              />
            </div>
          ) : (
            <Field
              name="priceEuros"
              label="Cena (€)"
              type="number"
              step="0.01"
              min="0"
              required
              defaultValue={
                initial ? (initial.priceCents / 100).toFixed(2) : undefined
              }
            />
          )}
          <Field
            name="stock"
            label="Sklad (ks)"
            type="number"
            step="1"
            min="0"
            required
            defaultValue={initial?.stock ?? 0}
          />
        </Card>

        <Card title="Kategória">
          <select
            name="category"
            defaultValue={initial?.category ?? DEFAULT_PRODUCT_CATEGORY}
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          >
            {PRODUCT_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </Card>

        <Card title="Zobrazenie">
          <Toggle
            name="isActive"
            label="Aktívny (viditeľný v e-shope)"
            defaultChecked={initial?.isActive ?? true}
          />
          <label className="flex cursor-pointer items-center gap-3 text-sm">
            <input
              name="isFeaturedHome"
              type="checkbox"
              checked={featuredHome}
              onChange={(e) => setFeaturedHome(e.target.checked)}
              className="h-4 w-4 accent-[var(--brand)]"
            />
            <span className="text-neutral-700">Zobraziť na hlavnej stránke</span>
          </label>
          <Toggle
            name="isHitOfWeek"
            label="Hit týždňa (banner)"
            defaultChecked={initial?.isHitOfWeek ?? false}
          />

          <div
            className={`space-y-1.5 rounded-xl border px-3 py-3 transition ${
              featuredHome
                ? "border-brand/25 bg-brand/5"
                : "border-transparent bg-neutral-50/90 text-neutral-500"
            }`}
          >
            <label className={`block text-sm ${!featuredHome ? "opacity-75" : ""}`}>
              <span className="mb-1 block font-medium text-neutral-700">
                Kde v zozname na úvodke?
              </span>
              <input type="hidden" name="homeSortOrder" value={homeSortSlot} />
              <select
                value={homeSortSlot}
                onChange={(e) => setHomeSortSlot(e.target.value)}
                disabled={!featuredHome}
                aria-describedby={homeHintId}
                className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                {HOME_ORDER_SLOTS.map((s) => (
                  <option key={s.value} value={String(s.value)}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <p id={homeHintId} className="text-xs leading-relaxed text-neutral-500">
              {featuredHome
                ? "Produkty s nižšou voľbou sa zvyčajne zobrazia vyššie v mriežke úvodnej stránky (záleží aj od zvoleného „Zoradiť podľa“ nad produktami)."
                : "Zapni „Na hlavnej stránke“ — potom nastav jednoduchú pozíciu v zozname."}
            </p>
          </div>
        </Card>

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-brand py-3 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {submitting
            ? uploadPhase === "compress"
              ? "Optimalizujem fotky…"
              : uploadPhase === "images"
                ? "Nahrávam fotky…"
                : "Ukladám…"
            : isEdit
              ? "Uložiť zmeny"
              : "Vytvoriť produkt"}
        </button>
      </div>
    </form>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200">
      <h2 className="mb-4 text-base font-semibold text-neutral-900">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({
  name,
  label,
  type = "text",
  required,
  placeholder,
  defaultValue,
  step,
  min,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string | number;
  step?: string;
  min?: string;
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
        placeholder={placeholder}
        defaultValue={defaultValue}
        step={step}
        min={min}
        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
      />
    </label>
  );
}

function Toggle({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm">
      <input
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        className="h-4 w-4 accent-[var(--brand)]"
      />
      <span className="text-neutral-700">{label}</span>
    </label>
  );
}
