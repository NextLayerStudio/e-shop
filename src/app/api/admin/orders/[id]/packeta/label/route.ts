/**
 * POST /api/admin/orders/[id]/packeta/label
 *
 * Stiahne PDF štítok z Packeta API a odošle ho klientovi ako súbor.
 * Objednávka musí mať packetaPacketId (teda zásielka musí byť vytvorená).
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminGuard";
import { getLabelPdf, getPacketaConfig } from "@/lib/packeta/client";

export const runtime = "nodejs";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const { id } = await params;

  const order = await prisma.order.findUnique({ where: { id } });

  if (!order) {
    return NextResponse.json({ error: "Objednávka nenájdená." }, { status: 404 });
  }

  if (!order.packetaPacketId) {
    return NextResponse.json(
      { error: "Najprv vytvor zásielku v Packeta (packetaPacketId chýba)." },
      { status: 400 }
    );
  }

  const cfgResult = getPacketaConfig();
  if (!cfgResult.configured) {
    await prisma.order.update({
      where: { id },
      data: { packetaError: cfgResult.message },
    });
    return NextResponse.json(
      { error: "Packeta nie je nakonfigurovaná. Skontroluj .env." },
      { status: 400 }
    );
  }

  try {
    const pdfBuffer = await getLabelPdf(order.packetaPacketId);

    // Aktualizuj status ak ešte nie je label_ready
    if (order.packetaStatus !== "label_ready") {
      await prisma.order.update({
        where: { id },
        data: {
          packetaStatus: "label_ready",
          packetaError: null,
        },
      });
    }

    const body = new Uint8Array(pdfBuffer);

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="packeta-${order.orderNumber}.pdf"`,
        "Content-Length": String(body.byteLength),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Neznáma chyba Packeta API.";
    console.error("[packeta] getLabelPdf failed for order", id, message);

    await prisma.order.update({
      where: { id },
      data: { packetaError: message },
    });

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
