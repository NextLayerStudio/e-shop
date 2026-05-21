/**
 * Odoslanie emailov cez Resend (https://resend.com).
 * Bez RESEND_API_KEY sa nič neposiela (lokálny vývoj) — žiadny pád aplikácie.
 */

import { Resend } from "resend";

import { formatPrice } from "@/lib/format";

/** Viditeľné vo Vercel → Logs (Runtime) — bez API kľúčov. */
function logEmailConfigSkip(context: string, detail: string): void {
  const hasKey = Boolean(process.env.RESEND_API_KEY?.trim());
  const hasFrom = Boolean(process.env.EMAIL_FROM?.trim());
  console.warn(
    `[email] ${context}: ${detail} | RESEND_API_KEY=${hasKey ? "ok" : "CHÝBA"}, EMAIL_FROM=${hasFrom ? "ok" : "CHÝBA"} | Na Verceli: Project → Settings → Environment Variables (Production) + Redeploy`
  );
}

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

/** Farby ako `src/app/globals.css` (#brand / accent). Všetko inline kvôli email klientom. */
const EB = {
  brand: "#2DAEEC",
  brandDark: "#1F8FC9",
  accent: "#F08A3E",
  bgPage: "#fafafa",
  surface: "#ffffff",
  border: "#e8e8e8",
  text: "#171717",
  muted: "#737373",
  tint: "#e8f4fb",
  warmTint: "#fff5ed",
};

function chipHtml(text: string): string {
  return `<span style="display:inline-block;background:${EB.tint};color:${EB.brandDark};font-weight:800;font-size:13px;padding:8px 14px;border-radius:999px;letter-spacing:0.02em;">${escapeHtml(text)}</span>`;
}

