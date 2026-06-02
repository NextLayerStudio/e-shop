import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminGuard";
import { slugify } from "@/lib/format";
import { fileToBytes } from "@/lib/bytes";
import {
  DEFAULT_PRODUCT_CATEGORY,
  isValidProductCategory,
  type ProductCategoryValue,
} from "@/lib/productCategories";
import { parseVariantFields } from "@/lib/productVariants";

export const runtime = "nodejs";
const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB per image

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|avif|bmp|heic|heif)$/i;

function isLikelyImageFile(f: File): boolean {
  if (f.type.startsWith("image/")) return true;
  return IMAGE_EXT.test(f.name);
}

function mimeForImageFile(f: File): string {
  if (f.type && f.type.startsWith("image/")) return f.type;
  const lower = f.name.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".heic") || lower.endsWith(".heif")) return "image/heic";
  if (lower.endsWith(".avif")) return "image/avif";
  return "image/jpeg";
}

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
  const category = String(form.get("category") ?? DEFAULT_PRODUCT_CATEGORY);
  const isActive = form.get("isActive") === "true";
  const isFeaturedHome = form.get("isFeaturedHome") === "true";
  const isHitOfWeek = form.get("isHitOfWeek") === "true";
  const homeSortOrder = Number(form.get("homeSortOrder") ?? 0);
  const variants = parseVariantFields(form);

  if (name.length < 2) {
    return NextResponse.json({ error: "Názov je príliš krátky." }, { status: 400 });
  }
  if ("error" in variants) {
    return NextResponse.json({ error: variants.error }, { status: 400 });
  }
  if (!Number.isFinite(priceCents) || priceCents < 0) {
    return NextResponse.json({ error: "Neplatná cena." }, { status: 400 });
  }
  if (!Number.isFinite(stock) || stock < 0) {
    return NextResponse.json(
      { error: "Neplatný počet kusov na sklade." },
      { status: 400 }
    );
  }
  const stockRounded = Math.round(stock);
  if (!isValidProductCategory(category)) {
    return NextResponse.json({ error: "Neplatná kategória." }, { status: 400 });
  }

  const slug = await uniqueSlug(slugInput ? slugify(slugInput) : slugify(name));

  const rawImages = form.getAll("images");
  const imageData: {
    data: Uint8Array<ArrayBuffer>;
    mimeType: string;
    sortOrder: number;
    isPrimary: boolean;
  }[] = [];
  let idx = 0;
  for (const entry of rawImages) {
    if (!(entry instanceof File) || entry.size === 0) continue;
    if (entry.size > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: `Obrázok ${entry.name} je väčší ako 8 MB.` },
        { status: 400 }
      );
    }
    if (!isLikelyImageFile(entry)) {
      return NextResponse.json(
        { error: `Súbor „${entry.name}“ nevyzerá ako obrázok (JPEG, PNG, WebP, HEIC…).` },
        { status: 400 }
      );
    }
    const buf = await fileToBytes(entry);
    imageData.push({
      data: buf,
      mimeType: mimeForImageFile(entry),
      sortOrder: idx,
      isPrimary: idx === 0,
    });
    idx += 1;
  }

  try {
    const product = await prisma.product.create({
      data: {
        slug,
        name,
        description,
        shortDescription: shortDescription || null,
        priceCents: Math.round(priceCents),
        stock: stockRounded,
        category: category as ProductCategoryValue,
        isActive,
        isFeaturedHome,
        isHitOfWeek,
        hasVariants: variants.hasVariants,
        figurkaPriceCents: variants.figurkaPriceCents,
        klucenkaPriceCents: variants.klucenkaPriceCents,
        homeSortOrder: Math.round(
          Number.isFinite(homeSortOrder) ? homeSortOrder : 0
        ),
        ...(imageData.length > 0
          ? { images: { create: imageData } }
          : {}),
      },
    });

    return NextResponse.json({ id: product.id, slug: product.slug });
  } catch (e: unknown) {
    console.error("[admin/products POST]", e);
    const msg =
      e && typeof e === "object" && "message" in e
        ? String((e as { message: unknown }).message)
        : "";
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "development" && msg
            ? msg
            : "Nepodarilo sa vytvoriť produkt (skontroluj polia alebo databázu).",
      },
      { status: 500 }
    );
  }
}
