import fs from "node:fs";
import path from "node:path";

import PDFDocument from "pdfkit";

import { BRAND_NAME } from "@/lib/brand";
import { COMPANY_CONTACT } from "@/lib/companyContact";
import { formatDate, formatPrice } from "@/lib/format";

/** Farby značky — rovnaké ako `globals.css` a email šablóny. */
const C = {
  brand: "#2DAEEC",
  brandDark: "#1F8FC9",
  accent: "#F08A3E",
  text: "#171717",
  muted: "#737373",
  border: "#e8e8e8",
  tint: "#e8f4fb",
  warmTint: "#fff5ed",
  white: "#ffffff",
} as const;

export type InvoiceOrderData = {
  orderNumber: string;
  createdAt: Date;
  customerName: string;
  customerEmail: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  shippingLabel: string | null;
  packetaPointName: string | null;
  packetaPointAddress: string | null;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  promoSnapshot: string | null;
  items: {
    productName: string;
    quantity: number;
    unitPriceCents: number;
  }[];
};

export function getInvoiceNumber(orderNumber: string): string {
  return orderNumber;
}

export function getVariableSymbol(orderNumber: string): string {
  const digits = orderNumber.replace(/\D/g, "");
  return digits.length > 0 ? digits : orderNumber;
}

function dejavuFontPath(file: string): string {
  return path.join(
    process.cwd(),
    "node_modules",
    "dejavu-fonts-ttf",
    "ttf",
    file
  );
}

function readDejaVuFont(file: string): Buffer {
  const fontPath = dejavuFontPath(file);
  return fs.readFileSync(fontPath);
}

function customerAddressLines(order: InvoiceOrderData): string[] {
  if (order.packetaPointName) {
    const lines = [order.packetaPointName];
    if (order.packetaPointAddress) lines.push(order.packetaPointAddress);
    return lines;
  }
  return [
    order.address,
    `${order.postalCode} ${order.city}`,
    order.country,
  ];
}

/** Vypíše riadky pod sebou s reálnou výškou (wrap v rámci stĺpca). */
function writeStackedLines(
  doc: PDFKit.PDFDocument,
  x: number,
  startY: number,
  width: number,
  lines: string[],
  gap = 4
): number {
  let currentY = startY;
  doc.fillColor(C.text).font("Regular").fontSize(10);
  for (const line of lines) {
    doc.text(line, x, currentY, { width, lineGap: 2 });
    currentY = doc.y + gap;
  }
  return currentY;
}

/**
 * Vygeneruje PDF faktúru v štýle webu (brand farby, tabuľka položiek).
 */
