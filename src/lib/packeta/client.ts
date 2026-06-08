/**
 * Packeta REST/XML API klient.
 * Docs: https://docs.packeta.com/docs/api-reference/api-methods
 *
 * Prevzaté a prispôsobené z newera_sisikovacsova projektu.
 */

const TIMEOUT_MS = 15_000;

// ---------------------------------------------------------------------------
// Konfigurácia
// ---------------------------------------------------------------------------

export interface PacketaConfig {
  apiPassword: string;
  apiUrl: string;
  eshop: string;
  defaultWeightKg: number;
  defaultCurrency: string;
  labelFormat: string;
}

export type PacketaConfigResult =
  | { configured: true; config: PacketaConfig }
  | { configured: false; missing: string[]; message: string };

const REQUIRED_VARS = ["PACKETA_API_PASSWORD", "PACKETA_ESHOP"] as const;

export function getPacketaConfig(): PacketaConfigResult {
  const missing: string[] = [];
  for (const key of REQUIRED_VARS) {
    if (!process.env[key]?.trim()) missing.push(key);
  }
  if (missing.length > 0) {
    return {
      configured: false,
      missing,
      message: `Packeta nie je nakonfigurovaná. Chýba: ${missing.join(", ")}`,
    };
  }
  return {
    configured: true,
    config: {
      apiPassword: process.env.PACKETA_API_PASSWORD!.trim(),
      apiUrl: process.env.PACKETA_API_URL?.trim() || "https://www.zasilkovna.cz/api/rest",
      eshop: process.env.PACKETA_ESHOP!.trim(),
      defaultWeightKg: parseFloat(process.env.PACKETA_DEFAULT_WEIGHT_KG || "0.5"),
      defaultCurrency: process.env.PACKETA_DEFAULT_CURRENCY?.trim() || "EUR",
      labelFormat: process.env.PACKETA_LABEL_FORMAT?.trim() || "A6 on A6",
    },
  };
}

function requireConfig(): PacketaConfig {
  const result = getPacketaConfig();
  if (!result.configured) throw new Error(result.message);
  return result.config;
}

// ---------------------------------------------------------------------------
// Pomocné funkcie
// ---------------------------------------------------------------------------

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function extractTag(xml: string, tag: string): string | null {
  const re = new RegExp(`<${tag}>[\\s\\S]*?</${tag}>`);
  const m = xml.match(re);
  if (!m) return null;
  return m[0].replace(`<${tag}>`, "").replace(`</${tag}>`, "").trim();
}

function stripXmlTags(s: string): string {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function extractPacketaFault(xml: string): string | null {
  const faultString = extractTag(xml, "faultString");
  if (faultString && !faultString.includes("<")) return stripXmlTags(faultString);

  const message = extractTag(xml, "message");
  if (message && !message.includes("<")) return stripXmlTags(message);

  // Packeta sometimes nests <fault> inside <fault> — take the innermost leaf message.
  const faultMatches = [...xml.matchAll(/<fault>([\s\S]*?)<\/fault>/g)];
  for (let i = faultMatches.length - 1; i >= 0; i--) {
    const inner = faultMatches[i][1].trim();
    if (!inner.includes("<fault>")) {
      const text = stripXmlTags(inner);
      if (text) return text;
    }
  }

  const detail = extractTag(xml, "detail");
  if (detail) return stripXmlTags(detail);

  return null;
}

// ---------------------------------------------------------------------------
// Rozdelenie mena na firstName / lastName
// ---------------------------------------------------------------------------

export function splitCustomerName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: "." };
  const lastName = parts.pop()!;
  const firstName = parts.join(" ");
  return { firstName, lastName };
}

// ---------------------------------------------------------------------------
// createPacket — vytvorí zásielku v Packeta
// ---------------------------------------------------------------------------

export interface CreatePacketInput {
  orderNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  /** ID výdajného miesta (packetaPointId) */
  addressId: string;
  /** Hodnota zásielky v EUR */
  value: number;
  weightKg: number;
  currency: string;
}

export interface CreatePacketResult {
  packetId: string;
  barcode: string;
}

export async function createPacket(input: CreatePacketInput): Promise<CreatePacketResult> {
  const cfg = requireConfig();

  const xml = [
    "<createPacket>",
    `  <apiPassword>${escapeXml(cfg.apiPassword)}</apiPassword>`,
    "  <packetAttributes>",
    `    <number>${escapeXml(input.orderNumber)}</number>`,
    `    <name>${escapeXml(input.firstName)}</name>`,
    `    <surname>${escapeXml(input.lastName)}</surname>`,
    `    <email>${escapeXml(input.email)}</email>`,
    `    <phone>${escapeXml(input.phone || "")}</phone>`,
    `    <addressId>${escapeXml(input.addressId)}</addressId>`,
    `    <value>${input.value.toFixed(2)}</value>`,
    `    <weight>${input.weightKg.toFixed(2)}</weight>`,
    `    <currency>${escapeXml(input.currency)}</currency>`,
    `    <eshop>${escapeXml(cfg.eshop)}</eshop>`,
    "  </packetAttributes>",
    "</createPacket>",
  ].join("\n");

  const response = await fetch(cfg.apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/xml" },
    body: xml,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  const text = await response.text();
  const status = extractTag(text, "status");

  if (status !== "ok") {
    const fault = extractPacketaFault(text);
    console.error("[packeta] createPacket failed:", fault, text.slice(0, 500));
    throw new Error(fault || `Packeta API error (status: ${status})`);
  }

  const result = extractTag(text, "result");
  if (!result) throw new Error("Packeta API: chýba <result> v odpovedi.");

  const packetId = extractTag(result, "id");
  if (!packetId) throw new Error("Packeta API: chýba packet ID v odpovedi.");

  return {
    packetId,
    barcode: extractTag(result, "barcode") || `Z${packetId}`,
  };
}

// ---------------------------------------------------------------------------
// getLabelPdf — stiahne PDF štítok z Packeta
// ---------------------------------------------------------------------------

export async function getLabelPdf(packetId: string, formatOverride?: string): Promise<Buffer> {
  const cfg = requireConfig();
  const format = formatOverride ?? cfg.labelFormat;

  const xml = [
    "<packetLabelPdf>",
    `  <apiPassword>${escapeXml(cfg.apiPassword)}</apiPassword>`,
    `  <packetId>${escapeXml(packetId)}</packetId>`,
    `  <format>${escapeXml(format)}</format>`,
    "  <offset>0</offset>",
    "</packetLabelPdf>",
  ].join("\n");

  const response = await fetch(cfg.apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/xml" },
    body: xml,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  const contentType = response.headers.get("content-type") || "";
  const looksLikeXml = contentType.includes("xml") || contentType.includes("text/html");

  if (looksLikeXml) {
    const text = await response.text();
    const status = extractTag(text, "status");

    if (status === "ok") {
      const result = extractTag(text, "result");
      if (!result) throw new Error("Packeta API: chýba <result> v packetLabelPdf odpovedi.");
      const b64 = result.replace(/\s+/g, "");
      const buf = Buffer.from(b64, "base64");
      if (buf.length < 5 || buf.subarray(0, 4).toString("ascii") !== "%PDF") {
        throw new Error("Packeta API: odpoveď nie je platný PDF.");
      }
      return buf;
    }

    const fault = extractPacketaFault(text);
    console.error("[packeta] getLabelPdf failed:", fault ?? "(no fault)", text.slice(0, 500));
    throw new Error(fault || "Packeta API: generovanie štítku zlyhalo.");
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
