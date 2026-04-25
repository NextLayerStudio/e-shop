import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fileToBytes } from "@/lib/bytes";

export const runtime = "nodejs";

const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB

function generateRequestNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, "0");
  return `TLAC-${year}-${rand}`;
}

export async function POST(req: Request) {
  const form = await req.formData();

  const customerName = String(form.get("customerName") ?? "").trim();
  const customerEmail = String(form.get("customerEmail") ?? "").trim();
  const customerPhone = String(form.get("customerPhone") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  const file = form.get("file");

  if (customerName.length < 2 || customerName.length > 120) {
    return NextResponse.json({ error: "Neplatné meno." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
    return NextResponse.json({ error: "Neplatný email." }, { status: 400 });
  }
  if (description.length < 5) {
    return NextResponse.json(
      { error: "Popis je príliš krátky." },
      { status: 400 }
    );
  }

  let fileData: Uint8Array<ArrayBuffer> | null = null;
  let fileName: string | null = null;
  let fileMimeType: string | null = null;
  let fileSizeBytes: number | null = null;

  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: "Súbor je väčší ako 25 MB." },
        { status: 400 }
      );
    }
    fileData = await fileToBytes(file);
    fileName = file.name;
    fileMimeType = file.type || "application/octet-stream";
    fileSizeBytes = file.size;
  }

  const requestNumber = generateRequestNumber();

  await prisma.customPrintRequest.create({
    data: {
      requestNumber,
      customerName,
      customerEmail,
      customerPhone: customerPhone || null,
      description,
      fileData,
      fileName,
      fileMimeType,
      fileSizeBytes,
    },
  });

  return NextResponse.json({ requestNumber });
}