export async function generateInvoicePdf(
  order: InvoiceOrderData
): Promise<Buffer> {
  const invoiceNumber = getInvoiceNumber(order.orderNumber);
  const issueDate = formatDate(new Date());
  const orderDate = formatDate(order.createdAt);
  const variableSymbol = getVariableSymbol(order.orderNumber);
  const itemsSubtotal = order.items.reduce(
    (s, it) => s + it.unitPriceCents * it.quantity,
    0
  );

  const iban = process.env.PAYMENT_IBAN?.trim() ?? "";

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 48 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.registerFont("Regular", readDejaVuFont("DejaVuSans.ttf"));
    doc.registerFont("Bold", readDejaVuFont("DejaVuSans-Bold.ttf"));

    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - 96;

    // Brand header
    doc.save();
    doc.rect(0, 0, pageWidth, 72).fill(C.brand);
    doc.rect(0, 68, pageWidth, 4).fill(C.accent);
    doc.fillColor(C.white).font("Bold").fontSize(22).text(BRAND_NAME, 48, 22);
    doc
      .font("Regular")
      .fontSize(10)
      .fillColor(C.white)
      .text("3D výtlačky & tlač na mieru", 48, 46);
    doc.restore();

    let y = 92;

    doc.fillColor(C.brandDark).font("Bold").fontSize(24).text("FAKTÚRA", 48, y);
    y += 34;

    doc.fillColor(C.muted).font("Regular").fontSize(10).text("Číslo faktúry", 48, y);
    doc
      .fillColor(C.text)
      .font("Bold")
      .fontSize(12)
      .text(invoiceNumber, 48, y + 12);

    doc.fillColor(C.muted).font("Regular").fontSize(10).text("Dátum vystavenia", 200, y);
    doc
      .fillColor(C.text)
      .font("Regular")
      .fontSize(12)
      .text(issueDate, 200, y + 12);

    doc.fillColor(C.muted).font("Regular").fontSize(10).text("Variabilný symbol", 360, y);
    doc
      .fillColor(C.text)
      .font("Bold")
      .fontSize(12)
      .text(variableSymbol, 360, y + 12);

    y += 44;

    // Dodávateľ / Odberateľ
    const colWidth = contentWidth / 2 - 8;

    doc.fillColor(C.brandDark).font("Bold").fontSize(11).text("Dodávateľ", 48, y);
    doc.fillColor(C.brandDark).font("Bold").fontSize(11).text("Odberateľ", 48 + colWidth + 16, y);
    y += 16;

    const sellerLines = [
      COMPANY_CONTACT.legalName,
      COMPANY_CONTACT.address,
      `IČO: ${COMPANY_CONTACT.ico}`,
      `DIČ: ${COMPANY_CONTACT.dic}`,
      COMPANY_CONTACT.email,
    ];

    const buyerLines = [
      order.customerName,
      ...customerAddressLines(order),
      order.customerEmail,
    ];

    const sellerEndY = writeStackedLines(doc, 48, y, colWidth, sellerLines);
    const buyerEndY = writeStackedLines(
      doc,
      48 + colWidth + 16,
      y,
      colWidth,
      buyerLines
    );

    y = Math.max(sellerEndY, buyerEndY) + 12;

    doc
      .fillColor(C.muted)
      .font("Regular")
      .fontSize(9)
      .text(`Objednávka ${order.orderNumber} · ${orderDate}`, 48, y);
    y += 22;

    // Table header
    const colProduct = contentWidth * 0.46;
    const colQty = 44;
    const colUnit = 88;
    const colTotal = contentWidth - colProduct - colQty - colUnit;
    const tableX = 48;

    doc.save();
    doc.roundedRect(tableX, y, contentWidth, 22, 4).fill(C.tint);
    doc.restore();

    doc.fillColor(C.brandDark).font("Bold").fontSize(9);
    doc.text("Produkt", tableX + 8, y + 6, { width: colProduct - 8 });
    doc.text("Ks", tableX + colProduct, y + 6, { width: colQty, align: "center" });
    doc.text("Cena / ks", tableX + colProduct + colQty, y + 6, {
      width: colUnit,
      align: "right",
    });
    doc.text("Spolu", tableX + colProduct + colQty + colUnit, y + 6, {
      width: colTotal - 8,
      align: "right",
    });

    y += 26;

    doc.fillColor(C.text).font("Regular").fontSize(9);

    for (const item of order.items) {
      const lineTotal = item.unitPriceCents * item.quantity;
      const rowHeight = Math.max(
        20,
        doc.heightOfString(item.productName, { width: colProduct - 8 }) + 8
      );

      doc
        .moveTo(tableX, y + rowHeight)
        .lineTo(tableX + contentWidth, y + rowHeight)
        .strokeColor(C.border)
        .lineWidth(0.5)
        .stroke();

      doc.text(item.productName, tableX + 8, y + 4, { width: colProduct - 8 });
      doc.text(String(item.quantity), tableX + colProduct, y + 4, {
        width: colQty,
        align: "center",
      });
      doc.text(formatPrice(item.unitPriceCents), tableX + colProduct + colQty, y + 4, {
        width: colUnit,
        align: "right",
      });
      doc.text(formatPrice(lineTotal), tableX + colProduct + colQty + colUnit, y + 4, {
        width: colTotal - 8,
        align: "right",
      });

      y += rowHeight;
    }

    y += 8;

    const summaryX = tableX + contentWidth - 220;
    const summaryWidth = 220;
    const summaryLabelWidth = summaryWidth - 70;
    const summaryValueWidth = 70;

    function summaryRow(
      label: string,
      value: string,
      bold = false,
      bgColor?: string
    ) {
      const rowTop = y;
      const labelHeight = doc.heightOfString(label, { width: summaryLabelWidth });
      const valueHeight = doc.heightOfString(value, {
        width: summaryValueWidth,
      });
      const rowHeight = Math.max(labelHeight, valueHeight) + 4;

      if (bgColor) {
        doc.save();
        doc
          .rect(summaryX - 8, rowTop - 2, summaryWidth + 8, rowHeight + 4)
          .fill(bgColor);
        doc.restore();
      }

      doc.fillColor(C.muted).font(bold ? "Bold" : "Regular").fontSize(10);
      doc.text(label, summaryX, rowTop, { width: summaryLabelWidth, lineGap: 2 });
      const rowBottom = doc.y;
      doc.fillColor(C.text).font(bold ? "Bold" : "Regular").fontSize(10);
      doc.text(value, summaryX + summaryLabelWidth, rowTop, {
        width: summaryValueWidth,
        align: "right",
        lineGap: 2,
      });
      y = Math.max(rowBottom, doc.y) + 6;
    }

    summaryRow("Medzisúčet", formatPrice(itemsSubtotal));

    if (order.discountCents > 0) {
      const promoLabel = order.promoSnapshot
        ? `Zľava (${order.promoSnapshot})`
        : "Zľava";
      summaryRow(
        promoLabel,
        `−${formatPrice(order.discountCents)}`,
        false,
        C.warmTint
      );
    }

    if (order.shippingLabel) {
      summaryRow(
        `Doprava (${order.shippingLabel})`,
        order.shippingCents === 0 ? "Zdarma" : formatPrice(order.shippingCents)
      );
    }

    y += 4;
    doc
      .moveTo(summaryX, y)
      .lineTo(summaryX + summaryWidth, y)
      .strokeColor(C.brand)
      .lineWidth(1.5)
      .stroke();
    y += 8;

    doc.fillColor(C.text).font("Bold").fontSize(12);
    doc.text("Celkom", summaryX, y, { width: summaryWidth - 80 });
    doc.fillColor(C.brandDark).font("Bold").fontSize(14);
    doc.text(formatPrice(order.totalCents), summaryX + summaryWidth - 80, y, {
      width: 80,
      align: "right",
    });

    y += 36;

    doc
      .fillColor(C.text)
      .font("Regular")
      .fontSize(10)
      .text("Stav platby: zaplatené", 48, y);

    if (iban) {
      y += 18;
      doc
        .fillColor(C.muted)
        .font("Regular")
        .fontSize(9)
        .text(`IBAN: ${iban}`, 48, y);
    }

    y += 28;
    doc
      .fillColor(C.muted)
      .font("Regular")
      .fontSize(8)
      .text(COMPANY_CONTACT.registryLines.join(" · "), 48, y, {
        width: contentWidth,
        align: "center",
      });

    doc.end();
  });
}

export function invoicePdfFilename(orderNumber: string): string {
  const safe = orderNumber.replace(/[^\w-]+/g, "-");
  return `faktura-${safe}.pdf`;
}
