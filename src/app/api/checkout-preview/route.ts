/**
 * Checkout Preview — vygeneruje QR kód pre medzikrok platby.
 *
 * Klient pošle len sumu (v centoch), server použije PAYMENT_IBAN z env
 * a vráti QR kód + verejné platobné info.
 *
 * POST /api/checkout-preview
 * Body: { amountCents: number }
 * Response: { qrCode: string | null, iban: string }
 */

import { NextResponse } from "next/server";
import { generatePaymentQR } from "@/lib/pay-by-square";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Neplatné dáta." }, { status: 400 });
  }

  const amountCents =
    typeof (body as Record<string, unknown>).amountCents === "number"
      ? ((body as Record<string, unknown>).amountCents as number)
      : null;

  if (!amountCents || amountCents <= 0) {
    return NextResponse.json({ error: "Neplatná suma." }, { status: 400 });
  }

  const iban = process.env.PAYMENT_IBAN ?? "";
  const swift = process.env.PAYMENT_SWIFT ?? "";
  const recipient = process.env.PAYMENT_RECIPIENT_NAME ?? "";

  if (!iban) {
    // IBAN nie je nastavený — vrátime len info bez QR
    return NextResponse.json({ qrCode: null, iban: "" });
  }

  try {
    const result = await generatePaymentQR({
      amount: amountCents / 100,
      iban,
      swift,
      variableSymbol: "", // VS dostane zákazník až na potvrdzovacej stránke
      message: "Platba za objednavku",
      recipient,
    });

    return NextResponse.json({ qrCode: result.qrCodeDataUrl, iban });
  } catch (err) {
    console.error("[checkout-preview] QR generation failed:", err);
    // QR zlyhalo — vrátime aspoň IBAN
    return NextResponse.json({ qrCode: null, iban });
  }
}
