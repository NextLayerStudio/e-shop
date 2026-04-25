import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const orderSchema = z.object({
  customerName: z.string().min(2).max(120),
  customerEmail: z.string().email(),
  customerPhone: z.string().max(40).optional().or(z.literal("")),
  address: z.string().min(2).max(200),
  city: z.string().min(1).max(120),
  postalCode: z.string().min(3).max(20),
  country: z.string().min(2).max(80),
  note: z.string().max(2000).optional().or(z.literal("")),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1).max(999),
      })
    )
    .min(1)
    .max(100),
});

function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, "0");
  return `${year}-${rand}`;
}

export async function POST(req: Request) {
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

  const totalCents = data.items.reduce((sum, item) => {
    const p = productMap.get(item.productId)!;
    return sum + p.priceCents * item.quantity;
  }, 0);

  const orderNumber = generateOrderNumber();

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

  return NextResponse.json({ orderNumber: order.orderNumber });
}
