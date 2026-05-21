/**
 * Pay by Square — generátor QR kódu pre slovenský platobný štandard.
 * Používa knižnicu `bysquare` (pure JS, funguje aj na Vercel serverless).
 */

import * as QRCode from "qrcode";
import { encode, PaymentOptions, CurrencyCode } from "bysquare/pay";

export interface GenerateQRInput {
  /** Suma v eurách (napr. 29.99) */
  amount: number;
  iban: string;
  swift?: string;
  /** Variabilný symbol — ideálne číselné číslo objednávky */
  variableSymbol: string;
  message: string;
  recipient: string;
  dueDate?: string;
}

export interface GenerateQRResult {
  /** Base64 data URL PNG obrázka */
  qrCodeDataUrl: string;
  /** Raw Pay by Square base32 reťazec */
  rawData: string;
}

function formatDueDate(dueDate?: string): string | undefined {
  if (!dueDate) return undefined;
  const compact = dueDate.replace(/-/g, "");
  return /^\d{8}$/.test(compact) ? compact : undefined;
}

export async function generatePaymentQR(
  input: GenerateQRInput
): Promise<GenerateQRResult> {
  const iban = input.iban.replace(/\s/g, "");
  const swift = input.swift?.trim();
  const recipient =
    input.recipient.trim() ||
    process.env.PAYMENT_RECIPIENT_NAME?.trim() ||
    "iknow3D";

  const due = formatDueDate(input.dueDate);
  const fallbackDue = new Date();
  fallbackDue.setDate(fallbackDue.getDate() + 7);
  const paymentDueDate =
    due ?? fallbackDue.toISOString().slice(0, 10).replace(/-/g, "");

  const payBySquareData = encode({
    payments: [
      {
        type: PaymentOptions.PaymentOrder,
        amount: input.amount,
        currencyCode: CurrencyCode.EUR,
        paymentDueDate,
        variableSymbol: input.variableSymbol.replace(/\D/g, "").slice(0, 10),
        paymentNote: input.message.slice(0, 140),
        bankAccounts: [
          {
            iban,
            ...(swift ? { bic: swift } : {}),
          },
        ],
        beneficiary: { name: recipient.slice(0, 70) },
      },
    ],
  });

  const qrCodeDataUrl = await QRCode.toDataURL(payBySquareData, {
    errorCorrectionLevel: "L",
    margin: 1,
    width: 300,
  });

  return { qrCodeDataUrl, rawData: payBySquareData };
}
