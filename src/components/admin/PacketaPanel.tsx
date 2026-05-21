"use client";

import { useState } from "react";

interface PacketaPanelProps {
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  /** Či má objednávka zvolené výdajné miesto */
  hasPickupPoint: boolean;
  pickupPointName: string | null;
  pickupPointAddress: string | null;
  packetaConfigured: boolean;
  packetaPacketId: string | null;
  packetaTrackingNumber: string | null;
  packetaStatus: string | null;
  packetaError: string | null;
}

function trackingUrl(barcode: string): string {
  return `https://tracking.packeta.com/sk/tracking/search?id=${encodeURIComponent(barcode.replace(/\s/g, ""))}`;
}

export function PacketaPanel({
  orderId,
  orderNumber,
  orderStatus,
  hasPickupPoint,
  pickupPointName,
  pickupPointAddress,
  packetaConfigured,
  packetaPacketId,
  packetaTrackingNumber,
  packetaStatus,
  packetaError,
}: PacketaPanelProps) {
  const [loading, setLoading] = useState(false);
  const [localPacketId, setLocalPacketId] = useState(packetaPacketId);
  const [localTracking, setLocalTracking] = useState(packetaTrackingNumber);
  const [localStatus, setLocalStatus] = useState(packetaStatus);
  const [localError, setLocalError] = useState(packetaError);

  async function handleCreatePacket() {
    if (!confirm("Vytvoriť zásielku v Packeta?")) return;
    setLoading(true);
    setLocalError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/packeta/create`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setLocalError(data.error || "Chyba pri vytváraní zásielky.");
        return;
      }
      setLocalPacketId(data.packetaPacketId);
      setLocalTracking(data.packetaTrackingNumber);
      setLocalStatus("created");
    } catch {
      setLocalError("Nepodarilo sa spojiť so serverom.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadLabel() {
    setLoading(true);
    setLocalError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/packeta/label`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setLocalError(data.error || "Chyba pri generovaní štítku.");
        return;
      }

      // Spustí stiahnutie PDF
      const blob = await res.blob();
      const cd = res.headers.get("Content-Disposition");
      let filename = `packeta-${orderNumber}.pdf`;
      const quoted = cd?.match(/filename="([^"]+)"/);
      const plain = cd?.match(/filename=([^;\s]+)/);
      if (quoted?.[1]) filename = quoted[1];
      else if (plain?.[1]) filename = plain[1].replace(/^"|"$/g, "");

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setLocalStatus("label_ready");
    } catch {
      setLocalError("Nepodarilo sa spojiť so serverom.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl bg-violet-50 p-5 ring-1 ring-violet-200">
      <h2 className="mb-1 text-base font-semibold text-violet-900">Packeta</h2>

      {/* Konfigurácia chýba */}
      {!packetaConfigured && (
        <div className="mb-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 ring-1 ring-amber-200">
          Packeta nie je nakonfigurovaná. Skontroluj{" "}
          <code className="font-mono">PACKETA_API_PASSWORD</code> a{" "}
          <code className="font-mono">PACKETA_ESHOP</code> v .env.
        </div>
      )}

      {/* Výdajné miesto */}
      <div className="mb-3 space-y-1 text-sm">
        <div className="flex gap-2">
          <span className="w-24 flex-shrink-0 text-neutral-500">Miesto</span>
          <span className="font-medium">{pickupPointName ?? "—"}</span>
        </div>
        {pickupPointAddress && (
          <div className="flex gap-2">
            <span className="w-24 flex-shrink-0 text-neutral-500">Adresa</span>
            <span>{pickupPointAddress}</span>
          </div>
        )}
      </div>

      {/* Stav zásielky */}
      {localPacketId && (
        <div className="mb-3 space-y-1 text-sm">
          <div className="flex gap-2">
            <span className="w-24 flex-shrink-0 text-neutral-500">Packet ID</span>
            <span className="font-mono text-xs">{localPacketId}</span>
          </div>
          {localTracking && (
            <div className="flex gap-2">
              <span className="w-24 flex-shrink-0 text-neutral-500">Tracking</span>
              <span className="font-mono text-xs">{localTracking}</span>
            </div>
          )}
          <div className="flex gap-2">
            <span className="w-24 flex-shrink-0 text-neutral-500">Stav</span>
            <span
              className={`text-xs font-medium ${
                localStatus === "label_ready"
                  ? "text-green-700"
                  : localStatus === "error"
                    ? "text-red-700"
                    : "text-blue-700"
              }`}
            >
              {localStatus === "created" && "Zásielka vytvorená"}
              {localStatus === "label_ready" && "Štítok pripravený ✓"}
              {localStatus === "error" && "Chyba"}
              {!localStatus && "—"}
            </span>
          </div>
        </div>
      )}

      {/* Chybová správa */}
      {localError && (
        <div className="mb-3 rounded-lg bg-red-50 p-2 text-xs text-red-700 ring-1 ring-red-200">
          {localError}
        </div>
      )}

      {/* Akcie */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Vytvoriť zásielku */}
        {!localPacketId && orderStatus === "PAID" && (
          <button
            onClick={handleCreatePacket}
            disabled={loading || !packetaConfigured || !hasPickupPoint}
            title={!hasPickupPoint ? "Objednávka nemá výdajné miesto" : undefined}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Spracovávam…" : "Vytvoriť zásielku"}
          </button>
        )}

        {!localPacketId && orderStatus !== "PAID" && (
          <p className="text-xs text-neutral-500">
            Najprv označ objednávku ako <strong>PAID</strong>.
          </p>
        )}

        {/* Stiahnuť štítok */}
        {localPacketId && (
          <button
            onClick={handleDownloadLabel}
            disabled={loading || !packetaConfigured}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Sťahujem…"
              : localStatus === "label_ready"
                ? "Stiahnuť štítok (PDF)"
                : "Vygenerovať štítok (PDF)"}
          </button>
        )}

        {/* Tracking link */}
        {localTracking && (
          <a
            href={trackingUrl(localTracking)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-violet-700 underline underline-offset-2 hover:text-violet-900"
          >
            Sledovať zásielku →
          </a>
        )}
      </div>
    </div>
  );
}
