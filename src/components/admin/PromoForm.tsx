"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { dateToDatetimeLocalValue } from "@/lib/datetimeLocal";

export type PromoFormInitial = {
  code: string;
  note: string | null;
  discountType: "PERCENT" | "FIXED";
  percentOff: number | null;
  amountOffCents: number | null;
  startsAtLocal: string;
  endsAtLocal: string;
  isActive: boolean;
  minOrderCents: number | null;
};

type Props =
  | { mode: "create" }
  | { mode: "edit"; promoId: string; initial: PromoFormInitial };

export function PromoForm(props: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const isEdit = props.mode === "edit";

  const [discountType, setDiscountType] = useState<"PERCENT" | "FIXED">(
    isEdit ? props.initial.discountType : "PERCENT"
  );

  const defaults = useMemo(() => {
    if (props.mode === "create") {
      return {
        code: "",
        note: "",
        percentDefault: 10,
        eurosDefault: "",
        minOrderEurosDefault: "",
        startsAt: dateToDatetimeLocalValue(new Date()),
        endsAt: "",
        isActive: true,
      };
    }
    const i = props.initial;
    return {
      code: i.code,
      note: i.note ?? "",
      percentDefault: i.percentOff ?? 10,
      eurosDefault:
        i.amountOffCents != null ? (i.amountOffCents / 100).toFixed(2) : "",
      minOrderEurosDefault:
        i.minOrderCents != null && i.minOrderCents > 0
          ? (i.minOrderCents / 100).toFixed(2)
          : "",
      startsAt: i.startsAtLocal,
      endsAt: i.endsAtLocal,
      isActive: i.isActive,
    };
  }, [props]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const code = String(fd.get("code") ?? "").trim();
    const note = String(fd.get("note") ?? "").trim();
    const percentRaw = String(fd.get("percentOff") ?? "").trim();
    const eurosRaw = String(fd.get("amountEuros") ?? "")
      .trim()
      .replace(",", ".");
    const startsAtLocal = String(fd.get("startsAt") ?? "").trim();
    const endsAtRaw = String(fd.get("endsAt") ?? "").trim();
    const isActive = fd.get("isActive") === "on";
    const minOrderEurosRaw = String(fd.get("minOrderEuros") ?? "")
      .trim()
      .replace(",", ".");

    let percentOff: number | null = null;
    let amountOffCents: number | null = null;

    if (discountType === "PERCENT") {
      const p = Number(percentRaw);
      if (!Number.isFinite(p) || p < 1 || p > 100) {
        setError("Percentá musia byť medzi 1 a 100.");
        return;
      }
      percentOff = Math.floor(p);
    } else {
      const euros = Number(eurosRaw);
      if (!Number.isFinite(euros) || euros <= 0) {
        setError("Zadaj platnú sumu zľavy v €.");
        return;
      }
      amountOffCents = Math.round(euros * 100);
    }

    let minOrderCents: number | null = null;
    if (minOrderEurosRaw !== "") {
      const me = Number(minOrderEurosRaw);
      if (!Number.isFinite(me) || me < 0) {
        setError("Minimálna objednávka musí byť nezáporné číslo (€).");
        return;
      }
      if (me > 0) {
        minOrderCents = Math.round(me * 100);
      }
    }
    if (!startsAtLocal) {
      setError("Vyplň začiatok platnosti.");
      return;
    }

    const payload = {
      code,
      note,
      discountType,
      percentOff,
      amountOffCents,
      startsAt: startsAtLocal,
      endsAt: endsAtRaw === "" ? null : endsAtRaw,
      isActive,
      minOrderCents,
    };

    setSubmitting(true);
    try {
      const url =
        isEdit ? `/api/admin/promo/${props.promoId}` : "/api/admin/promo";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(
          data.error ??
            (isEdit ? "Nepodarilo sa uložiť zmeny." : "Nepodarilo sa vytvoriť kód.")
        );
        setSubmitting(false);
        return;
      }
      router.push("/admin/promo");
      router.refresh();
    } catch {
      setError("Chyba siete.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-lg space-y-5">
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-neutral-700">
          Kód kupónu <span className="text-red-500">*</span>
        </span>
        <input
          name="code"
          required
          minLength={2}
          maxLength={40}
          defaultValue={defaults.code}
          className="w-full rounded-lg border border-neutral-200 px-3 py-2 uppercase placeholder:normal-case placeholder:text-neutral-400"
          placeholder="LETO2026"
        />
        <span className="mt-1 block text-xs text-neutral-500">
          Uloží sa veľkými písmenami.
        </span>
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-neutral-700">
          Poznámka (iba pre teba)
        </span>
        <input
          name="note"
          defaultValue={defaults.note}
          className="w-full rounded-lg border border-neutral-200 px-3 py-2"
          placeholder="Interný popis kampane…"
        />
      </label>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-neutral-700">Typ zľavy</legend>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="discountTypeUi"
            checked={discountType === "PERCENT"}
            onChange={() => setDiscountType("PERCENT")}
          />
          Percentuálna zľava
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="discountTypeUi"
            checked={discountType === "FIXED"}
            onChange={() => setDiscountType("FIXED")}
          />
          Pevná suma (€)
        </label>
      </fieldset>

      {discountType === "PERCENT" ? (
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-neutral-700">
            Zľava (%)
          </span>
          <input
            name="percentOff"
            type="number"
            min={1}
            max={100}
            step={1}
            defaultValue={defaults.percentDefault}
            required={discountType === "PERCENT"}
            className="w-full rounded-lg border border-neutral-200 px-3 py-2"
          />
        </label>
      ) : (
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-neutral-700">
            Zľava (€)
          </span>
          <input
            name="amountEuros"
            type="number"
            min={0.01}
            step={0.01}
            defaultValue={defaults.eurosDefault}
            placeholder="5,00"
            required={discountType === "FIXED"}
            className="w-full rounded-lg border border-neutral-200 px-3 py-2"
          />
        </label>
      )}

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-neutral-700">
          Minimálna hodnota objednávky (€)
        </span>
        <input
          name="minOrderEuros"
          type="number"
          min={0}
          step={0.01}
          placeholder="napr. 50 — voliteľné"
          defaultValue={defaults.minOrderEurosDefault}
          className="w-full rounded-lg border border-neutral-200 px-3 py-2"
        />
        <span className="mt-1 block text-xs text-neutral-500">
          Ak vyplníš (napr. 50), kupón pôjde použiť až od tejto hodnoty medzisúčtu v košíku
          (pred zľavou).
        </span>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-neutral-700">
            Platný od (čas Slovenska)
          </span>
          <input
            name="startsAt"
            type="datetime-local"
            defaultValue={defaults.startsAt}
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-neutral-700">
            Platný do (voliteľné, čas Slovenska)
          </span>
          <input
            name="endsAt"
            type="datetime-local"
            defaultValue={isEdit ? defaults.endsAt : ""}
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
          />
        </label>
      </div>

      <p className="text-xs leading-relaxed text-neutral-500">
        Zadávaj dátum a čas ako slovenský miestny čas (časové pásmo{" "}
        <span className="font-mono text-neutral-600">Europe/Bratislava</span>
        , automaticky zohľadní letný čas). Uložené sú presné okamihy pre košík aj
        na Verceli.
      </p>

      <label className="flex items-center gap-2 text-sm">
        <input
          name="isActive"
          type="checkbox"
          defaultChecked={defaults.isActive}
        />
        Kupón je aktívny
      </label>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
      >
        {submitting
          ? "Ukladám…"
          : isEdit
            ? "Uložiť zmeny"
            : "Vytvoriť kupón"}
      </button>
    </form>
  );
}
