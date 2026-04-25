import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminGuard";
import { slugify } from "@/lib/format";
import { fileToBytes } from "@/lib/bytes";

export const runtime = "nodejs";

const VALID_CATEGORIES = ["PRAKTICKE", "DEKORATIVNE", "HRACKY", "DOPLNKY", "INE"];
const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB per image

async function uniqueSlug(base: string): Promise<string> {
  const root = base || "produkt";
  let candidate = root;
  let i = 1;
  // up to ~100 attempts to deduplicate
  while (await prisma.product.findUnique({ where: { slug: candidate } })) {
    i += 1;
    candidate = `${root}-${i}`;
    if (i > 100) {
      candidate = `${root}-${Date.now()}`;
      break;
    }
  }
  return candidate;
}

export async function POST(req: Request) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const form = await req.formData();

  const name = String(form.get("name") ?? "").trim();
  const slugInput = String(form.get("slug") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  const shortDescription = String(form.get("shortDescription") ?? "").trim();
  const priceCents = Number(form.get("priceCents") ?? 0);
  const stock = Number(form.get("stock") ?? 0);
  const category = String(form.get("category") ?? "INE");
  const isActive = form.get("isActive") === "true";
  const isFeaturedHome = form.get("isFeaturedHome") === "true";
  const isHitOfWeek = form.get("isHitOfWeek") === "true";
  const homeSortOrder = Number(form.get("homeSortOrder") ?? 0);

  if (name.length < 2) {
    return NextResponse.json({ error: "Názov je príliš krátky." }, { status: 400 });
  }
  if (!Number.isFinite(priceCents) || priceCents < 0) {
    return NextResponse.json({ error: "Neplatná cena." }, { status: 400 });
  }
  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Neplatná kategória." }, { status: 400 });
  }

  const slug = await uniqueSlug(slugInput ? slugify(slugInput) : slugify(name));

  const images = form.getAll("images");
  const imageData: {
    data: Uint8Array<ArrayBuffer>;
    mimeType: string;
    sortOrder: number;
    isPrimary: boolean;
  }[] = [];
  for (let idx = 0; idx < images.length; idx++) {
    const f = images[idx];
    if (!(f instanceof File) || f.size === 0) continue;
    if (f.size > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: `Obrázok ${f.name} je väčší ako 8 MB.` },
        { status: 400 }
      );
    }
    if (!f.type.startsWith("image/")) {
      return NextResponse.json(
        { error: `Súbor ${f.name} nie je obrázok.` },
        { status: 400 }
      );
    }
    const buf = await fileToBytes(f);
    imageData.push({
      data: buf,
      mimeType: f.type,
      sortOrder: idx,
      isPrimary: idx === 0,
    });
  }

  const product = await prisma.product.create({
    data: {
      slug,
      name,
      description,
      shortDescription: shortDescription || null,
      priceCents: Math.round(priceCents),
      stock: Math.round(stock),
      category: category as
        | "PRAKTICKE"
        | "DEKORATIVNE"
        | "HRACKY"
        | "DOPLNKY"
        | "INE",
      isActive,
      isFeaturedHome,
      isHitOfWeek,
      homeSortOrder: Math.round(homeSortOrder),
      images: {
        create: imageData,
      },
    },
  });

  return NextResponse.json({ id: product.id, slug: product.slug });
}
