import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminGuard";

export const runtime = "nodejs";

const VALID_STATUSES = [
  "NEW",
  "IN_REVIEW",
  "QUOTED",
  "ACCEPTED",
  "REJECTED",
  "COMPLETED",
] as const;

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const data: Record<string, unknown> = {};
  if (typeof body.status === "string") {
    if (!VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "Neplatný stav." }, { status: 400 });
    }
    data.status = body.status;
  }
  if (typeof body.adminNote === "string") {
    data.adminNote = body.adminNote || null;
  }
  if (body.quotedPriceCents === null) {
    data.quotedPriceCents = null;
  } else if (typeof body.quotedPriceCents === "number") {
    if (body.quotedPriceCents < 0) {
      return NextResponse.json({ error: "Neplatná cena." }, { status: 400 });
    }
    data.quotedPriceCents = Math.round(body.quotedPriceCents);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Žiadne zmeny." }, { status: 400 });
  }

  await prisma.customPrintRequest.update({
    where: { id },
    data,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const { id } = await params;
  await prisma.customPrintRequest.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
