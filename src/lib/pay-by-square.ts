/**
 * Pay by Square — generátor QR kódu pre slovenský platobný štandard.
 * Kompatibilné s: Tatra banka, SLSP, VÚB, mBank a ostatné SK/CZ banky.
 *
 * Prevzaté a prispôsobené z newera_sisikovacsova projektu.
 */

import * as QRCode from "qrcode";
import { exec } from "child_process";
import * as CRC32 from "crc-32";
import path from "path";
import fs from "fs";

/** Odstráni diakritiku — Pay by Square odporúča ASCII v poznámke. */
function removeAccents(str: string): string {
  const accentsMap: Record<string, string> = {
    á: "a", ä: "a", č: "c", ď: "d", é: "e", ě: "e",
    í: "i", ľ: "l", ĺ: "l", ň: "n", ó: "o", ô: "o",
    ŕ: "r", š: "s", ť: "t", ú: "u", ů: "u", ý: "y",
    ž: "z",
    Á: "A", Ä: "A", Č: "C", Ď: "D", É: "E", Ě: "E",
    Í: "I", Ľ: "L", Ĺ: "L", Ň: "N", Ó: "O", Ô: "O",
    Ŕ: "R", Š: "S", Ť: "T", Ú: "U", Ů: "U", Ý: "Y",
    Ž: "Z",
  };
  return str.split("").map((char) => accentsMap[char] || char).join("");
}

/** CRC32 checksum (little-endian). */
function calculateCRC32(data: string): Buffer {
  const crcValue = CRC32.str(data);
  const buffer = Buffer.alloc(4);
  buffer.writeInt32LE(crcValue, 0);
  return buffer;
}

/** Nájde xz binárku — bin/xz (Vercel bundle), systémové cesty, fallback PATH. */
function findXzBinary(): string {
  const candidates = [
    path.join(process.cwd(), "bin", "xz"),
    "/usr/bin/xz",
    "/bin/xz",
    "/opt/homebrew/bin/xz",
    "xz",
  ];

  for (const p of candidates) {
    try {
      if (p === "xz" || fs.existsSync(p)) return p;
    } catch {
      continue;
    }
  }
  return "xz";
}

interface PayBySquareParams {
  price: string;       // suma napr. "29.99"
  iban: string;        // IBAN bez medzier
  swift?: string;      // SWIFT/BIC
  vs?: string;         // variabilný symbol
  cs?: string;         // konštantný symbol
  ss?: string;         // špecifický symbol
  note?: string;       // poznámka (bez diakritiky)
  recipient?: string;  // meno príjemcu (bez diakritiky)
  dueDate?: string;    // YYYY-MM-DD
}

async function generatePayBySquareData(params: PayBySquareParams): Promise<string> {
  const {
    price, iban,
    swift = "", vs = "", cs = "", ss = "",
    note = "", recipient = "",
    dueDate,
  } = params;

  // Dátum vo formáte YYYYMMDD
  const date = dueDate
    ? dueDate.replace(/-/g, "")
    : new Date().toISOString().slice(0, 10).replace(/-/g, "");

  // Pay by Square dátová štruktúra (15 tab-separated polí)
  const dataString = [
    "",        // prázdny header
    "1",       // verzia
    [
      "1",       // typ platby
      price,     // suma
      "EUR",     // mena (vždy EUR pre SK)
      date,      // dátum splatnosti
      vs,        // variabilný symbol
      cs,        // konštantný symbol
      ss,        // špecifický symbol
      "",        // referencia (prázdna)
      note,      // poznámka
      "1",       // počet bankových účtov
      iban,      // IBAN
      swift,     // SWIFT
      "0",       // odosielateľ (0 = nie)
      "0",       // odosielateľ IBAN (0 = nie)
      recipient, // meno príjemcu
    ].join("\t"),
  ].join("\t");

  const crc = calculateCRC32(dataString);
  const dataWithCrc = Buffer.concat([crc, Buffer.from(dataString, "utf-8")]);
  const xzPath = findXzBinary();

  return new Promise((resolve, reject) => {
    const xzProcess = exec(
      `${xzPath} --format=raw --lzma1=lc=3,lp=0,pb=2,dict=128KiB -c -`,
      { encoding: "buffer", maxBuffer: 10 * 1024 * 1024 },
      (error, stdout) => {
        if (error) {
          reject(new Error(`xz compression failed: ${error.message}`));
          return;
        }

        const compressed = stdout as Buffer;

        // Hlavička: 2 bajty nuly + 2 bajty dĺžka originálnych dát (little-endian)
        const lengthBuffer = Buffer.alloc(2);
        lengthBuffer.writeUInt16LE(dataWithCrc.length, 0);

        const fullData = Buffer.concat([
          Buffer.from([0x00, 0x00]),
          lengthBuffer,
          compressed,
        ]);

        // Hex → binárny reťazec → Pay by Square base32 (vlastná abeceda)
        const hexString = fullData.toString("hex");
        let binaryString = "";
        for (let i = 0; i < hexString.length; i++) {
          binaryString += parseInt(hexString[i], 16).toString(2).padStart(4, "0");
        }

        // Zarovnanie na násobok 5 bitov
        const remainder = binaryString.length % 5;
        if (remainder > 0) binaryString += "0".repeat(5 - remainder);

        // Pay by Square base32 abeceda (nie štandardná RFC 4648!)
        const BASE32_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUV";
        let base32 = "";
        for (let i = 0; i < binaryString.length; i += 5) {
          base32 += BASE32_ALPHABET[parseInt(binaryString.substring(i, i + 5), 2)];
        }

        resolve(base32);
      }
    );

    if (xzProcess.stdin) {
      xzProcess.stdin.write(dataWithCrc);
      xzProcess.stdin.end();
    } else {
      reject(new Error("Failed to write to xz stdin"));
    }
  });
}

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

export async function generatePaymentQR(input: GenerateQRInput): Promise<GenerateQRResult> {
  const payBySquareData = await generatePayBySquareData({
    price: input.amount.toFixed(2),
    iban: input.iban.replace(/\s/g, ""),
    swift: input.swift,
    vs: input.variableSymbol,
    note: removeAccents(input.message).toLowerCase(),
    recipient: removeAccents(input.recipient),
    dueDate: input.dueDate,
  });

  const qrCodeDataUrl = await QRCode.toDataURL(payBySquareData, {
    errorCorrectionLevel: "L",  // Pay by Square vyžaduje Level L
    margin: 1,
    width: 300,
  });

  return { qrCodeDataUrl, rawData: payBySquareData };
}
