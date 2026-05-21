/**
 * Pay by Square QR Code Generator — API Route
 *
 * Štandard: Pay by Square (slovenský QR platobný štandard)
 * Kompatibilné s: Tatra banka, SLSP, VÚB, mBank a iné SK/CZ banky
 *
 * POST /api/pay-by-square
 *
 * Request body:
 * {
 *   amount:         string  — Suma platby (napr. "29.99") — POVINNÉ
 *   iban:           string  — IBAN príjemcu — POVINNÉ
 *   variableSymbol: string  — Variabilný symbol (číslo objednávky) — voliteľné
 *   message:        string  — Poznámka pre príjemcu — voliteľné
 *   swift:          string  — SWIFT/BIC kód banky — voliteľné
 *   recipient:      string  — Meno príjemcu — voliteľné
 *   dueDate:        string  — Dátum splatnosti YYYY-MM-DD — voliteľné
 * }
 *
 * Response:
 * {
 *   success: true,
 *   qrCode:  string  — Base64 data URL PNG obrázka
 *   data:    string  — Raw Pay by Square base32 reťazec
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { generatePaymentQR } from "@/lib/pay-by-square";
import { isRateLimited, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

const PAY_RATE_CONFIG = { windowMs: 60_000, max: 15 };

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (isRateLimited(`pay-qr:${ip}`, PAY_RATE_CONFIG)) {
    return NextResponse.json(
      { error: "Príliš veľa pokusov. Skúste neskôr." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();

    const {
      amount,
      iban,
      variableSymbol = "",
      message = "",
      swift = "",
      recipient = "",
      dueDate = "",
    } = body;

    // Validácia povinných polí
    const missingFields: string[] = [];
    if (!amount || parseFloat(amount) <= 0) missingFields.push("amount");
    if (!iban || iban.trim() === "") missingFields.push("iban");

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: "Chýbajú povinné polia", missingFields },
        { status: 400 }
      );
    }

    const result = await generatePaymentQR({
      amount: parseFloat(amount),
      iban: iban.replace(/\s/g, ""),
      swift,
      variableSymbol,
      message,
      recipient,
      dueDate: dueDate || undefined,
    });

    return NextResponse.json({
      success: true,
      qrCode: result.qrCodeDataUrl,
      data: result.rawData,
    });
  } catch (error) {
    console.error("[PayBySquare] Error:", error);
    return NextResponse.json(
      { error: "Generovanie QR kódu zlyhalo." },
      { status: 500 }
    );
  }
}