function primaryCtaHtml(href: string, label: string): string {
  const h = escapeHtml(href);
  const l = escapeHtml(label);
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:22px 0 6px;"><tr><td bgcolor="${EB.brand}" style="border-radius:999px;background:${EB.brand};">
<a href="${h}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 28px;color:#ffffff !important;text-decoration:none;font-weight:700;font-size:14px;line-height:1.2;">${l}</a>
</td></tr></table>`;
}

/** Jednotný vzhľad mailov ako web (brand pruh, kartová hrana, pätička). */
function wrapCustomerEmail(opts: {
  baseUrl: string;
  /** Préheader v náhľade schránky */
  preheader?: string;
  innerHtml: string;
  hideAutoDisclaimer?: boolean;
}): string {
  const base = escapeHtml(opts.baseUrl.replace(/\/$/, ""));
  const baseHrefRaw = opts.baseUrl.replace(/\/$/, "");
  const baseHrefEsc = escapeHtml(baseHrefRaw);
  const pre =
    (opts.preheader?.trim().length ?? 0) > 0
      ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;"><span>${escapeHtml((opts.preheader ?? "").slice(0, 100))}</span></div>`
      : "";
  const auto =
    opts.hideAutoDisclaimer === true ? "" : `<p style="margin:0 0 10px;">Automatické potvrdenie z nášho e-shopu.</p>`;

  return `<!DOCTYPE html>
<html lang="sk">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:${EB.bgPage};color:${EB.text};-webkit-font-smoothing:antialiased;">
  ${pre}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${EB.bgPage};padding:26px 10px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="max-width:560px;width:100%;border-radius:20px;overflow:hidden;border:1px solid ${EB.border};background:${EB.surface};box-shadow:0 14px 40px rgba(23,23,23,0.07);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
        <tr><td bgcolor="${EB.brand}" style="padding:21px 22px;background:${EB.brand};border-bottom:4px solid ${EB.accent};">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
            <td style="vertical-align:middle;color:#ffffff;">
              <span style="font-size:21px;font-weight:800;letter-spacing:-0.04em;line-height:1;display:block;">iknow<strong style="font-weight:900;">3D</strong></span>
              <div style="font-size:12px;color:rgba(255,255,255,0.9);margin-top:6px;font-weight:600;">3D výtlačky &amp; tlač na mieru</div>
            </td>
            <td align="right" style="vertical-align:middle;white-space:nowrap;"><a href="${baseHrefEsc}" style="display:inline-block;padding:9px 15px;font-size:12px;font-weight:700;color:#ffffff !important;text-decoration:none;border-radius:999px;border:1px solid rgba(255,255,255,0.52);">Obchod</a></td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:28px 22px;font-size:15px;line-height:1.58;color:${EB.text};">
          ${opts.innerHtml}
        </td></tr>
        <tr><td style="padding:16px 22px;background:#f9fafb;border-top:1px solid ${EB.border};font-size:12px;color:${EB.muted};line-height:1.55;">
          ${auto}
          <p style="margin:0;"><strong style="color:${EB.text};">iknow3D</strong> · <a href="${baseHrefEsc}" style="color:${EB.brandDark};font-weight:700;text-decoration:none;">${base.replace(/^https?:\/\//, "")}</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
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
  if (/@resend\.dev\b/i.test(from)) {
    console.warn(
      "[email] EMAIL_FROM používa @resend.dev — doručenie zákazníkom väčšinou nie je povolené. Nastav adresu na vlastnej doméne (napr. know3d@know3d.sk overený v Resend)."
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
    logEmailConfigSkip("Objednávka", detail);
    return { ok: false, skipped: true, detail };
  }

  const base = getPublicSiteUrl();
  const orderLink = `${base}/objednavka/${encodeURIComponent(input.orderNumber)}`;

  const rows = input.lines
    .map(
      (ln) =>
        `<tr>
          <td style="padding:12px 10px;border-bottom:1px solid ${EB.border};font-size:14px;line-height:1.45;color:${EB.text};">${escapeHtml(ln.productName)}</td>
          <td style="padding:12px 8px;border-bottom:1px solid ${EB.border};text-align:center;font-weight:700;font-size:14px;color:${EB.text};">${ln.quantity}</td>
          <td style="padding:12px 10px;border-bottom:1px solid ${EB.border};text-align:right;font-size:14px;line-height:1.45;color:${EB.muted};">${formatPrice(ln.unitPriceCents)}</td>
          <td style="padding:12px 10px;border-bottom:1px solid ${EB.border};text-align:right;font-weight:700;font-size:14px;color:${EB.text};">${formatPrice(ln.lineTotalCents)}</td>
        </tr>`
    )
    .join("");

  const discountRow =
    input.discountCents > 0
      ? `<tr>
          <td colspan="3" style="padding:12px 10px;background:${EB.warmTint};border-bottom:1px solid ${EB.border};text-align:right;font-size:13px;font-weight:800;color:${EB.accent};">Zľava</td>
          <td style="padding:12px 10px;background:${EB.warmTint};border-bottom:1px solid ${EB.border};text-align:right;font-weight:900;font-size:14px;color:${EB.accent};">−${formatPrice(input.discountCents)}</td>
        </tr>`
      : "";

  const innerOrder = `
  <p style="margin:0 0 10px;">Ahoj <strong>${escapeHtml(input.customerName)}</strong>,</p>
  <p style="margin:0 0 14px;font-size:18px;line-height:1.35;color:${EB.text};"><strong style="color:${EB.brandDark};">Ďakujeme za objednávku!</strong></p>
  <p style="margin:0 0 18px;">Číslo objednávky ${chipHtml(input.orderNumber)}</p>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:6px 0 14px;border:1px solid ${EB.border};border-radius:14px;overflow:hidden;border-collapse:separate;mso-table-lspace:0pt;mso-table-rspace:0pt;">
    <tr style="background:${EB.tint};">
      <th align="left" style="padding:11px 10px;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:${EB.brandDark};font-weight:800;">Produkt</th>
      <th align="center" style="padding:11px 8px;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:${EB.brandDark};font-weight:800;width:44px;">Ks</th>
      <th align="right" style="padding:11px 10px;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:${EB.brandDark};font-weight:800;">Cena / ks</th>
      <th align="right" style="padding:11px 10px;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:${EB.brandDark};font-weight:800;">Spolu</th>
    </tr>
    ${rows}
    <tr>
      <td colspan="3" style="padding:12px 10px;text-align:right;font-size:14px;color:${EB.muted};border-top:1px solid ${EB.border};"><span style="color:${EB.text};font-weight:600;">Medzisúčet</span></td>
      <td style="padding:12px 10px;text-align:right;font-weight:700;font-size:14px;border-top:1px solid ${EB.border};color:${EB.text};">${formatPrice(input.subtotalCents)}</td>
    </tr>
    ${discountRow}
    <tr>
      <td colspan="3" style="padding:10px;text-align:right;font-size:13px;color:${EB.muted};">Doprava <span style="color:${EB.text};font-weight:600;">(${escapeHtml(input.shippingLabel)})</span></td>
      <td style="padding:10px;text-align:right;font-weight:700;font-size:14px;color:${EB.text};">${formatPrice(input.shippingCents)}</td>
    </tr>
    <tr>
      <td colspan="3" style="padding:15px 10px;text-align:right;font-size:16px;font-weight:900;color:${EB.text};border-top:2px solid ${EB.brand};background:${EB.surface};">Celkom</td>
      <td style="padding:15px 10px;text-align:right;font-size:18px;font-weight:900;color:${EB.brandDark};border-top:2px solid ${EB.brand};background:${EB.surface};">${formatPrice(input.totalCents)}</td>
    </tr>
  </table>
  ${primaryCtaHtml(orderLink, "Zobraziť súhrn objednávky")}
  <p style="margin:10px 0 0;font-size:13px;color:${EB.muted};line-height:1.55;">Ak si objednávku nevytváral/a, túto správu môžeš ignorovať.</p>
  `.trimStart();

  const html = wrapCustomerEmail({
    baseUrl: base,
    preheader: `Objednávka ${input.orderNumber} — ${formatPrice(input.totalCents)}`,
    innerHtml: innerOrder,
  });

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

  if (data?.id) {
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
      "Chýba RESEND_API_KEY alebo EMAIL_FROM — lokálne .env alebo premenné na Verceli.";
    logEmailConfigSkip("Tlač na mieru (prijatá)", detail);
    return { ok: false, skipped: true, detail };
  }

  const base = getPublicSiteUrl();
  const tlacUrl = `${base}/tlac-na-mieru`;

  const innerCustomPrint = `
  <p style="margin:0 0 10px;">Ahoj <strong>${escapeHtml(input.customerName)}</strong>,</p>
  <p style="margin:0 0 14px;font-size:18px;line-height:1.35;"><strong style="color:${EB.brandDark};">Dostali sme tvoju požiadavku</strong> na tlač na mieru.</p>
  <p style="margin:0 0 18px;">Referenčné číslo: ${chipHtml(input.requestNumber)}</p>
  <p style="margin:0 0 22px;padding:17px 18px;border-radius:14px;background:${EB.tint};border:1px solid ${EB.border};font-size:14px;line-height:1.55;color:${EB.text};">Odpovieme čo najskôr na tento email (obvykle do 48 hodín). Materiál, termín a dopravu doladíme priamo s tebou.</p>
  ${primaryCtaHtml(tlacUrl, "Stránka tlače na mieru")}
  `.trimStart();

  const html = wrapCustomerEmail({
    baseUrl: base,
    preheader: `Požiadavka ${input.requestNumber} — prijatá`,
    innerHtml: innerCustomPrint,
  });

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

  if (data?.id) {
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
      "Chýba RESEND_API_KEY alebo EMAIL_FROM — lokálne .env alebo premenné na Verceli.";
    logEmailConfigSkip("Tlač na mieru (cenová ponuka)", detail);
    return { ok: false, skipped: true, detail };
  }

  const base = getPublicSiteUrl();

  const msg = input.customerMessage?.trim() ?? "";
  const messageBlock =
    msg.length > 0
      ? `<div style="margin:16px 0;padding:18px;border-radius:14px;background:${EB.tint};border:1px solid ${EB.border};border-left:4px solid ${EB.brand};"><p style="margin:0;white-space:pre-line;font-size:14px;line-height:1.55;color:${EB.text};">${escapeHtml(
          msg
        )}</p></div>`
      : `<p style="margin:0 0 16px;padding:15px 17px;border-radius:12px;background:${EB.warmTint};border:1px solid ${EB.border};font-size:14px;line-height:1.55;color:${EB.text};">Orientačná cena podľa tvojho popisu a prílohy. Detaily ešte spresníme — stačí odpovedať na tento email.</p>`;

  const tlacUrl = `${base}/tlac-na-mieru`;

  const innerQuote = `
  <p style="margin:0 0 10px;">Ahoj <strong>${escapeHtml(input.customerName)}</strong>,</p>
  <p style="margin:0 0 8px;font-size:18px;line-height:1.35;"><strong style="color:${EB.brandDark};">Cenový návrh</strong> · tlač na mieru</p>
  <p style="margin:0 0 14px;color:${EB.muted};font-size:14px;">Požiadavka ${chipHtml(input.requestNumber)}</p>
  ${messageBlock}
  <div style="margin:22px 0 10px;padding:22px 18px;border-radius:16px;background:${EB.warmTint};border:1px solid ${EB.border};text-align:center;">
    <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.12em;font-weight:800;color:${EB.muted};">Orientačná cena</div>
    <div style="margin-top:8px;font-size:30px;font-weight:900;letter-spacing:-0.03em;line-height:1.1;color:${EB.brandDark};">${formatPrice(input.priceCents)}</div>
  </div>
  <p style="margin:0 0 4px;font-size:13px;color:${EB.muted};line-height:1.55;">Údaje slúžia ako cenový návrh — finálnu sumu potvrdíme po doplnení detailov alebo pri akceptácii.</p>
  ${primaryCtaHtml(tlacUrl, "Otvoriť iknow3D")}
  `.trimStart();

  const html = wrapCustomerEmail({
    baseUrl: base,
    preheader: `Cenový návrh ${input.requestNumber} — ${formatPrice(input.priceCents)}`,
    innerHtml: innerQuote,
  });

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

  if (data?.id) {
    console.info("[email] Cenová ponuka odoslaná, Resend id:", data.id);
  }
  return { ok: true, id: data?.id };
}
