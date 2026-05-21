/**
 * Odoslanie emailov cez Resend (https://resend.com).
 * Bez RESEND_API_KEY sa nič neposiela (lokálny vývoj) — žiadny pád aplikácie.
 */

import { Resend } from "resend";

import { formatPrice } from "@/lib/format";

function serializeResendError(error: unknown): string {
  if (error === null || error === undefined) return "Neznáma chyba Resend.";
  if (typeof error === "string") return error;
  if (typeof error === "object" && "message" in error) {
    const m = (error as { message: unknown }).message;
    if (typeof m === "string" && m) return m;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

export type EmailSendResult =
  | { ok: true; id?: string }
  | { ok: false; skipped: true; detail: string }
  | { ok: false; error: string };

/** Text chyby / preskočenie pre diagnostiku v API alebo konzole. */
export function emailResultMessage(r: EmailSendResult): string | null {
  if (r.ok) return null;
  if ("skipped" in r && r.skipped) return r.detail;
  if ("error" in r) return r.error;
  return null;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Verejná základná URL e-shopu (odkazy v emailoch). */
export function getPublicSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel && !vercel.startsWith("http"))
    return `https://${vercel.replace(/\/$/, "")}`;
  if (vercel) return vercel.replace(/\/$/, "");
  return "http://localhost:3000";
}

function getFromAddress(): string | null {
  const from = process.env.EMAIL_FROM?.trim();
  if (!from?.length) return null;
  if (
    /@resend\.dev\b/i.test(from) &&
    process.env.NODE_ENV === "development"
  ) {
    console.warn(
      "[email] EMAIL_FROM stále obsahuje @resend.dev — v .env použi vlastnú doménu (napr. know3d@know3d.sk) a reštartuj `npm run dev`."
    );
  }
  return from;
}

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  return new Resend(key);
}

export type OrderConfirmationEmailInput = {
  to: string;
  customerName: string;
  orderNumber: string;
  shippingLabel: string;
  lines: {
    productName: string;
    quantity: number;
    unitPriceCents: number;
    lineTotalCents: number;
  }[];
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
};

/**
 * Odoslie potvrdenie objednávky zákazníkovi po úspešnom POST /api/orders.
 * Zlyhanie iba zapíše do logu — objednávka ostáva vytvorená.
 */
export async function sendOrderConfirmationEmail(
  input: OrderConfirmationEmailInput
): Promise<EmailSendResult> {
  const resend = getResend();
  const from = getFromAddress();
  if (!resend || !from) {
    const detail =
      "Chýba RESEND_API_KEY alebo EMAIL_FROM v prostredí — email sa neodoslá.";
    if (process.env.NODE_ENV === "development") {
      console.info(`[email] ${detail}`);
    }
    return { ok: false, skipped: true, detail };
  }

  const base = getPublicSiteUrl();
  const orderLink = `${base}/objednavka/${encodeURIComponent(input.orderNumber)}`;

  const rows = input.lines
    .map(
      (ln) =>
        `<tr>
          <td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(ln.productName)}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${ln.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${formatPrice(ln.unitPriceCents)}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;font-weight:600">${formatPrice(ln.lineTotalCents)}</td>
        </tr>`
    )
    .join("");

  const discountRow =
    input.discountCents > 0
      ? `<tr><td colspan="3" style="padding:8px;text-align:right">Zľava</td><td style="padding:8px;text-align:right">−${formatPrice(input.discountCents)}</td></tr>`
      : "";

  const html = `<!DOCTYPE html>
<html lang="sk">
<head><meta charset="utf-8" /></head>
<body style="font-family:system-ui,Segoe UI,sans-serif;line-height:1.5;color:#171717;max-width:560px;margin:0 auto;padding:24px;">
  <p>Ahoj ${escapeHtml(input.customerName)},</p>
  <p><strong>Ďakujeme za objednávku!</strong></p>
  <p>Číslo objednávky: <strong>${escapeHtml(input.orderNumber)}</strong></p>
  <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
    <thead>
      <tr style="border-bottom:2px solid #ddd">
        <th style="text-align:left;padding:8px">Produkt</th>
        <th style="text-align:center;padding:8px">Ks</th>
        <th style="text-align:right;padding:8px">Cena / ks</th>
        <th style="text-align:right;padding:8px">Spolu</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot style="font-size:14px">
      <tr><td colspan="3" style="padding:8px;text-align:right;padding-top:12px">Medzisúčet</td><td style="padding:8px;text-align:right;padding-top:12px">${formatPrice(input.subtotalCents)}</td></tr>
      ${discountRow}
      <tr><td colspan="3" style="padding:8px;text-align:right">Doprava (${escapeHtml(input.shippingLabel)})</td><td style="padding:8px;text-align:right">${formatPrice(input.shippingCents)}</td></tr>
      <tr><td colspan="3" style="padding:12px 8px;text-align:right;font-weight:700;font-size:16px">Celkom</td><td style="padding:12px 8px;text-align:right;font-weight:700;font-size:16px">${formatPrice(input.totalCents)}</td></tr>
    </tfoot>
  </table>
  <p><a href="${orderLink}" style="display:inline-block;margin-top:8px;color:#0369a1">Zobraziť súhrn objednávky</a></p>
  <p style="margin-top:24px;font-size:13px;color:#737373">Toto je automatická správa. Ak si objednávku nevytváral/a, ignoruj email.</p>
</body>
</html>`;

  const { data, error } = await resend.emails.send({
    from,
    to: input.to,
    subject: `Potvrdenie objednávky ${input.orderNumber}`,
    html,
  });

  if (error) {
    const errStr = serializeResendError(error);
    console.error("[email] Resend objednávka:", error);
    return { ok: false, error: errStr };
  }

  if (process.env.NODE_ENV === "development" && data?.id) {
    console.info("[email] Objednávka odoslaná, Resend id:", data.id);
  }
  return { ok: true, id: data?.id };
}

