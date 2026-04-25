import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminGuard";
import { fileToBytes } from "@/lib/bytes";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true, _count: { select: { images: true } } },
  });
  if (!product) {
    return NextResponse.json({ error: "Produkt neexistuje." }, { status: 404 });
  }

  const form = await req.formData();
  const files = form.getAll("images");
  if (files.length === 0) {
    return NextResponse.json({ error: "Žiadne súbory." }, { status: 400 });
  }

  const startOrder = product._count.images;
  const created: { id: string }[] = [];

  for (let idx = 0; idx < files.length; idx++) {
    const f = files[idx];
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
    const img = await prisma.productImage.create({
      data: {
        productId: id,
        data: buf,
        mimeType: f.type,
        sortOrder: startOrder + idx,
        isPrimary: startOrder === 0 && idx === 0,
      },
      select: { id: true },
    });
    created.push(img);
  }

  return NextResponse.json({ created });
}
