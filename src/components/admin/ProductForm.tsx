"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";

const CATEGORIES = [
  { value: "PRAKTICKE", label: "Praktické" },
  { value: "DEKORATIVNE", label: "Dekoratívne" },
  { value: "HRACKY", label: "Hračky" },
  { value: "DOPLNKY", label: "Doplnky" },
  { value: "INE", label: "Iné" },
] as const;

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
};

type Props =
  | { mode: "create"; product?: undefined }
  | { mode: "edit"; product: ProductInput };

export function ProductForm(props: Props) {
  const router = useRouter();
  const isEdit = props.mode === "edit";
  const initial = isEdit ? props.product : undefined;

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [featuredHome, setFeaturedHome] = useState(
    initial?.isFeaturedHome ?? false
  );
  const [homeSortSlot, setHomeSortSlot] = useState(nearestHomeOrderPreset(initial?.homeSortOrder));

  const homeHintId = useId();

  // For "create" we let the user pick initial images here;
  // on "edit" images are managed by the separate ProductImagesManager.
  const [files, setFiles] = useState<File[]>([]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    // priceEuros -> priceCents
    const priceEuros = Number(formData.get("priceEuros") ?? 0);
    formData.delete("priceEuros");
    formData.set("priceCents", String(Math.round(priceEuros * 100)));

    // append picked files
    if (!isEdit) {
      for (const f of files) formData.append("images", f);
    }

    // booleans (checkbox values are present only when checked)
    for (const key of ["isActive", "isFeaturedHome", "isHitOfWeek"]) {
      formData.set(key, formData.get(key) === "on" ? "true" : "false");
    }

    const url = isEdit
      ? `/api/admin/products/${initial!.id}`
      : "/api/admin/products";
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, { method, body: formData });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data.error ?? "Nepodarilo sa uložiť produkt.");
      setSubmitting(false);
      return;
    }

    router.push(`/admin/produkty/${data.id ?? initial!.id}`);
    router.refresh();
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
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
              className="block w-full text-sm text-neutral-700 file:mr-3 file:rounded-full file:border-0 file:bg-brand file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-dark"
            />
            {files.length > 0 && (
              <p className="mt-2 text-xs text-neutral-500">
                Vybraté: {files.map((f) => f.name).join(", ")}
              </p>
            )}
            <p className="mt-2 text-xs text-neutral-400">
              Prvý obrázok bude hlavný. Po vytvorení produktu môžeš pridávať a
              meniť obrázky kedykoľvek.
            </p>
          </Card>
        )}
      </div>

      <div className="space-y-4">
        <Card title="Cena & sklad">
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
            defaultValue={initial?.category ?? "INE"}
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          >
            {CATEGORIES.map((c) => (
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
            ? "Ukladám…"
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
