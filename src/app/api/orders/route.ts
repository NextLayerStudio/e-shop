import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import {
  computeDiscountCents,
  isPromoUsableNow,
  normalizePromoCodeInput,
  promoMeetsMinimumOrder,
} from "@/lib/promo";
import {
  getShippingFeeCentsVerified,
  getShippingMethodById,
} from "@/lib/shippingMethods";
import { generatePaymentQR } from "@/lib/pay-by-square";
import { isRateLimited, getClientIp } from "@/lib/rate-limit";
import { sendOrderConfirmationEmail, emailResultMessage } from "@/lib/email";

export const runtime = "nodejs";

const ORDER_RATE_CONFIG = { windowMs: 60_000, max: 5 };

const orderSchema = z.object({
  customerName: z.string().min(2).max(120),
  customerEmail: z.string().email(),
  customerPhone: z.string().max(40).optional().or(z.literal("")),
  address: z.string().min(1).max(200),
  city: z.string().min(1).max(120),
  postalCode: z.string().min(1).max(20),
  country: z.string().min(1).max(80),
  note: z.string().max(2000).optional().or(z.literal("")),
  promoCode: z.string().max(40).optional().or(z.literal("")),
  shippingMethodId: z.string().min(1).max(80),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1).max(999),
      })
    )
    .min(1)
    .max(100),
  // Packeta výdajné miesto — voliteľné
  packetaPointId: z.string().max(80).nullable().optional(),
  packetaPointName: z.string().max(200).nullable().optional(),
  packetaPointAddress: z.string().max(300).nullable().optional(),
  packetaIsoCountry: z.string().max(10).nullable().optional(),
});

function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, "0");
  return `${year}-${rand}`;
}

