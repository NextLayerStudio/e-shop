/**
 * POST /api/admin/orders/[id]/packeta/create
 *
 * Vytvorí zásielku v Packeta API a uloží packetaPacketId + barcode do DB.
 * Objednávka musí mať status PAID a vybrané výdajné miesto (packetaPointId).
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminGuard";
import { createPacket, getPacketaConfig, splitCustomerName } from "@/lib/packeta/client";

export const runtime = "nodejs";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Objednávka nenájdená." }, { status: 404 });
  }

  // Zásielka už existuje
  if (order.packetaPacketId) {
    return NextResponse.json({
      success: true,
      alreadyExists: true,
      packetaPacketId: order.packetaPacketId,
      packetaTrackingNumber: order.packetaTrackingNumber,
      packetaStatus: order.packetaStatus,
    });
  }

  // Musí mať výdajné miesto
  if (!order.packetaPointId) {
    return NextResponse.json(
      { error: "Objednávka nemá zvolené výdajné miesto Packeta." },
      { status: 400 }
    );
  }

  // Musí byť zaplatená
  if (order.status !== "PAID") {
    return NextResponse.json(
      { error: "Objednávka ešte nie je zaplatená. Najprv ju označ ako PAID." },
      { status: 400 }
    );
  }

  // Overenie konfigurácie
  const cfgResult = getPacketaConfig();
  if (!cfgResult.configured) {
    await prisma.order.update({
      where: { id },
      data: { packetaStatus: "error", packetaError: cfgResult.message },
    });
    return NextResponse.json(
      { error: "Packeta nie je nakonfigurovaná. Skontroluj .env." },
      { status: 400 }
    );
  }

  const { firstName, lastName } = splitCustomerName(order.customerName);

  try {
    const result = await createPacket({
      orderNumber: order.orderNumber,
      firstName,
      lastName,
      email: order.customerEmail,
      phone: order.customerPhone || "",
      addressId: order.packetaPointId,
      value: order.totalCents / 100,
      weightKg: cfgResult.config.defaultWeightKg,
      currency: cfgResult.config.defaultCurrency,
    });

    await prisma.order.update({
      where: { id },
      data: {
        packetaPacketId: result.packetId,
        packetaTrackingNumber: result.barcode,
        packetaStatus: "created",
        packetaCreatedAt: new Date(),
        packetaError: null,
      },
    });

    return NextResponse.json({
      success: true,
      packetaPacketId: result.packetId,
      packetaTrackingNumber: result.barcode,
      packetaStatus: "created",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Neznáma chyba Packeta API.";
    console.error("[packeta] createPacket failed for order", id, message);

    await prisma.order.update({
      where: { id },
      data: { packetaStatus: "error", packetaError: message },
    });

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
