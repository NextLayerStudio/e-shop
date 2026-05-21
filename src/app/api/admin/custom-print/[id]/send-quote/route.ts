import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/adminGuard";
import { emailResultMessage, sendCustomPrintQuoteEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const bodySchema = z.object({
  quotedPriceCents: z.coerce.number().int().min(0),
  customerMessage: z.string().max(6000).optional(),
});

/** Admin odošle zákazníkovi email s cenovým návrhom; uloží cenu a stav QUOTED. */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const { id } = await params;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Neplatný JSON." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Vyplň platnú cenu (EUR uloženú ako centy). Maximálny text v emaili je 6000 znakov." },
      { status: 400 }
    );
  }

  const { quotedPriceCents, customerMessage } = parsed.data;

  const row = await prisma.customPrintRequest.findUnique({
    where: { id },
    select: {
      id: true,
      requestNumber: true,
      customerName: true,
      customerEmail: true,
    },
  });

  if (!row) {
    return NextResponse.json({ error: "Požiadavka neexistuje." }, { status: 404 });
  }

  await prisma.customPrintRequest.update({
    where: { id },
    data: {
      quotedPriceCents,
      status: "QUOTED",
    },
  });

  const msg = (customerMessage ?? "").trim();
  const messageForEmail = msg.length > 0 ? msg : undefined;

  const emailResult = await sendCustomPrintQuoteEmail({
    to: row.customerEmail,
    customerName: row.customerName,
    requestNumber: row.requestNumber,
    priceCents: quotedPriceCents,
    customerMessage: messageForEmail,
  });

  const payload: Record<string, unknown> = {
    ok: true,
    emailSent: emailResult.ok,
  };
  if (emailResult.ok && emailResult.id) {
    payload.resendEmailId = emailResult.id;
  }
  if (!emailResult.ok) {
    payload.emailError = emailResultMessage(emailResult);
    console.warn("[api/custom-print/send-quote] Email:", emailResult);
  }

  return NextResponse.json(payload);
}
