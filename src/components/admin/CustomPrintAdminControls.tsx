"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CUSTOM_PRINT_STATUS_OPTIONS } from "./CustomPrintStatusBadge";

export function CustomPrintAdminControls({
  requestId,
  requestNumber,
  customerEmail,
  status,
  adminNote,
  quotedPriceEuros,
}: {
  requestId: string;
  requestNumber: string;
  customerEmail: string;
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
  const [quoteEmailText, setQuoteEmailText] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [sendingQuote, setSendingQuote] = useState(false);
  const [quoteFeedback, setQuoteFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setS(status);
  }, [status]);

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

  async function sendQuoteEmail() {
    setQuoteFeedback(null);
    setError(null);
    if (!price.trim()) {
      setError("Pred odoslaním dolň cenu (€).");
      return;
    }
    const cents = Math.round(Number(price) * 100);
    if (!Number.isFinite(cents) || cents < 0) {
      setError("Neplatná cena.");
      return;
    }

    const okConfirm = window.confirm(
      `Odoslať cenový návrh ${(cents / 100).toFixed(2)} € na ${customerEmail}?\n\nPožiadavka: ${requestNumber}\nStav sa nastaví na „Cenová ponuka“ (QUOTED).`
    );
    if (!okConfirm) return;

    setSendingQuote(true);
    const res = await fetch(
      `/api/admin/custom-print/${requestId}/send-quote`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quotedPriceCents: cents,
          customerMessage: quoteEmailText.trim() || undefined,
        }),
      }
    );
    setSendingQuote(false);

    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      emailSent?: boolean;
      emailError?: string;
      resendEmailId?: string;
      error?: string;
    };

    if (!res.ok || !data.ok) {
      setError(data.error ?? "Nepodarilo sa spracovať odoslanie ponuky.");
      return;
    }

    setS("QUOTED");
    if (data.emailSent) {
      setQuoteFeedback(
        `Email s ponukou bol odoslaný na ${customerEmail}.${data.resendEmailId ? ` Resend: ${data.resendEmailId.slice(0, 14)}…` : ""}`
      );
    } else {
      setQuoteFeedback(
        `Údaje uložené, ale email neodišiel: ${data.emailError ?? "neznáma chyba"}. Skontroluj .env (Resend) alebo Logs v dashboarde.`
      );
    }
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

      <div className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-neutral-900">
          Cenový návrh emailom zákazníkovi
        </h3>
        <p className="text-xs text-neutral-600">
          Použije sa vyššie zadaná cena. Voliteľný text sa vloží do mailu ako tvoja správa.
          Stav požiadavky sa nastaví na „Cenová ponuka“. Ak potrebuješ len zapísať cenu bez
          mailu, použi „Uložiť“.
        </p>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-neutral-700">
            Text pre zákazníka v emaily (voliteľné)
          </span>
          <textarea
            value={quoteEmailText}
            onChange={(e) => setQuoteEmailText(e.target.value)}
            rows={5}
            maxLength={6000}
            placeholder="napr. Odporúčam PLA filament, výška vrstvy 0,2 mm, odhad dodania 5 pracovných dní..."
            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
          <span className="mt-1 block text-xs text-neutral-400">
            {(quoteEmailText ?? "").length} / 6000
          </span>
        </label>
        <button
          type="button"
          onClick={sendQuoteEmail}
          disabled={sendingQuote || saving}
          className="rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          {sendingQuote ? "Odosielam…" : `Odoslať cenový návrh na ${customerEmail}`}
        </button>
      </div>

      {quoteFeedback && (
        <div
          className={`rounded-lg p-3 text-sm ring-1 ${
            quoteFeedback.includes("neodišiel")
              ? "bg-amber-50 text-amber-900 ring-amber-200"
              : "bg-green-50 text-green-900 ring-green-200"
          }`}
        >
          {quoteFeedback}
        </div>
      )}
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
