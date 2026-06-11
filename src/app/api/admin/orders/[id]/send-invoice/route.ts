import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/adminGuard";
import { COMPANY_CONTACT } from "@/lib/companyContact";
import { emailResultMessage, sendInvoiceEmail } from "@/lib/email";
import {
  generateInvoicePdf,
  getInvoiceNumber,
  invoicePdfFilename,
  type InvoiceOrderData,
} from "@/lib/invoice";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const bodySchema = z.object({
  sendToCustomer: z.boolean(),
  sendToSelf: z.boolean(),
  sendToAccountant: z.boolean(),
});

/** Admin odošle PDF faktúru zákazníkovi a/alebo na firemný email. */
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
      { error: "Vyber aspoň jedného príjemcu faktúry." },
      { status: 400 }
    );
  }

  const { sendToCustomer, sendToSelf, sendToAccountant } = parsed.data;
  if (!sendToCustomer && !sendToSelf && !sendToAccountant) {
    return NextResponse.json(
      { error: "Vyber aspoň jedného príjemcu faktúry." },
      { status: 400 }
    );
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Objednávka neexistuje." }, { status: 404 });
  }

  if (order.status !== "PAID") {
    return NextResponse.json(
      { error: "Faktúru možno odoslať len pre zaplatenú objednávku." },
      { status: 400 }
    );
  }

  const invoiceData: InvoiceOrderData = {
    orderNumber: order.orderNumber,
    createdAt: order.createdAt,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    address: order.address,
    city: order.city,
    postalCode: order.postalCode,
    country: order.country,
    shippingLabel: order.shippingLabel,
    packetaPointName: order.packetaPointName,
    packetaPointAddress: order.packetaPointAddress,
    discountCents: order.discountCents,
    shippingCents: order.shippingCents,
    totalCents: order.totalCents,
    promoSnapshot: order.promoSnapshot,
    items: order.items.map((it) => ({
      productName: it.productName,
      quantity: it.quantity,
      unitPriceCents: it.unitPriceCents,
    })),
  };

  const pdfBuffer = await generateInvoicePdf(invoiceData).catch((err) => {
    console.error("[send-invoice] PDF generation failed:", err);
    return null;
  });
  if (!pdfBuffer) {
    return NextResponse.json(
      { error: "Nepodarilo sa vygenerovať PDF faktúru." },
      { status: 500 }
    );
  }
  const pdfBase64 = pdfBuffer.toString("base64");
  const filename = invoicePdfFilename(order.orderNumber);
  const invoiceNumber = getInvoiceNumber(order.orderNumber);

  const itemsSubtotal = order.items.reduce(
    (s, it) => s + it.unitPriceCents * it.quantity,
    0
  );

  const emailInput = {
    customerName: order.customerName,
    orderNumber: order.orderNumber,
    invoiceNumber,
    shippingLabel: order.shippingLabel ?? "—",
    lines: order.items.map((it) => ({
      productName: it.productName,
      quantity: it.quantity,
      unitPriceCents: it.unitPriceCents,
      lineTotalCents: it.unitPriceCents * it.quantity,
    })),
    subtotalCents: itemsSubtotal,
    discountCents: order.discountCents,
    shippingCents: order.shippingCents,
    totalCents: order.totalCents,
    pdfBase64,
    pdfFilename: filename,
  };

  const results: {
    customer?: { sent: boolean; error?: string | null; id?: string };
    self?: { sent: boolean; error?: string | null; id?: string };
    accountant?: { sent: boolean; error?: string | null; id?: string };
  } = {};

  if (sendToCustomer) {
    const emailResult = await sendInvoiceEmail({
      ...emailInput,
      to: order.customerEmail,
      recipientKind: "customer",
    });
    results.customer = {
      sent: emailResult.ok,
      error: emailResult.ok ? null : emailResultMessage(emailResult),
      id: emailResult.ok ? emailResult.id : undefined,
    };
  }

  if (sendToSelf) {
    const emailResult = await sendInvoiceEmail({
      ...emailInput,
      to: COMPANY_CONTACT.email,
      recipientKind: "admin",
    });
    results.self = {
      sent: emailResult.ok,
      error: emailResult.ok ? null : emailResultMessage(emailResult),
      id: emailResult.ok ? emailResult.id : undefined,
    };
  }

  if (sendToAccountant) {
    const emailResult = await sendInvoiceEmail({
      ...emailInput,
      to: COMPANY_CONTACT.accountantEmail,
      recipientKind: "accountant",
    });
    results.accountant = {
      sent: emailResult.ok,
      error: emailResult.ok ? null : emailResultMessage(emailResult),
      id: emailResult.ok ? emailResult.id : undefined,
    };
  }

  const anySent =
    (results.customer?.sent ?? false) ||
    (results.self?.sent ?? false) ||
    (results.accountant?.sent ?? false);
  const allRequestedSent =
    (!sendToCustomer || results.customer?.sent) &&
    (!sendToSelf || results.self?.sent) &&
    (!sendToAccountant || results.accountant?.sent);

  return NextResponse.json({
    ok: true,
    emailSent: anySent,
    allSent: allRequestedSent,
    results,
  });
}
