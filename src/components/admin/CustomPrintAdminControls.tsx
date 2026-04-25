"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CUSTOM_PRINT_STATUS_OPTIONS } from "./CustomPrintStatusBadge";

export function CustomPrintAdminControls({
  requestId,
  status,
  adminNote,
  quotedPriceEuros,
}: {
  requestId: string;
  status: string;
  adminNote: string;
  quotedPriceEuros: number | null;
}) {
  const router = useRouter();
  const [s, setS] = useState(status);
  const [note, setNote] = useState(adminNote);
  const [price, setPrice] = useState<string>(
    quotedPriceEuros != null ? quotedPriceEuros.toFixed(2) : ""
  );
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    const body: Record<string, unknown> = { status: s, adminNote: note };
    if (price.trim() === "") {
      body.quotedPriceCents = null;
    } else {
      const cents = Math.round(Number(price) * 100);
      if (!Number.isFinite(cents) || cents < 0) {
        setError("Neplatná cena.");
        setSaving(false);
        return;
      }
      body.quotedPriceCents = cents;
    }
    const res = await fetch(`/api/admin/custom-print/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Nepodarilo sa uložiť.");
      return;
    }
    setSavedAt(Date.now());
    router.refresh();
  }

  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200 space-y-4">
      <h2 className="text-base font-semibold">Spracovanie</h2>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-neutral-700">Stav</span>
        <select
          value={s}
          onChange={(e) => setS(e.target.value)}
          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        >
          {CUSTOM_PRINT_STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-neutral-700">
          Cenová ponuka (€)
        </span>
        <input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          type="number"
          step="0.01"
          min="0"
          placeholder="napr. 49.90"
          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-neutral-700">
          Interná poznámka
        </span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        />
      </label>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {saving ? "Ukladám…" : "Uložiť"}
        </button>
        {savedAt && (
          <span className="text-xs text-green-600">Uložené ✓</span>
        )}
      </div>
    </div>
  );
}