export async function POST(req: Request) {
  // Rate limiting — max 5 objednávok za minútu z jednej IP
  const ip = getClientIp(req);
  if (isRateLimited(`create-order:${ip}`, ORDER_RATE_CONFIG)) {
    return NextResponse.json(
      { error: "Príliš veľa pokusov. Skúste neskôr." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Neplatné dáta." }, { status: 400 });
  }

  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Neplatné údaje formulára." },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const productIds = data.items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
    select: { id: true, name: true, priceCents: true, stock: true },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));
  for (const item of data.items) {
    const p = productMap.get(item.productId);
    if (!p) {
      return NextResponse.json(
        { error: `Produkt nie je dostupný.` },
        { status: 400 }
      );
    }
    if (p.stock < item.quantity) {
      return NextResponse.json(
        { error: `Produkt "${p.name}" nie je skladom v požadovanom množstve.` },
        { status: 400 }
      );
    }
  }

  const subtotalCents = data.items.reduce((sum, item) => {
    const p = productMap.get(item.productId)!;
    return sum + p.priceCents * item.quantity;
  }, 0);

  const codeNorm = normalizePromoCodeInput(data.promoCode ?? "");
  let discountCents = 0;
  let promoId: string | null = null;
  let promoSnapshot: string | null = null;

  if (codeNorm) {
    const promo = await prisma.promoCode.findUnique({
      where: { code: codeNorm },
    });
    if (!promo || !isPromoUsableNow(promo)) {
      return NextResponse.json(
        { error: "Kupón nie je platný alebo expiroval." },
        { status: 400 }
      );
    }
    if (!promoMeetsMinimumOrder(promo, subtotalCents)) {
      const min = promo.minOrderCents ?? 0;
      return NextResponse.json(
        {
          error: `Minimálna hodnota objednávky pre tento kupón je ${formatPrice(min)}.`,
        },
        { status: 400 }
      );
    }
    discountCents = computeDiscountCents(promo, subtotalCents);
    promoId = promo.id;
    promoSnapshot = promo.code;
  }

  const shippingFee = getShippingFeeCentsVerified(data.shippingMethodId);
  if (shippingFee === null) {
    return NextResponse.json(
      { error: "Neplatný spôsob dopravy." },
      { status: 400 }
    );
  }
  const shippingMeta = getShippingMethodById(data.shippingMethodId);
  if (!shippingMeta) {
    return NextResponse.json(
      { error: "Neplatný spôsob dopravy." },
      { status: 400 }
    );
  }

  const totalCents = Math.max(0, subtotalCents - discountCents + shippingFee);

  const lines = data.items.map((item) => {
    const p = productMap.get(item.productId)!;
    return {
      productName: p.name,
      quantity: item.quantity,
      unitPriceCents: p.priceCents,
      lineTotalCents: p.priceCents * item.quantity,
    };
  });

  const orderNumber = generateOrderNumber();

  // Pay by Square QR — IBAN je voliteľný; ak nie je nastavený, QR sa proste nevytvorí
  const iban = process.env.PAYMENT_IBAN ?? "";
  const swift = process.env.PAYMENT_SWIFT ?? "";
  const recipientName = process.env.PAYMENT_RECIPIENT_NAME ?? "";

  // Variabilný symbol — len číslice z čísla objednávky (napr. "2026-001234" → "2026001234")
  const variableSymbol = orderNumber.replace(/\D/g, "");

  let qrCodeDataUrl: string | null = null;
  if (iban) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);

    try {
      const qrResult = await generatePaymentQR({
        amount: totalCents / 100,
        iban,
        swift,
        variableSymbol,
        message: `Objednavka ${orderNumber}`,
        recipient: recipientName,
        dueDate: dueDate.toISOString().slice(0, 10),
      });
      qrCodeDataUrl = qrResult.qrCodeDataUrl;
    } catch (err) {
      console.error("[order] QR generation failed:", err);
      // QR zlyhalo — objednávka sa napriek tomu vytvorí, zákazník môže platiť manuálne
    }
  }

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNumber,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone || null,
        address: data.address,
        city: data.city,
        postalCode: data.postalCode,
        country: data.country,
        note: data.note || null,
        totalCents,
        discountCents,
        shippingCents: shippingFee,
        shippingMethodId: data.shippingMethodId,
        shippingLabel: shippingMeta.label,
        ...(promoId ? { promoCode: { connect: { id: promoId } } } : {}),
        promoSnapshot,
        qrCodeDataUrl,
        packetaPointId: data.packetaPointId ?? null,
        packetaPointName: data.packetaPointName ?? null,
        packetaPointAddress: data.packetaPointAddress ?? null,
        packetaIsoCountry: data.packetaIsoCountry ?? null,
        items: {
          create: data.items.map((item) => {
            const p = productMap.get(item.productId)!;
            return {
              productId: item.productId,
              productName: p.name,
              unitPriceCents: p.priceCents,
              quantity: item.quantity,
            };
          }),
        },
      },
    });

    for (const item of data.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: { decrement: item.quantity },
          salesCount: { increment: item.quantity },
        },
      });
    }

    return created;
  });

  const emailResult = await sendOrderConfirmationEmail({
    to: data.customerEmail.trim(),
    customerName: data.customerName,
    orderNumber: order.orderNumber,
    shippingLabel: shippingMeta.label,
    lines,
    subtotalCents,
    discountCents,
    shippingCents: shippingFee,
    totalCents,
  });

  const payload: {
    orderNumber: string;
    qrCodeDataUrl: string | null;
    iban: string;
    variableSymbol: string;
    totalCents: number;
  } & Record<string, unknown> = {
    orderNumber: order.orderNumber,
    qrCodeDataUrl: order.qrCodeDataUrl ?? null,
    iban,
    variableSymbol,
    totalCents,
  };
  if (process.env.NODE_ENV === "development") {
    if (emailResult.ok) {
      payload.emailSent = true;
      if (emailResult.id) payload.resendEmailId = emailResult.id;
    } else {
      payload.emailSent = false;
      const msg = emailResultMessage(emailResult);
      if (msg) payload.emailIssue = msg;
    }
    if (!emailResult.ok) {
      console.warn("[api/orders] Email problém:", emailResult);
    }
  }

  return NextResponse.json(payload);
}