export type CustomPrintEmailInput = {
  to: string;
  customerName: string;
  requestNumber: string;
};

/** Krátke potvrdenie prijatia požiadavky „Tlač na mieru“. */
export async function sendCustomPrintReceivedEmail(
  input: CustomPrintEmailInput
): Promise<EmailSendResult> {
  const resend = getResend();
  const from = getFromAddress();
  if (!resend || !from) {
    const detail =
      "Chýba RESEND_API_KEY alebo EMAIL_FROM — kontroluj .env a reštart `npm run dev`.";
    if (process.env.NODE_ENV === "development") {
      console.info(`[email] Tlač na mieru: ${detail}`);
    }
    return { ok: false, skipped: true, detail };
  }

  const base = getPublicSiteUrl();

  const html = `<!DOCTYPE html>
<html lang="sk">
<head><meta charset="utf-8" /></head>
<body style="font-family:system-ui,Segoe UI,sans-serif;line-height:1.5;color:#171717;max-width:520px;margin:0 auto;padding:24px;">
  <p>Ahoj ${escapeHtml(input.customerName)},</p>
  <p><strong>Dostali sme tvoju požiadavku na tlač na mieru.</strong></p>
  <p>Číslo požiadavky: <strong>${escapeHtml(input.requestNumber)}</strong></p>
  <p>Odpovieme čo najskôr na tento email. Ďalší postup doladíme priamo s tebou.</p>
  <p style="margin-top:20px"><a href="${base}/tlac-na-mieru" style="color:#0369a1">${base}/tlac-na-mieru</a></p>
</body>
</html>`;

  const { data, error } = await resend.emails.send({
    from,
    to: input.to,
    subject: `Prišla požiadavka ${input.requestNumber}`,
    html,
  });

  if (error) {
    const errStr = serializeResendError(error);
    console.error("[email] Resend tlač na mieru:", error);
    return { ok: false, error: errStr };
  }

  if (process.env.NODE_ENV === "development" && data?.id) {
    console.info("[email] Tlač na mieru — odoslané, Resend id:", data.id);
  }
  return { ok: true, id: data?.id };
}

export type CustomPrintQuoteEmailInput = {
  to: string;
  customerName: string;
  requestNumber: string;
  priceCents: number;
  /** Voliteľný text od admina — zobrazený nad záverom mailu */
  customerMessage?: string;
};

/** Cenová ponuka od admina k požiadavke „tlač na mieru“. */
export async function sendCustomPrintQuoteEmail(
  input: CustomPrintQuoteEmailInput
): Promise<EmailSendResult> {
  const resend = getResend();
  const from = getFromAddress();
  if (!resend || !from) {
    const detail =
      "Chýba RESEND_API_KEY alebo EMAIL_FROM — kontroluj .env a reštart servera.";
    if (process.env.NODE_ENV === "development") {
      console.info(`[email] Ponuka tláče: ${detail}`);
    }
    return { ok: false, skipped: true, detail };
  }

  const base = getPublicSiteUrl();

  const msg = input.customerMessage?.trim() ?? "";
  const messageBlock =
    msg.length > 0
      ? `<div style="margin:18px 0;padding:14px 16px;border-radius:12px;background:#f4f4f5;border:1px solid #e4e4e7;"><p style="margin:0;white-space:pre-line">${escapeHtml(
          msg
        )}</p></div>`
      : `<p>Orientačná cena doladená podľa tvojho popisu a prílohy. Podrobnosti ešte môžeme upraviť — odpíš prosím na tento email.</p>`;

  const html = `<!DOCTYPE html>
<html lang="sk">
<head><meta charset="utf-8" /></head>
<body style="font-family:system-ui,Segoe UI,sans-serif;line-height:1.5;color:#171717;max-width:520px;margin:0 auto;padding:24px;">
  <p>Ahoj ${escapeHtml(input.customerName)},</p>
  <p><strong>Posielame ti cenový návrh</strong> k tvojej požiadavke na tlač na mieru.</p>
  <p>Číslo požiadavky: <strong>${escapeHtml(input.requestNumber)}</strong></p>
  ${messageBlock}
  <p style="font-size:18px;margin-top:20px;"><strong>Orientačná cena:</strong> <span style="color:#0a0">${formatPrice(
    input.priceCents
  )}</span></p>
  <p style="font-size:14px;color:#52525b">Cena platí ako návrh; finálnu sumu potvrdíme po doplnení detailov alebo pri akceptácii.</p>
  <p style="margin-top:20px"><a href="${base}/tlac-na-mieru" style="color:#0369a1">${base}</a></p>
  <p style="margin-top:24px;font-size:13px;color:#737373">iknow3D — tento email poslala správa požiadavky.</p>
</body>
</html>`;

  const { data, error } = await resend.emails.send({
    from,
    to: input.to,
    subject: `Cenový návrh — požiadavka ${input.requestNumber}`,
    html,
  });

  if (error) {
    const errStr = serializeResendError(error);
    console.error("[email] Resend cenová ponuka (tlač):", error);
    return { ok: false, error: errStr };
  }

  if (process.env.NODE_ENV === "development" && data?.id) {
    console.info("[email] Cenová ponuka odoslaná, Resend id:", data.id);
  }
  return { ok: true, id: data?.id };
}
