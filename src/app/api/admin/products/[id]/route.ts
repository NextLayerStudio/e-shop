import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminGuard";
import { slugify } from "@/lib/format";
import {
  DEFAULT_PRODUCT_CATEGORY,
  isValidProductCategory,
} from "@/lib/productCategories";
import { parseVariantFields } from "@/lib/productVariants";

export const runtime = "nodejs";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const { id } = await params;

  const exists = await prisma.product.findUnique({ where: { id } });
  if (!exists) {
    return NextResponse.json({ error: "Produkt neexistuje." }, { status: 404 });
  }

  const contentType = req.headers.get("content-type") ?? "";
  const data: Record<string, unknown> = {};

  if (contentType.includes("application/json")) {
    // Quick toggle endpoint
    const body = await req.json().catch(() => ({}));
    for (const key of [
      "isActive",
      "isFeaturedHome",
      "isHitOfWeek",
    ] as const) {
      if (typeof body[key] === "boolean") data[key] = body[key];
    }
    if (typeof body.stock === "number" && body.stock >= 0) {
      data.stock = Math.round(body.stock);
    }
    if (typeof body.homeSortOrder === "number") {
      data.homeSortOrder = Math.round(body.homeSortOrder);
    }
  } else {
    // Form data from edit page
    const form = await req.formData();
    const name = String(form.get("name") ?? "").trim();
    const slugInput = String(form.get("slug") ?? "").trim();
    const description = String(form.get("description") ?? "").trim();
    const shortDescription = String(form.get("shortDescription") ?? "").trim();
    const priceCents = Number(form.get("priceCents") ?? 0);
    const stock = Number(form.get("stock") ?? 0);
    const category = String(form.get("category") ?? DEFAULT_PRODUCT_CATEGORY);

    if (name.length < 2) {
      return NextResponse.json({ error: "Názov je príliš krátky." }, { status: 400 });
    }
    if (!isValidProductCategory(category)) {
      return NextResponse.json({ error: "Neplatná kategória." }, { status: 400 });
    }

    const variants = parseVariantFields(form);
    if ("error" in variants) {
      return NextResponse.json({ error: variants.error }, { status: 400 });
    }

    let newSlug = slugInput ? slugify(slugInput) : slugify(name);
    if (newSlug !== exists.slug) {
      // dedupe
      let candidate = newSlug || "produkt";
      let i = 1;
      while (
        await prisma.product.findFirst({
          where: { slug: candidate, NOT: { id } },
        })
      ) {
        i += 1;
        candidate = `${newSlug}-${i}`;
        if (i > 100) {
          candidate = `${newSlug}-${Date.now()}`;
          break;
        }
      }
      newSlug = candidate;
    }

    Object.assign(data, {
      name,
      slug: newSlug,
      description,
      shortDescription: shortDescription || null,
      priceCents: Math.round(priceCents),
      stock: Math.round(stock),
      category,
      isActive: form.get("isActive") === "true",
      isFeaturedHome: form.get("isFeaturedHome") === "true",
      isHitOfWeek: form.get("isHitOfWeek") === "true",
      hasVariants: variants.hasVariants,
      figurkaPriceCents: variants.figurkaPriceCents,
      klucenkaPriceCents: variants.klucenkaPriceCents,
      homeSortOrder: Math.round(Number(form.get("homeSortOrder") ?? 0)),
    });
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Žiadne dáta na uloženie." }, { status: 400 });
  }

  const updated = await prisma.product.update({
    where: { id },
    data,
  });

  return NextResponse.json({ id: updated.id, slug: updated.slug });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const { id } = await params;
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
